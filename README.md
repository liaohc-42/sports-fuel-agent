# 🔥 练完吃啥 · 运动 × 饮食智能体

> 首届「软工菁英杯」技术创新应用大赛参赛作品 · 主题词：**运动**
> 面向**中山大学**学生的运动饮食智能体：**练完吃啥**（食堂运动餐推荐官）+ **体测急救站**（14 天体测提分教练）

纯**原生 HTML / CSS / JavaScript** 前端 + **Node.js (Express)** 后端，前端一键部署到 **GitHub Pages**，后端可部署到 **Vercel**。**无需后端、无需联网、无需付费**即可完整演示（内置本地规则引擎兜底）。

---

## ✨ 它能解决什么

| 痛点 | 现状 | 我们的方案 |
|---|---|---|
| 想增肌/减脂，食堂菜品固定，不知怎么搭 | 微信只能问朋友，闹钟只能提醒吃饭 | 选目标 + 勾菜品 → 秒出 2 套搭配 + 三大营养素占比 + 替代建议 |
| 不知道今天运动消耗了多少 | 手环太贵、估不准 | 选运动/时长/强度 → 秒算消耗 + 今日热量缺口 |
| 体测前两周想提分，不知道先练哪项 | 网上的计划不是给体育生就是让你每天跑 5 公里 | 30 秒输入成绩 → 算当前分 → 告诉你"先练哪项、每天练什么" |

---

## 🧭 功能总览

### 方案 A：练完吃啥（食堂运动餐推荐官）—— 主项目

- **配餐**
  1. 运动项目含 **徒步 / 游泳**，**力量 / 球类**拆分为子分支（上肢/下肢/核心/全身；篮球/足球/羽毛球/乒乓球/排球/网球）
  2. **时长**为数轴式拖动，分度值 **5 分钟**
  3. **强度**下方实时显示参考文案（如跑步"轻松=配速>7'00"、正常=5'00"~7'00"）
  4. 选完自动计算**运动消耗**并显示**今日热量缺口**
  5. "今天食堂有什么"覆盖**中山大学五校区食堂**（广州南/北/东、珠海、深圳），校区 → 食堂 → 窗口/楼层 → 菜品（含价格），支持**手动更新菜品**补价格
  6. "这顿的约束"：**预算**（0–30 元，分度 1 元）与**路上时间**（0–30 分钟，分度 1 分钟）数轴拖动，均带"不限/不赶时间 + 自定义输入"
- **记录**
  7. 按实际就餐**增删菜品**，AI 给出来来 1–2 餐建议
  8. 近一月**饮食花销统计** + 设定月预算 → AI 给出省钱建议
  9. **最近运动**：本周/本月/今年 直方图（运动时长/热量）+ AI 调整建议
- **原理与数据**
  10. 列出 AI 参考**文献**（《中国居民膳食指南(2022)》等）
  11. **智能健身教练**（Agent），API Key 置于**开发者后端**

### 方案 B：体测急救站（14 天体测提分教练）—— 加分副项目

- 必做：**评分计算**、1000/800 米、引体向上/仰卧起坐**专项训练计划**、**7 天计划**、**打卡调载**、**配速器**（每 200 米报时，不依赖 GPS）
- 按《国家学生体质健康标准(2014 修订)》算分，标注**提分性价比**（如"引体 3→5 比 1000 米提 10 秒划算"）
- 伤病自动**降载/换项**（如膝盖疼 → 深蹲换成臀桥/死虫）

---

## 📁 项目目录结构

