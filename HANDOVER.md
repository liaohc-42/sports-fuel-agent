# 交接文档（Handover）

> 给下一个会话/接手人：读完这份 + 跑一遍测试，就能无缝接手。
> 最后更新：2026-11-03

## 零、新会话阅读清单（按顺序读这几个文件即可全懂）

| 顺序 | 文件 | 解决什么 |
|---|---|---|
| 1 | [`docs/赛制与评分.md`](docs/赛制与评分.md) | **赛制**：赛事背景、主题词「运动」、评分维度（Tech/Idea/UX/Show 各 25%）、答辩 8+2 分钟、三大加分项、我们遵守的边界 |
| 2 | **本文件 `HANDOVER.md`** | **工程状态**：完成度、目录地图、关键决策（双后端/评分表/热量/图片/Key）、环境坑、待办、命令、测试状态 |
| 3 | [`README.md`](README.md) | 项目总览、功能清单、部署方式、Key 配置 |
| 4 | [`docs/答辩稿.md`](docs/答辩稿.md) | 现场演示路径与话术（8 分钟怎么演、Q&A 预案） |
| 5 | [`docs/数据说明.md`](docs/数据说明.md) | 食堂/营养/热量/体测评分的数据口径与来源 |
| 6 | 核心源码（按需） | `frontend/js/app.js`（业务逻辑）、`frontend/js/api.js`（多后端+本地引擎）、`backend/server.js`（接口）、`backend/api/agent.js`（三模型+JSON 校验+视觉） |

> 最短路径：**读 1 → 2，跑 `scripts` 里的测试确认基线，就能接着干**。需要改代码时再读 6。

## 一、项目概览

| 项 | 内容 |
|---|---|
| 项目名 | **练完吃啥** · 运动 × 饮食智能体（软工菁英杯参赛作品，主题词「运动」） |
| 本地目录 | `C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent` |
| 线上地址 | https://liaohc-42.github.io/sports-fuel-agent/ （GitHub Pages，静态版；无后端时走本地引擎） |
| 仓库 | https://github.com/liaohc-42/sports-fuel-agent |
| **公网站点（前端+后端）** | **http://120.78.120.161/** （阿里云 ECS：Nginx 托管 `frontend/` + `/api` 反代 Node；**国内可直连、可真模型**，见 `docs/服务器运维.md`） |
| 后端（旧/海外） | https://sports-fuel-agent-backend.vercel.app （Vercel，**国内直连被墙**，仅作备选） |
| 技术栈 | 原生 HTML/CSS/JS 前端 + Node.js/Express 后端；大模型走 GLM / DeepSeek / Ollama 三选一 |

## 二、完成度

- **方案 A「练完吃啥」**：配餐（目标/30+运动/时长数轴/强度/热量缺口/通用菜品库+中大食堂可选/校区→食堂→窗口/预算时间数轴/餐次/不吃的东西/图片识别/3套推荐+为什么这么配/替换建议）、记录（改方案/花销/最近运动直方图）、原理与数据（文献/教练/后端Key）—— **完成**
- **方案 B「体测急救站」**：全项目评分（BMI/肺活量/50米/体前屈/跳远/引体·仰卧/1000·800米）、**提分性价比榜**、短板诊断、引体·仰卧 4 周专项训练计划、7 天计划、打卡调载、配速器 —— **完成**
- **新 · 积分雷达（「练」的主线）**：13 条校园体育积分机会（8 官方 + 5 社团/民间）、分类/状态/搜索三叠加、未结束升序/已结束沉底、详情页（AI 摘要 + 意向 + 讨论 + 评分）、票根章分值 —— **完成**
- **新 · 场馆与人流**：五校区 22 个场馆、自绘 SVG 示意图、**两级兜底判定**（近 2 小时上报 >60% 优先 → 历史规律表 → 默认适中）、上报即时生效、人多时给替代场馆建议 —— **完成**
- **新 · 约运动 / 装备 / 我的**：可发帖、可回复、可筛选的**本地演示版**（无账号体系，数据存本机），页面明确标注边界 —— **完成**
- **新 · UI 重构**：融合「纸质票据 + 硬阴影」色系（米白/砖红/深绿/墨），目标三段式控件、宏量营养条、横向对比卡、菜品搜索 + 分类吸顶、场景切换 —— **完成**
- **部署**：GitHub Pages（Actions）+ **阿里云 ECS（Nginx + systemd，国内直连 `http://120.78.120.161/`）** —— **完成**
- **文档**：README、答辩稿、答辩PPT、使用说明、完善路线、数据说明 —— **完成**

