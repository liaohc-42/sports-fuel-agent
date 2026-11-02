/* ============================================================
 * api/agent.js —— GLM-4-Flash 代理
 * 把前端传来的业务数据整理成提示词，调用智谱大模型，
 * 返回自然语言建议。未配置 Key 时由 server.js 直接降级。
 * ============================================================ */
'use strict';

const ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = [
  '你是一位专业的「运动营养与体能教练」智能体，服务对象是中国的大学生。',
  '你的建议依据《中国居民膳食指南(2022)》《国家学生体质健康标准(2014年修订)》等权威资料。',
  '请遵守：',
  '1. 不提供医疗诊断，不承诺"包过/保证提分"；涉及伤病时明确建议就医，并推荐无冲击替代动作。',
  '2. 营养数据为估算时，标注「估算值」。',
  '3. 用中文，分点清晰、简洁实用；除非用户闲聊，单次回答控制在 250 字以内。',
  '4. 强调科学训练、防伤、长期习惯，避免"应试投机"的观感。',
].join('\n');

// 各业务类型的提示词构造器
function buildPrompt(type, payload) {
  const p = payload || {};
  switch (type) {
    case 'meal': {
      const dishes = (p.dishes || []).map(d =>
        `${d.name}(约${d.nutrition ? d.nutrition.kcal : '?'}千卡，蛋白${d.nutrition ? d.nutrition.protein : '?'}g/脂肪${d.nutrition ? d.nutrition.fat : '?'}g)`).join('、');
      return [
        '任务：点评这顿食堂搭配，并给出改进建议。',
        `用户目标：${p.goal || '维持'}；今日运动：${p.exercise || '无'}(约${p.exerciseKcal || 0}千卡)。`,
        `用户勾选的食堂菜品：${dishes || '(无)'}。`,
        `预算约束：${p.budget ? p.budget + '元' : '不限'}。`,
        '请用 3~5 句话：①这顿搭配是否贴合目标；②1~2 条可立刻执行的改进；③若某道菜不合适，给出同窗口替代(如"白米饭换玉米")。',
      ].join('\n');
    }
    case 'adjust':
      return [
        '任务：用户按实际就餐情况修改了方案，请给出未来 1~2 餐的调整建议。',
        `用户目标：${p.goal || '维持'}；这一餐实际摄入约 ${p.eatenKcal || 0} 千卡；体重 ${p.weightKg || 60}kg。`,
        '请判断"多吃/少吃/正常"，并给出来来 1~2 餐的具体吃法（含主食/蛋白/蔬菜）。',
      ].join('\n');
    case 'budget':
      return [
        '任务：给出大学生一个月饮食花销建议。',
        `用户设定月预算 ${p.budget || 1200} 元；过去平均每天约 ${p.pastAvg ? Math.round(p.pastAvg) + ' 元' : '暂无记录'}。`,
        '请给出：①每日大致分配；②在食堂省钱又吃得营养的具体技巧；③按预算与历史对比给一句提醒。',
      ].join('\n');
    case 'sport':
      return [
        '任务：根据用户近期运动统计给出训练建议。',
        `统计区间：${p.period === 'week' ? '本周' : p.period === 'month' ? '本月' : '今年'}；累计运动 ${p.totalMin || 0} 分钟、约 ${p.totalKcal || 0} 千卡、共 ${p.sessions || 0} 次。`,
        '请用 3~4 句给出运动时间/强度调整建议，兼顾有氧与力量、恢复与防伤。',
      ].join('\n');
    case 'coach':
    default:
      return `用户问题：${p.question || '你好'}\n请以运动营养/体能教练身份回答。`;
  }
}

// 调用智谱 GLM-4-Flash
async function callGLM(apiKey, model, type, payload) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt(type, payload) },
  ];
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: model || 'glm-4-flash',
      messages,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('GLM API ' + resp.status + ' ' + body.slice(0, 200));
  }
  const data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

module.exports = { callGLM, SYSTEM_PROMPT, buildPrompt };
