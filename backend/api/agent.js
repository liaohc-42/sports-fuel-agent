/* ============================================================
 * api/agent.js —— 多后端大模型代理（GLM / DeepSeek / Ollama）
 *
 * 设计原则（对应答辩要求）：
 *   - 大模型只做「解释、鼓励、问答」，不做评分/热量等确定性计算；
 *   - 输出必须通过 JSON Schema + 规则校验；
 *   - 校验失败 → 回退到本地模板，绝不把错误答案直接抛给用户。
 * ============================================================ */
'use strict';

const SYSTEM_PROMPT = [
  '你是一位专业的「运动营养与体能教练」智能体，服务对象是中国的大学生。',
  '你的建议依据《中国居民膳食指南(2022)》《国家学生体质健康标准(2014年修订)》等权威资料。',
  '请遵守：',
  '1. 不提供医疗诊断，不承诺"包过/保证提分"；涉及伤病时明确建议就医，并推荐无冲击替代动作。',
  '2. 营养数据为估算时，标注「估算值」。',
  '3. 用中文、简洁实用。',
  '4. 强调科学训练、防伤、长期习惯，避免"应试投机"的观感。',
].join('\n');

// 让模型输出结构化 JSON 的指令
const JSON_INSTRUCTION = '\n\n【输出格式】只输出 JSON，不要 markdown 代码块，不要多余文字：\n{"answer":"一句话核心回答(<=60字)","points":["要点1","要点2","要点3"],"caution":"一句注意事项"}';

function buildPrompt(type, payload) {
  const p = payload || {};
  switch (type) {
    case 'meal': {
      const dishes = (p.dishes || []).map(d =>
        `${d.name}(约${d.nutrition ? d.nutrition.kcal : '?'}千卡，蛋白${d.nutrition ? d.nutrition.protein : '?'}g/脂肪${d.nutrition ? d.nutrition.fat : '?'}g)`).join('、');
      return [
        '任务：点评这顿搭配并给可执行改进。',
        `目标：${p.goal || '维持'}；运动：${p.exercise || '无'}(${p.exerciseKcal || 0}千卡)。`,
        `菜品：${dishes || '(无)'}。预算：${p.budget ? p.budget + '元' : '不限'}。`,
        '要点：①是否贴合目标 ②1~2条改进 ③不合适菜的替代。',
      ].join('\n');
    }
    case 'adjust':
      return `任务：用户改了这餐，给未来1~2餐建议。目标${p.goal || '维持'}，摄入约${p.eatenKcal || 0}千卡，体重${p.weightKg || 60}kg。判断多吃/少吃/正常。`;
    case 'budget':
      return `任务：给大学生月饮食花销建议。预算${p.budget || 1200}元，日均${p.pastAvg ? Math.round(p.pastAvg) + '元' : '未知'}。给每日分配、省钱技巧。`;
    case 'sport':
      return `任务：按运动统计给建议。区间${p.period === 'week' ? '本周' : p.period === 'month' ? '本月' : '今年'}，${p.totalMin || 0}分钟/${p.totalKcal || 0}千卡/${p.sessions || 0}次。给强度调整。`;
    case 'coach':
    default:
      return `用户问题：${p.question || '你好'}\n以运动营养/体能教练身份回答。`;
  }
}

// ---------- JSON 解析 + Schema/规则校验 ----------
function parseJson(text) {
  if (!text) return null;
  var s = String(text).trim();
  // 去掉可能的 ```json 包裹
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  var i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i < 0 || j < 0) return null;
  try { return JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; }
}

function validate(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.answer !== 'string' || !obj.answer.trim()) return false;
  if (obj.points != null && !Array.isArray(obj.points)) return false;
  if (Array.isArray(obj.points) && obj.points.some(function (x) { return typeof x !== 'string'; })) return false;
  if (obj.caution != null && typeof obj.caution !== 'string') return false;
  // 规则校验：不得出现承诺性/绝对化表述
  var all = (obj.answer + ' ' + (obj.points || []).join(' ') + ' ' + (obj.caution || '')).toLowerCase();
  if (/包过|保证提分|百分百|一定能过|绝对能/.test(all)) return false;
  return true;
}

function formatAnswer(obj) {
  var t = obj.answer.trim();
  if (Array.isArray(obj.points) && obj.points.length) t += '\n\n' + obj.points.filter(Boolean).map(function (x) { return '• ' + x; }).join('\n');
  if (obj.caution) t += '\n\n⚠️ ' + obj.caution;
  return t;
}

// ---------- 模板回退（规则生成，保证永远有可用回答） ----------
function fallback(type, p) {
  p = p || {};
  if (type === 'meal') return '这顿搭配已按目标生成（详见右侧卡片）。建议：主食+优质蛋白+蔬菜各一份，油炸与含糖饮料少碰；若某道菜偏油，可换成同窗口的清蒸/白灼做法。';
  if (type === 'adjust') return '已记录这一餐。若这餐偏多，下一餐主食减半、以蛋白和蔬菜为主；若偏少，下一餐补一份主食或蛋奶。';
  if (type === 'budget') return '建议每天早餐 4–6 元、午/晚餐各 10–14 元，自选窗口一荤一素最省钱；少喝奶茶、少点宵夜。';
  if (type === 'sport') return '建议有氧与力量交替：每周 3 次有氧 + 2 次力量，注意恢复与睡眠，避免连续高强度。';
  return '我是练完吃啥的智能教练：可以问我运动训练、食堂搭配、减脂增肌、体测提分。';
}

