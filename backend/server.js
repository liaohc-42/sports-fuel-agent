/* ============================================================
 * server.js —— 练完吃啥 后端
 * 功能：
 *   1. 代理调用 GLM-4-Flash（隐藏真实 API Key）
 *   2. 提供 /api/health 健康检查（前端据此判断后端是否在线）
 *   3. 提供 /api/admin/set-key 运行态设置 Key（可选，需 ADMIN_TOKEN）
 *   4. 提供 /api/canteen 食堂数据（供后台手动更新菜品）
 * 部署：
 *   本地：  npm install && npm start   → http://localhost:3000
 *   Vercel：把 backend 目录作为根部署，或用仓库根 vercel.json（见 README）
 * ============================================================ */
'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { callGLM } = require('./api/agent');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 运行态 Key（优先环境变量，其次 /api/admin/set-key 设置）
let runtimeKey = process.env.GLM_API_KEY || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// 食堂数据（手动更新用）
let canteenData = null;
try {
  const p = path.join(__dirname, 'data', 'canteen.json');
  if (fs.existsSync(p)) canteenData = JSON.parse(fs.readFileSync(p, 'utf-8'));
} catch (e) { canteenData = null; }

// 健康检查
app.get('/api/health', (req, res) => {
  const key = runtimeKey || process.env.GLM_API_KEY;
  res.json({
    ok: true,
    agent: !!key,
    model: process.env.GLM_MODEL || 'glm-4-flash',
    engine: key ? 'GLM-4-Flash' : 'local',
  });
});

// Agent 入口（前端 callAgent 调用）
app.post('/api/agent', async (req, res) => {
  const { type, ...payload } = req.body || {};
  const key = runtimeKey || process.env.GLM_API_KEY;

  if (!key) {
    // 未配置 Key → 明确告知前端走本地引擎
    return res.json({ ok: false, engine: 'local', reason: 'GLM_API_KEY 未配置' });
  }
  try {
    const text = await callGLM(key, process.env.GLM_MODEL || 'glm-4-flash', type, payload);
    res.json({ ok: true, text, engine: 'GLM-4-Flash' });
  } catch (e) {
    res.status(500).json({ ok: false, engine: 'error', reason: e.message });
  }
});

// 运行态设置 Key（可选；本地调试用，生产建议只用环境变量）
app.post('/api/admin/set-key', (req, res) => {
  if (ADMIN_TOKEN && req.body && req.body.token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, reason: 'token 错误' });
  }
  if (!req.body || !req.body.key) {
    return res.status(400).json({ ok: false, reason: '缺少 key' });
  }
  runtimeKey = String(req.body.key).trim();
  res.json({ ok: true, msg: 'Key 已设置（仅本次进程有效，重启后失效）' });
});

// 食堂数据：读取 + 手动更新（开发者后台补全价格）
app.get('/api/canteen', (req, res) => {
  res.json(canteenData || { campuses: [] });
});

app.post('/api/canteen', (req, res) => {
  if (!req.body || !Array.isArray(req.body.campuses)) {
    return res.status(400).json({ ok: false, reason: '格式应为 {campuses:[...]}' });
  }
  canteenData = req.body;
  res.json({ ok: true, msg: '食堂数据已更新（本次进程有效）' });
});

// 根路径提示
app.get('/', (req, res) => {
  res.type('text/plain').send(
    '练完吃啥后端已运行。\n' +
    '接口：\n' +
    '  GET  /api/health        健康检查\n' +
    '  POST /api/agent         代理 GLM-4-Flash\n' +
    '  GET  /api/canteen       食堂数据\n' +
    '  POST /api/canteen       手动更新食堂数据\n' +
    '  POST /api/admin/set-key 运行态设置 Key(需 ADMIN_TOKEN)\n'
  );
});

// 本地直接运行时监听端口
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[练完吃啥后端] http://localhost:${port}`);
    console.log(`[Agent] ${runtimeKey ? '已配置 GLM_API_KEY' : '未配置 Key → 前端将使用本地引擎'}`);
  });
}

module.exports = app;