```
sports-fuel-agent/
├── README.md                     ← 本文件
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml            ← GitHub Pages 自动部署
├── frontend/                     ← 前端（纯静态，部署到 GitHub Pages）
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js                ← 主逻辑（配餐/记录/原理/体测）
│   │   └── api.js                ← 后端通信 + 本地规则引擎（离线兜底）
│   └── data/
│       ├── nutrition.js          ← 营养数据库（常见食堂菜品）
│       ├── exercise.js           ← 运动 MET 数据库（强度/热量）
│       └── canteen.js            ← 五校区食堂数据（由 Excel 自动生成）
├── backend/                      ← 后端（本地测试 / 部署到 Vercel）
│   ├── server.js                 ← Express 入口（代理 GLM-4-Flash）
│   ├── api/
│   │   └── agent.js              ← 提示词构造 + 智谱 API 调用
│   ├── data/
│   │   └── canteen.json          ← 食堂数据（手动更新用）
│   ├── package.json
│   ├── .env.example              ← 🔑 Key 配置模板
│   └── vercel.json               ← Vercel 部署配置
├── scripts/
│   ├── xlsx_to_canteen.py        ← Excel → 食堂数据转换脚本
│   ├── build_single_file.js      ← 打包单文件离线版
│   ├── deploy_github.js          ← 一键部署到 GitHub Pages（无需 git）
│   ├── make_pptx.py              ← 生成答辩 PPT
│   └── *_check_* / *_test.js     ← 开发期校验与冒烟测试
├── dist/
│   └── 练完吃啥-离线单文件版.html  ← 双击即用的单文件版（离线演示）
└── docs/
    ├── 答辩稿.md                 ← 8 分钟汇报脚本 + Q&A 预案
    ├── 答辩PPT-练完吃啥.pptx     ← 12 页答辩演示 PPT（16:9）
    ├── 使用说明.md               ← 用户/评委使用指南
    ├── 完善路线.md               ← 后续迭代方向
    └── 数据说明.md               ← 数据来源与估算口径
```

---

## 🚀 快速开始

### 方式 1：直接在线使用（零成本、一键即用）

仓库推送后，GitHub Actions 自动把 `frontend/` 部署到：

```
https://<你的用户名>.github.io/<仓库名>/
```

打开即用。此时后端未配置，走**本地规则引擎**，全部核心功能可用（离线也能完整演示）。

### 方式 2：本地运行前端（可选）

```bash
# 任选其一：在 frontend 目录起一个静态服务
cd frontend
npx serve .            # 或 python -m http.server 8080
```

访问 `http://localhost:8080`。

### 方式 3：本地运行后端（想用 GLM-4-Flash 时）

```bash
cd backend
cp .env.example .env   # 填写 GLM_API_KEY
npm install
npm start              # http://localhost:3000
```

然后把 `frontend/js/api.js` 顶部改成：

```js
var API_BASE = 'http://localhost:3000';
```

---

## 🔑 Agent API Key 配置 ⚠️ 醒目入口（支持「填入即用」）

> **最省事的方式（填入即用）**：打开网页 → 「原理与数据」标签 → 最下方「Agent API Key · 填入即用」卡片 → 粘贴 Key → 点「保存并生效」，立即启用大模型。Key 只存在你本机浏览器，不写进代码仓库。
>
> 下面两种是「把 Key 写进后端」的进阶方式（Key 不经过浏览器）。

**第 1 步：获取 Key（免费）**

1. 打开 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册/登录 → 控制台 → **API Keys** → 创建
3. 复制形如 `xxxxxxxx.xxxxxxxx` 的 Key（**GLM-4-Flash 有免费额度**）

**第 2 步：填入后端（二选一）**

- **本地**：把 `backend/.env.example` 复制为 `backend/.env`，填入：
  ```env
  GLM_API_KEY=粘贴你的Key
  ```
- **Vercel**：在 Vercel 项目 → Settings → Environment Variables 添加同名变量 `GLM_API_KEY`。

**第 3 步：让前端指向后端**

编辑 `frontend/js/api.js` 第 1 段：
```js
var API_BASE = 'https://你的项目.vercel.app';   // 留空 = 永远本地引擎
```

**未填写 Key 时**：后端 `/api/health` 返回 `agent:false`，前端自动降级为**本地规则引擎**——免费、无需联网、答辩现场最稳妥。

**🔒 安全提醒**：`.env` 已被 `.gitignore` 忽略，不会上传；「填入即用」的 Key 只存浏览器 localStorage。**答辩结束请立刻到智谱平台删除该 Key**（用完即删，本项目的降级机制保证删了也不影响演示）。

---

## ☁️ 部署

### 方式 0：一键部署（无需本机安装 git）★ 推荐

仓库里已备好脚本，只要一个 Token 就能自动「建仓库 → 传代码 → 开 Pages」：

```powershell
$env:GITHUB_TOKEN="你的token"     # 勾选 repo + workflow 权限
$env:REPO_NAME="sports-fuel-agent"
node scripts/deploy_github.js
```

脚本会打印最终访问地址 `https://<用户名>.github.io/sports-fuel-agent/`。

**如何获取 GitHub Token（约 2 分钟）：**