// ---------- 调用各后端 ----------
async function callOpenAICompatible(endpoint, key, model, messages) {
  var resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: model, messages: messages, temperature: 0.7, max_tokens: 700 }),
  });
  if (!resp.ok) throw new Error('API ' + resp.status + ' ' + (await resp.text()).slice(0, 160));
  var data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

async function callOllama(baseUrl, model, messages) {
  var url = String(baseUrl).replace(/\/$/, '') + '/api/chat';
  var resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model, messages: messages, stream: false }),
  });
  if (!resp.ok) throw new Error('Ollama ' + resp.status + ' ' + (await resp.text()).slice(0, 160));
  var data = await resp.json();
  return (data.message && data.message.content) || '';
}

// 选后端：请求里显式 provider > 环境变量 PROVIDER > 有哪个 key 用哪个
function pickProvider(override) {
  var prov = (override && override.provider) || process.env.PROVIDER || '';
  if (!prov) {
    if (process.env.OLLAMA_BASE_URL) prov = 'ollama';
    else if (process.env.DEEPSEEK_API_KEY) prov = 'deepseek';
    else if (process.env.GLM_API_KEY) prov = 'glm';
  }
  if (prov === 'ollama') {
    if (!process.env.OLLAMA_BASE_URL) return null;
    return {
      name: 'Ollama·' + (process.env.OLLAMA_MODEL || 'qwen2.5'),
      cfg: {},
      call: function (cfg, messages) { return callOllama(process.env.OLLAMA_BASE_URL, process.env.OLLAMA_MODEL || 'qwen2.5', messages); },
    };
  }
  if (prov === 'deepseek') {
    var dk = (override && override.key) || process.env.DEEPSEEK_API_KEY;
    if (!dk) return null;
    var dModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4.1-flash';
    return {
      name: 'DeepSeek·' + dModel,
      cfg: {},
      call: function (cfg, messages) { return callOpenAICompatible('https://api.deepseek.com/chat/completions', dk, dModel, messages); },
    };
  }
  if (prov === 'glm') {
    var gk = (override && override.key) || process.env.GLM_API_KEY;
    if (!gk) return null;
    var gModel = process.env.GLM_MODEL || 'glm-4-flash';
    return {
      name: 'GLM·' + gModel,
      cfg: {},
      call: function (cfg, messages) { return callOpenAICompatible('https://open.bigmodel.cn/api/paas/v4/chat/completions', gk, gModel, messages); },
    };
  }
  return null;
}

// 主入口：返回 {text, engine} 或 null（无可用后端）
async function runAgent(type, payload, override) {
  var prov = pickProvider(override);
  if (!prov) return null;
  var messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt(type, payload) + JSON_INSTRUCTION },
  ];
  var raw;
  try {
    raw = await prov.call(prov.cfg, messages);
  } catch (e) {
    return { text: fallback(type, payload), engine: prov.name + '·模板回退' };
  }
  var obj = parseJson(raw);
  if (obj && validate(obj)) {
    return { text: formatAnswer(obj), engine: prov.name };
  }
  // 校验失败 → 模板回退
  return { text: fallback(type, payload), engine: prov.name + '·模板回退' };
}

// ---------- 视觉识别（菜品图片 → 识别菜名） ----------
const VISION_PROMPT = [
  '识别这张图片里的菜品（可能是食堂窗口/菜单照片，也可能是单道菜）。',
  '只输出 JSON，不要多余文字：{"dishes":["菜名1","菜名2"]}',
  '菜名用中文、尽量简短（如"红烧肉""番茄炒蛋"）；识别不出就给空数组。',
].join('\n');

async function callGLMVision(apiKey, imageB64, mime) {
  var url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  var resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: process.env.GLM_VISION_MODEL || 'glm-4v-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: 'data:' + (mime || 'image/jpeg') + ';base64,' + imageB64 } },
          { type: 'text', text: VISION_PROMPT },
        ],
      }],
      max_tokens: 400,
      temperature: 0.2,
    }),
  });
  if (!resp.ok) throw new Error('GLM-4V ' + resp.status + ' ' + (await resp.text()).slice(0, 160));
  var data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

async function callOllamaVision(baseUrl, model, imageB64) {
  var url = String(baseUrl).replace(/\/$/, '') + '/api/chat';
  var resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model, messages: [{ role: 'user', content: VISION_PROMPT, images: [imageB64] }], stream: false }),
  });
  if (!resp.ok) throw new Error('Ollama ' + resp.status);
  var data = await resp.json();
  return (data.message && data.message.content) || '';
}

// 返回 {dishes, engine} 或 null（无可用视觉模型 / 调用失败）
async function recognizeFood(imageB64, mime) {
  var raw = null, engine = '';
  try {
    if (process.env.GLM_API_KEY) {
      raw = await callGLMVision(process.env.GLM_API_KEY, imageB64, mime);
      engine = 'GLM-4V-Flash';
    } else if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_VISION_MODEL) {
      raw = await callOllamaVision(process.env.OLLAMA_BASE_URL, process.env.OLLAMA_VISION_MODEL, imageB64);
      engine = 'Ollama·' + process.env.OLLAMA_VISION_MODEL;
    } else {
      return null;
    }
  } catch (e) {
    return null; // 视觉模型报错 → 交给前端回退到文字识别
  }
  var obj = parseJson(raw);
  var dishes = obj && Array.isArray(obj.dishes) ? obj.dishes.filter(function (x) { return typeof x === 'string' && x.trim(); }) : [];
  return { dishes: dishes, engine: engine };
}

module.exports = { runAgent, recognizeFood, buildPrompt, validate, parseJson, SYSTEM_PROMPT, pickProvider };
