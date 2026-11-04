/* ============================================================
 * server.js —— 练完吃啥 后端（支持 GLM / DeepSeek / Ollama）
 * 功能：
 *   1. 代理调用大模型（Key 只放后端环境变量，前端不保存）
 *   2. /api/health 健康检查
 *   3. /api/admin/set-key 运行态设置 Key（可选，需 ADMIN_TOKEN）
 *   4. /api/canteen 食堂数据（手动更新）
 * 部署：本地 npm install && npm start → http://localhost:3000
 * ============================================================ */
'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { runAgent, recognizeFood } = require('./api/agent');

const app = express();

// CORS 白名单（同源请求不带 Origin，直接放行）
const ALLOWED_ORIGINS = new Set([
  'https://liaohc-42.github.io',
  'http://120.78.120.161',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.has(origin)),
}));
app.use(express.json({ limit: '1mb' }));

// 极简限流：每 IP 每分钟 60 次（进程内计数，够用；多实例各自计数）
const rlHits = new Map();
app.use('/api/', (req, res, next) => {
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const rec = rlHits.get(ip) || { n: 0, t: now };
  if (now - rec.t > 60000) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  rlHits.set(ip, rec);
  if (rec.n > 60) return res.status(429).json({ ok: false, reason: '请求过于频繁，请稍后再试' });
  next();
});

// 运行态 Key（优先环境变量，其次 /api/admin/set-key 设置）
let runtimeKey = process.env.GLM_API_KEY || process.env.DEEPSEEK_API_KEY || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// 食堂数据（手动更新用）
let canteenData = null;
try {
  const p = path.join(__dirname, 'data', 'canteen.json');
  if (fs.existsSync(p)) canteenData = JSON.parse(fs.readFileSync(p, 'utf-8'));
} catch (e) { canteenData = null; }

function currentProvider() {
  if (process.env.PROVIDER) return process.env.PROVIDER;
  if (process.env.OLLAMA_BASE_URL) return 'ollama';
  if (process.env.DEEPSEEK_API_KEY || (runtimeKey && runtimeKey.indexOf('sk-') === 0)) return 'deepseek';
  if (process.env.GLM_API_KEY || runtimeKey) return 'glm';
  return 'local';
}

// 健康检查
app.get('/api/health', (req, res) => {
  const prov = currentProvider();
  const model = prov === 'ollama' ? (process.env.OLLAMA_MODEL || 'qwen2.5')
    : prov === 'deepseek' ? (process.env.DEEPSEEK_MODEL || 'deepseek-v4.1-flash')
      : (process.env.GLM_MODEL || 'glm-4-flash');
  const vision = !!(process.env.GLM_API_KEY || (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_VISION_MODEL));
  // 三通道配置状态（只暴露布尔值，不泄露 Key）
  const channels = {
    glm: !!process.env.GLM_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    ollama: !!process.env.OLLAMA_BASE_URL,
  };
  res.json({
    ok: true,
    agent: prov !== 'local',
    provider: prov,
    model: model,
    vision: vision,
    visionModel: vision ? (process.env.GLM_API_KEY ? (process.env.GLM_VISION_MODEL || 'glm-4v-flash') : process.env.OLLAMA_VISION_MODEL) : '',
    channels: channels,
    engine: prov === 'local' ? 'local' : prov,
  });
});

// Agent 入口
app.post('/api/agent', async (req, res) => {
  const { type, agentKey, provider, ...payload } = req.body || {};
  const override = { key: agentKey || runtimeKey || undefined, provider: provider || undefined };
  const result = await runAgent(type, payload, override);
  if (!result) {
    return res.json({ ok: false, engine: 'local', reason: '未配置任何后端大模型（GLM_API_KEY / DEEPSEEK_API_KEY / OLLAMA_BASE_URL）' });
  }
  res.json({ ok: true, text: result.text, engine: result.engine });
});

// 视觉识别：菜品图片 → 菜名（需后端视觉大模型）
app.post('/api/vision', async (req, res) => {
  const { image, mime } = req.body || {};
  if (!image) return res.status(400).json({ ok: false, reason: '缺少图片' });
  try {
    const result = await recognizeFood(String(image), mime || 'image/jpeg');
    if (!result) {
      return res.json({ ok: false, engine: 'local', reason: '未配置视觉大模型（GLM_API_KEY 用 GLM-4V，或 OLLAMA_BASE_URL + OLLAMA_VISION_MODEL）' });
    }
    res.json({ ok: true, dishes: result.dishes, engine: result.engine });
  } catch (e) {
    res.status(500).json({ ok: false, engine: 'error', reason: e.message });
  }
});

// 运行态设置 Key（可选）
app.post('/api/admin/set-key', (req, res) => {
  if (ADMIN_TOKEN && req.body && req.body.token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, reason: 'token 错误' });
  }
  if (!req.body || !req.body.key) return res.status(400).json({ ok: false, reason: '缺少 key' });
  runtimeKey = String(req.body.key).trim();
  res.json({ ok: true, msg: 'Key 已设置（仅本次进程有效，重启后失效）' });
});

// 食堂数据
app.get('/api/canteen', (req, res) => { res.json(canteenData || { campuses: [] }); });
app.post('/api/canteen', (req, res) => {
  if (!req.body || !Array.isArray(req.body.campuses)) return res.status(400).json({ ok: false, reason: '格式应为 {campuses:[...]}' });
  canteenData = req.body;
  res.json({ ok: true, msg: '食堂数据已更新（本次进程有效）' });
});

// 根路径提示
app.get('/', (req, res) => {
  res.type('text/plain').send(
    '练完吃啥后端已运行。\n' +
    '接口：\n' +
    '  GET  /api/health        健康检查\n' +
    '  POST /api/agent         代理大模型（GLM/DeepSeek/Ollama）\n' +
    '  GET  /api/canteen       食堂数据\n' +
    '  POST /api/canteen       手动更新食堂数据\n' +
    '  POST /api/admin/set-key 运行态设置 Key(需 ADMIN_TOKEN)\n' +
    '\n配置（环境变量）：\n' +
    '  GLM_API_KEY        智谱 GLM-4-Flash\n' +
    '  DEEPSEEK_API_KEY   DeepSeek（deepseek-chat）\n' +
    '  OLLAMA_BASE_URL    Ollama 本地服务，如 http://localhost:11434\n' +
    '  OLLAMA_MODEL       Ollama 模型名，如 qwen2.5\n'
  );
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[练完吃啥后端] http://localhost:${port}`);
    console.log(`[Agent] provider = ${currentProvider()}`);
  });
}

module.exports = app;