1. 登录 GitHub → 右上角头像 → **Settings**。
2. 左侧最底部 → **Developer settings** → **Personal access tokens** → **Tokens (classic)**。
3. **Generate new token (classic)**，勾选权限：**`repo`**（整个打勾）+ **`workflow`**。
4. 有效期选最短（如 7 天），生成后**立刻复制**（只显示一次）。
5. 用完即删：答辩后回到同一页面 **Delete** 即可。

> ⚠️ Token 等同账号密码，请勿粘贴到任何会公开的地方（本项目 `.gitignore` 已忽略 `.env`，脚本只从环境变量读取）。

### 前端 → GitHub Pages（自动，手动方式）

1. 新建 GitHub 仓库，把本项目推上去（`git push`）。
2. 仓库 **Settings → Pages**，Source 选 **GitHub Actions**。
3. 每次 push 到 `main`，`.github/workflows/deploy.yml` 自动部署 `frontend/`。
4. 页面地址在 Actions 运行完成后显示（`https://<用户名>.github.io/<仓库名>/`）。

### 前端 → GitHub Pages（浏览器上传，无需任何工具/无需 VPN 外的命令行）

1. 浏览器打开 github.com 新建空仓库（勾选 Add a README 可跳过）。
2. 仓库页点 **Add file → Upload files**，把整个 `sports-fuel-agent` 文件夹（或 `练完吃啥-项目源码.zip` 解压后的内容）**拖进去**。
3. 上传后点 **Settings → Pages → Source 选 GitHub Actions**。
4. 打开 **Actions** 标签，手动运行一次 `Deploy to GitHub Pages` 工作流。
5. 完成后得到 `https://<用户名>.github.io/<仓库名>/`。

> 注意：`frontend/` 目录是站点根目录，上传时请保留原始目录结构（不要只传 index.html 一个文件）。

### 后端 → Vercel（可选）

1. 把仓库导入 Vercel（或单独导入 `backend/` 目录作为 Root Directory）。
2. 环境变量加 `GLM_API_KEY`。
3. 部署完成得到 `https://xxx.vercel.app`，填回 `frontend/js/api.js` 的 `API_BASE`。

> 也支持 Cloudflare Worker：`api/agent.js` 里的 `callGLM` 是标准 fetch，可平移到 Worker 的 `fetch` handler（见 `docs/完善路线.md`）。

---

## 🧱 技术架构

```
浏览器(GitHub Pages 静态)               后端(Express/Vercel)
┌──────────────────────┐      ┌──────────────────────┐
│ 原生 HTML/CSS/JS      │      │ POST /api/agent       │
│  · 配餐/记录/体测 UI   │ ───▶ │  · 组装提示词          │
│  · 本地规则引擎(离线兜底)│      │  · 调用 GLM-4-Flash    │──▶ 智谱API
│  · 营养库/MET库/食堂数据 │      │  · 隐藏 API Key        │
└──────────────────────┘      └──────────────────────┘
        ▲ 后端不可达/无Key时，自动用本地引擎，功能不降级
```

- **算分/算热量不用大模型**：体测评分表、MET 公式、营养库都是本地确定性计算，**大模型只做"解释、点评、问答"**，避免 LLM 算错或幻觉。
- **数据可追溯**：食堂数据来自《中山大学食堂菜单价格明细表》，每条标注出处；营养数据标注"库/估算值"。

---

## 🏆 加分项对应

| 奖项 | 如何命中 |
|---|---|
| **六边形战士奖** | 功能(A+B)、创意(运动×饮食交叉)、体验(数轴/直方图/配速器)、展示(答辩稿+现场演示路径)全覆盖 |
| **需求洞察奖** | 真实高频痛点：学生想运动增肌减脂却不知食堂怎么吃；体测临近不会针对性训练 |
| **一键即用奖** | 选目标→勾菜品→出方案；30 秒输入→出体测诊断；无后端/无网也能用，核心任务顺畅 |

---

## ⚠️ 免责声明

本项目输出为**健康/运动建议参考**，不构成医疗意见；体测评分请以学校执行版本为准。伤病持续或疼痛请及时就医。项目不承诺"包过"或"提分"，强调科学训练与长期习惯。

---

## 📄 相关文档

- [答辩稿（8 分钟 + 2 分钟 Q&A）](docs/答辩稿.md)
- [使用说明](docs/使用说明.md)
- [后续完善路线](docs/完善路线.md)
- [数据说明](docs/数据说明.md)
