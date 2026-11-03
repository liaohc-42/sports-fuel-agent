/* ============================================================
 * deploy_github.js —— 一键把项目发布到 GitHub 并开启 Pages
 *
 * 用法（无需本机安装 git）：
 *   Windows PowerShell:
 *     $env:GITHUB_TOKEN="你的token"; $env:REPO_NAME="sports-fuel-agent"
 *     node scripts/deploy_github.js
 *
 * 前提：Token 需勾选 repo + workflow 权限（classic）或 Fine-grained 的
 *       Administration(Read/Write) + Contents(Read/Write) + Workflows(Read/Write)。
 *
 * 流程：
 *   1. 读取 GITHUB_TOKEN / REPO_NAME
 *   2. 新建公开仓库（已存在则复用）
 *   3. 用 git-data API 一次性上传全部文件（一个 commit，排除 node_modules/.git）
 *   4. 开启 GitHub Pages（source = GitHub Actions）
 *   5. 打印访问地址
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN || process.argv[2];
const REPO = process.env.REPO_NAME || process.argv[3] || 'sports-fuel-agent';
const ROOT = path.resolve(__dirname, '..');

if (!TOKEN) {
  console.error('❌ 缺少 GITHUB_TOKEN。请先设置环境变量：');
  console.error('   PowerShell:  $env:GITHUB_TOKEN="你的token"');
  process.exit(1);
}

const API = 'https://api.github.com';
const headers = {
  Authorization: 'Bearer ' + TOKEN,
  'Content-Type': 'application/json',
  'User-Agent': 'sports-fuel-agent-deploy',
  Accept: 'application/vnd.github+json',
};

async function api(method, url, body) {
  const opt = { method, headers };
  if (body !== undefined) opt.body = JSON.stringify(body);
  const r = await fetch(API + url, opt);
  const txt = await r.text();
  let json = null; try { json = JSON.parse(txt); } catch (e) {}
  if (!r.ok && !(r.status === 404 || r.status === 409)) {
    throw new Error(method + ' ' + url + ' -> ' + r.status + ' ' + (json && json.message || txt.slice(0, 200)));
  }
  return { status: r.status, json };
}

// 需要忽略的目录/文件
const SKIP = new Set(['node_modules', '.git', '.pnpm-store', '.dsh-office', '.vercel', '.env']);
function collectFiles(dir, base) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...collectFiles(full, base));
    else out.push(rel);
  }
  return out;
}

(async () => {
  console.log('🚀 开始部署：repo =', REPO);

  // 1) 获取用户名
  const me = (await api('GET', '/user')).json;
  const owner = me.login;
  console.log('👤 账号：', owner);

  // 2) 创建/复用仓库
  let repo = (await api('GET', '/repos/' + owner + '/' + REPO)).json;
  if (repo && repo.full_name) {
    console.log('📦 仓库已存在，复用：', repo.full_name);
  } else {
    repo = (await api('POST', '/user/repos', {
      name: REPO, description: '练完吃啥 · 运动×饮食智能体（软工菁英杯参赛作品）',
      private: false, auto_init: true,
    })).json;
    console.log('📦 已新建仓库：', repo.full_name);
  }
  const base = '/repos/' + owner + '/' + REPO;

  // 2.5) 确保仓库已初始化（空仓库 → 用 Contents API 建初始 README 提交）
  let mainRef = (await api('GET', base + '/git/ref/heads/main')).json;
  if (!mainRef || !mainRef.object) {
    await api('PUT', base + '/contents/README.md', {
      message: 'chore: init',
      branch: 'main',
      content: Buffer.from('# ' + REPO + '\n\n（初始化提交）\n', 'utf8').toString('base64'),
    });
    console.log('📦 空仓库已初始化（创建 README 提交）');
    mainRef = (await api('GET', base + '/git/ref/heads/main')).json;
  }

  // 3) 收集文件
  const files = collectFiles(ROOT, ROOT);
  console.log('📄 共', files.length, '个文件');

  // 4) 逐个建 blob
  const tree = [];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    const blob = (await api('POST', base + '/git/blobs', { content: b64, encoding: 'base64' })).json;
    tree.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha });
    console.log('   ✓', rel);
  }

  // 5) 建 tree -> commit -> 更新 ref
  const treeRes = (await api('POST', base + '/git/trees', { tree })).json;
  const parent = (await api('GET', base + '/git/ref/heads/main')).json;
  const commit = (await api('POST', base + '/git/commits', {
    message: 'feat: 练完吃啥 初始提交（前端+后端+数据+文档）',
    tree: treeRes.sha,
    parents: parent && parent.object ? [parent.object.sha] : [],
  })).json;
  await api('PATCH', base + '/git/refs/heads/main', { sha: commit.sha, force: true });
  console.log('✅ 代码已推送到 main 分支');

  // 6) 开启 GitHub Pages（Actions 方式）
  try {
    await api('POST', base + '/pages', { build_type: 'workflow' });
    console.log('🌐 已开启 GitHub Pages（source = GitHub Actions）');
  } catch (e) {
    console.log('⚠️ Pages 开启失败（可能已开启）:', e.message);
  }

  // 7) 触发部署工作流（若未自动触发）
  try {
    await api('POST', base + '/actions/workflows/deploy.yml/dispatches', { ref: 'main' });
    console.log('▶️ 已手动触发 deploy.yml 工作流');
  } catch (e) {
    console.log('ℹ️ 工作流触发跳过：', e.message);
  }

  console.log('\n🎉 完成！访问地址（约 1-2 分钟后生效）：');
  console.log('   https://' + owner + '.github.io/' + REPO + '/');
  console.log('\n   （若 404，去仓库 Settings → Pages 确认 Source=GitHub Actions，再跑一次 Actions）');
})().catch(e => {
  console.error('\n❌ 部署失败：', e.message);
  process.exit(1);
});