## 三、目录地图

```
sports-fuel-agent/
├── frontend/                 # 部署到 GitHub Pages 的静态站点
│   ├── index.html            # 单页应用（配餐/记录/原理/体测 4 个 tab）
│   ├── css/style.css         # 深绿主题
│   ├── js/app.js             # 配餐/记录/体测/标签路由（约 1200 行）
│   ├── js/api.js             # 多后端调用 + 本地规则引擎兜底
│   ├── js/credits.js         # 积分雷达（列表/详情/意向/讨论/评价/AI 摘要）
│   ├── js/venues.js          # 场馆与人流（两级兜底判定 + SVG 地图 + 上报）
│   ├── js/campus.js          # 约运动 / 装备 / 我的（本地演示版）
│   └── data/
│       ├── nutrition.js      # 营养库（~80 道菜，标注 库/估）
│       ├── dishes.js         # 通用菜品库（默认数据源）
│       ├── exercise.js       # 30+ 运动项目 + MET
│       ├── credits.js        # 13 条积分机会（含 5 条社团/民间）
│       ├── venues.js         # 五校区 22 个场馆 + 拥挤规律
│       └── canteen.js        # 中大五校区 647 道菜（由 Excel 生成）
├── backend/                  # 部署到 Vercel / 本地 npm start
│   ├── server.js             # Express：/api/agent /api/vision /api/health /api/canteen
│   ├── api/agent.js          # GLM/DeepSeek/Ollama 调用 + JSON Schema 校验 + 模板回退 + 视觉识别
│   ├── data/canteen.json     # 食堂数据
│   ├── .env.example          # Key 配置模板（复制为 .env 填 Key）
│   ├── .env                  # ⚠️ 本地密钥，已被 .gitignore 忽略，不要提交
│   └── vercel.json
├── dist/练完吃啥-离线单文件版.html  # 双击即用的单文件版（自动生成）
├── docs/                     # 答辩稿 / 答辩PPT / 使用说明 / 完善路线 / 数据说明
└── scripts/                  # 构建/部署/测试脚本（见第八节）
```

## 四、关键技术决策（新会话必读）

1. **双后端自动切换**（`frontend/js/api.js`）：
   ```js
   var API_BASES = [
     'https://sports-fuel-agent-backend.vercel.app', // 公网：别人可用
     'http://localhost:3000'                          // 本地：你自己 npm start 时用
   ];
   ```
   `callAgent`/`runOcr`/`checkBackend` 依次尝试，谁通就用谁；都不可达 → 本地规则引擎。

