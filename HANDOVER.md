# 交接文档（Handover）

> 给下一个会话/接手人：读完这份 + 跑一遍测试，就能无缝接手。
> 最后更新：2026-11-03

## 一、项目概览

| 项 | 内容 |
|---|---|
| 项目名 | **练完吃啥** · 运动 × 饮食智能体（软工菁英杯参赛作品，主题词「运动」） |
| 本地目录 | `C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent` |
| 线上地址 | https://liaohc-42.github.io/sports-fuel-agent/ （GitHub Pages，已上线） |
| 仓库 | https://github.com/liaohc-42/sports-fuel-agent |
| 后端 | https://sports-fuel-agent-backend.vercel.app （Vercel 已部署，状态 READY；**国内直连被墙**） |
| 技术栈 | 原生 HTML/CSS/JS 前端 + Node.js/Express 后端；大模型走 GLM / DeepSeek / Ollama 三选一 |

## 二、完成度

- **方案 A「练完吃啥」**：配餐（目标/30+运动/时长数轴/强度/热量缺口/通用菜品库+中大食堂可选/校区→食堂→窗口/预算时间数轴/餐次/不吃的东西/图片识别/3套推荐+为什么这么配/替换建议）、记录（改方案/花销/最近运动直方图）、原理与数据（文献/教练/后端Key）—— **完成**
- **方案 B「体测急救站」**：全项目评分（BMI/肺活量/50米/体前屈/跳远/引体·仰卧/1000·800米）、短板诊断、引体·仰卧 4 周专项训练计划、7 天计划、打卡调载、配速器 —— **完成**
- **部署**：GitHub Pages 自动部署（Actions），后端 Vercel —— **完成**
- **文档**：README、答辩稿、答辩PPT、使用说明、完善路线、数据说明 —— **完成**

## 三、目录地图

```
sports-fuel-agent/
├── frontend/                 # 部署到 GitHub Pages 的静态站点
│   ├── index.html            # 单页应用（配餐/记录/原理/体测 4 个 tab）
│   ├── css/style.css         # 深绿主题
│   ├── js/app.js             # 全部业务逻辑（约 1000 行）
│   ├── js/api.js             # 多后端调用 + 本地规则引擎兜底
│   └── data/
│       ├── nutrition.js      # 营养库（~80 道菜，标注 库/估）
│       ├── dishes.js         # 通用菜品库（默认数据源）
│       ├── exercise.js       # 30+ 运动项目 + MET
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

2. **体测评分表 = 2014 官方原表**（不是估的）：
   - 男生：[四川农业大学体育学院](https://ytxy.sicau.edu.cn/info/1042/5509.htm)
   - 女生：[山东中医药大学](https://tiyu.sdutcm.edu.cn/info/1117/1143.htm)
   - 关键口径：**引体向上 0 个 = 0 分、10 个 = 60 分（及格线）**；权重 BMI15/肺活量15/50m20/体前屈10/跳远10/引体·仰卧10/1000·800m20。
   - 代码位置：`frontend/js/app.js` 的 `FT` 对象；测试：`_boot_test.js` 已锁定 0/10 两个点。

3. **热量口径**：静息消耗(BMR) + 运动消耗 → 建议摄入 = BMR + 运动 + 目标调整；**盈余/缺口 = 建议摄入 − 运动消耗 − 静息消耗**（`updateStats`）。

4. **图片识别**：优先后端视觉模型（`/api/vision`，GLM-4V-Flash 或 Ollama 视觉模型）→ 能识别菜品照片；未配置时回退 **Tesseract 文字识别**（页面明确标注“只能识别菜单文字”）。

5. **大模型 Key 只在后端 `.env`**：`GLM_API_KEY` / `DEEPSEEK_API_KEY` / `OLLAMA_BASE_URL`+`OLLAMA_VISION_MODEL`；前端不存 Key。未配置自动用本地规则引擎。

6. **部署脚本 `deploy_github.js` 会跳过** `node_modules/.git/.pnpm-store/.vercel/.env`（`.env` 含密钥，必须跳过）。

## 五、环境注意事项（重要）

- **当前沙箱网络**：GitHub / Vercel 的 HTTPS 会被中间人（VPN）替换证书，Node 需 `NODE_TLS_REJECT_UNAUTHORIZED=0` 才能通；浏览器正常（信任了 VPN 的 CA）。
- **`*.vercel.app` 国内被墙**：沙箱里实测 TCP 连接超时；所以后端“别人能用”的前提是对方能访问 vercel.app（海外/开全局代理）。
- **密钥**：用户的 GitHub Token（`ghp_...`）与 Vercel Token（`vcp_...`）用完应删除；`backend/.env` 里可能有用户的 DeepSeek/GLM Key，**不要外传、不要提交**。

## 六、已知问题 / 待办

| 优先级 | 事项 | 说明 |
|---|---|---|
| P0 | Vercel 后端配 `DEEPSEEK_API_KEY` | 否则别人打开只有本地引擎，没有 DeepSeek 点评 |
| P1 | 大三/大四评分表 | 当前用大一/大二表；两者部分项目阈值差 1~2，可再查原表替换 |
| P1 | 男生 30/20/10 分档 | 原表 PDF 截断在 40 分，低档为等差推算 |
| P2 | 真·联网营养检索 | 当前是本地库 + 估算；需接搜索 API（Brave/SerpAPI 或 GLM web-search） |
| P2 | 答辩稿个别旧描述 | 已同步关键数字，但 UI 细节以实际页面为准 |

## 七、如何继续

```powershell
# 1) 改完前端后，本地验证
cd C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent
node scripts\_boot_test.js      # 引导 + 引擎 + 体测（含 0/10 分档）
node scripts\_smoke_test.js     # 营养/热量/评分
node scripts\_test_agent.js     # 后端 JSON 校验
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
| `_smoke_test.js` | 营养/热量/评分核心逻辑 |
| `_test_agent.js` | 后端 JSON Schema 校验 + 回退 |
| `_check_ids.js` / `_check_refs.js` | 前端 ID / 资源引用一致性 |
| `_verify_live.js` | 线上站点 16 项检查 |

## 九、测试状态（最后验证）

- `_boot_test.js`：全部 OK（init 无异常、推荐引擎出卡、体测全项目+专项计划、引体 0→0 分 / 10→60 分）
- `_smoke_test.js`：ALL PASS
- `_test_agent.js`：ALL PASS
- `_check_ids.js`：96 个 ID 一致
- `_check_refs.js`：7 项资源有效
- `_verify_live.js`：16 项线上检查 PASS

---

> 接手建议：先跑一遍第九节的测试确认基线，再看第六节待办；改完记得 `build_single_file` + `deploy_github` 同步线上。