2. **体测评分表 = 2014 官方原表**（不是估的），含**两套分组表**：
   - 「大一/大二」「大三/大四」各一套（各 20 档），页面「年级」下拉自动切换；BMI 表两组通用。
   - 来源（三处交叉核对，数值一致）：[哈尔滨工程大学体育部](http://pt.hrbeu.edu.cn/info/1351/6701.htm)（完整男女分组表）、[青岛大学体育学院](http://ty.qdu.edu.cn/info/1243/2714.htm)（50 米分组表）、[四川农业大学体育学院](https://ytxy.sicau.edu.cn/info/1042/5509.htm)（男生各项）。
   - 关键口径（大一/大二）：**引体向上 0 个 = 0 分、10 个 = 60 分（及格线）、19 个 = 100 分**；大三/大四：11 个 = 60 分、20 个 = 100 分。权重 BMI15/肺活量15/50m20/体前屈10/跳远10/引体·仰卧10/1000·800m20。
   - 代码位置：`frontend/js/app.js` 的 `FT.junior` / `FT.senior`（每项下分 `male`/`female`），分组选择在 `ftGroup()`。
   - 测试：`_boot_test.js` 锁定 0→0、10→60（大一）、11→60（大三）、50 米 7.0 两组分别 85/80 分。

3. **热量口径**：静息消耗(BMR) + 运动消耗 → 建议摄入 = BMR + 运动 + 目标调整；**盈余/缺口 = 建议摄入 − 运动消耗 − 静息消耗**（`updateStats`）。

4. **图片识别**：优先后端视觉模型（`/api/vision`，GLM-4V-Flash 或 Ollama 视觉模型）→ 能识别菜品照片；未配置时回退 **Tesseract 文字识别**（页面明确标注“只能识别菜单文字”）。

5. **大模型 Key 只在后端 `.env`**：`GLM_API_KEY` / `DEEPSEEK_API_KEY` / `OLLAMA_BASE_URL`+`OLLAMA_VISION_MODEL`；前端不存 Key。未配置自动用本地规则引擎。

6. **部署脚本 `deploy_github.js` 会跳过** `node_modules/.git/.pnpm-store/.vercel/.env`（`.env` 含密钥，必须跳过）；文件按**二进制**读取上传（早期按 utf8 会把 pptx 传坏）。

7. **场馆人流 = 两级兜底**（`frontend/js/venues.js` 的 `crowdOf`）：
   - ① 近 2 小时本机上报：>60% 报「人多」→ 红；>60% 报「人少」→ 绿；否则黄；
   - ② 无上报 → 按 `data/venues.js` 的 `peak/mid/free` 时段 + `closedDays` + `teachingBlock`，再退到 `CROWD_RULES`（20:40 下课、19:00–21:30 室内、工作日白天等）；
   - ③ 都不命中 → 默认「适中，欢迎上报」。
   - 页面必须标注「模拟数据，仅供参考」。

8. **积分雷达无账号体系**：数据在 `data/credits.js`（13 条），用户行为（意向/讨论/评价/进度）存 `localStorage`。状态由 `realStatus()` 实时推导（`period_end < 今天` → 已结束）。

9. **UI 色系**：融合「纸质票据 + 硬阴影」（`--cream/--paper/--brick/--green/--ink`），粗描边、硬阴影、票根章。旧类名（`.pill`/`.card`…）保留，靠 `:root` 变量映射兼容。

## 五、环境注意事项（重要）

- **当前沙箱网络**：GitHub / Vercel 的 HTTPS 会被中间人（VPN）替换证书，Node 需 `NODE_TLS_REJECT_UNAUTHORIZED=0` 才能通；浏览器正常（信任了 VPN 的 CA）。
- **`*.vercel.app` 国内被墙**：沙箱里实测 TCP 连接超时；所以后端“别人能用”的前提是对方能访问 vercel.app（海外/开全局代理）。
- **密钥**：用户的 GitHub Token（`ghp_...`）与 Vercel Token（`vcp_...`）用完应删除；`backend/.env` 里可能有用户的 DeepSeek/GLM Key，**不要外传、不要提交**。

## 六、已知问题 / 待办

| 优先级 | 事项 | 说明 |
|---|---|---|
| P0 | 阿里云 ECS 填 `GLM_API_KEY` | 站点已部署在 `http://120.78.120.161/`，但 `.env` 里 Key 为空 → `/api/health` 仍是 `provider:"local"`。填一行即生效，命令见 `docs/服务器运维.md` |
| P2 | 真·联网营养检索 | 当前是本地库 + 估算；需接搜索 API（Brave/SerpAPI 或 GLM web-search） |
| P2 | 答辩稿个别旧描述 | 已同步关键数字，但 UI 细节以实际页面为准 |
| P3 | 体测附加分 | 2014 标准对男生引体/1000 米、女生仰卧/800 米有最高 +10 附加分（总分上限 120），当前未实现 |

> 已完成（2026-11-03）：~~大三/大四评分表~~、~~男生 30/20/10 分档~~ —— 已按官方原表补全并交叉核对，见第四节第 2 条。

## 七、如何继续

```powershell
# 1) 改完前端后，本地验证
cd C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent
node scripts\_boot_test.js      # 引导 + 引擎 + 体测（含 0/10 分档）
node scripts\_boot_campus.js    # 整站引导：积分雷达/场馆/约运动/装备/我的
node scripts\_smoke_test.js     # 营养/热量/评分
node scripts\_test_agent.js     # 后端 JSON 校验
node scripts\_test_campus.js    # 积分雷达数据 + 场馆两级兜底判定
node scripts\_check_ids.js      # 元素 ID 一致性
node scripts\_check_refs.js     # 资源引用
node scripts\_verify_live.js    # 线上站点（需联网）

# 2) 生成单文件离线版
node scripts\build_single_file.js

# 3) 部署到 GitHub Pages（需 GITHUB_TOKEN）
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
$env:GITHUB_TOKEN="ghp_..."
$env:REPO_NAME="sports-fuel-agent"
node scripts\deploy_github.js

# 4) 本地跑后端
cd backend
npm start        # http://localhost:3000
```

## 八、脚本清单

| 脚本 | 作用 |
|---|---|
| `xlsx_to_canteen.py` | 把《中山大学食堂菜单价格明细表.xlsx》转成 `canteen.js/json` |
| `build_single_file.js` | 打包 `dist/练完吃啥-离线单文件版.html` |
| `deploy_github.js` | 一键建仓 + 推代码 + 开 Pages（跳过 .env/.vercel） |
| `make_pptx.py` | 生成 12 页答辩 PPT |
| `_boot_test.js` | 前端 init + 引擎 + 体测诊断（含引体 0/10 分） |
| `_boot_campus.js` | 整站引导：加载全部脚本跑 init，再渲染积分雷达/场馆/约运动/装备/我的 |
| `_test_campus.js` | 积分雷达数据完整性 + 场馆两级兜底判定（高峰/空闲/闭馆/教学占用） |
| `_smoke_test.js` | 营养/热量/评分核心逻辑 |
| `_test_agent.js` | 后端 JSON Schema 校验 + 回退 |
| `_test_providers.js` | 模型选择：GLM / DeepSeek（deepseek-v4.1-flash）/ Ollama + 无 Key 返回 null |
| `_check_ids.js` / `_check_refs.js` | 前端 ID / 资源引用一致性 |
| `_verify_live.js` | 线上站点 16 项检查 |

## 九、测试状态（最后验证 2026-11-03）

- `_boot_test.js`：全部 OK（init 无异常、推荐引擎出卡、体测全项目+专项计划、引体 0→0 / 10→60（大一/大二）/ 11→60（大三/大四）、50 米 7.0 → 85（大一）/ 80（大三））
- `_boot_campus.js`：ALL PASS（整站 init；积分雷达列表/详情、场馆、约运动、装备、我的 均渲染成功）
- `_smoke_test.js`：ALL PASS（含官方表关键分档 eq 断言）
- `_test_agent.js`：ALL PASS
- `_test_campus.js`：ALL PASS（13 条机会、五校区坐标、英东 20:45 高峰 / 07:00 空闲、珠海游泳馆周一闭馆、东校园篮球场教学占用）
- `_check_ids.js`：104 个 ID 一致
- `_check_refs.js`：12 项资源有效
- `_verify_live.js`：23 项线上检查 PASS（新增积分雷达、场馆、菜品搜索、目标分段、场景切换）

> ✅ **已于 2026-11-03 部署到线上并验证**：线上 `js/app.js` 已含 `FT_BMI`、「按年级自动切换」提示已上线，`_verify_live.js` **18 项全 PASS**。部署脚本已改为按二进制读文件，线上 PPT 的 SHA256 与本地一致（此前会把 pptx 传坏）。

---

> 接手建议：先跑一遍第九节的测试确认基线，再看第六节待办；改完记得 `build_single_file` + `deploy_github` 同步线上。
