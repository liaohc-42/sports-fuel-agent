# -*- coding: utf-8 -*-
"""
生成答辩 PPT（16:9，纸质票据色系），并给每页写讲稿备注。
用法：python scripts/make_pptx.py
输出：docs/答辩PPT-练完吃啥.pptx
"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

CREAM = RGBColor(0xF7, 0xF1, 0xE3)
PAPER = RGBColor(0xFF, 0xFC, 0xF2)
INK = RGBColor(0x24, 0x1C, 0x16)
INK2 = RGBColor(0x4A, 0x3F, 0x36)
MUTED = RGBColor(0x8A, 0x7F, 0x73)
BRICK = RGBColor(0x8C, 0x1D, 0x18)
GREEN = RGBColor(0x1F, 0x5C, 0x3A)

FONT = "Microsoft YaHei"
SERIF = "Microsoft YaHei"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]


def bg(slide, color=CREAM):
    r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    r.fill.solid(); r.fill.fore_color.rgb = color
    r.line.fill.background(); r.shadow.inherit = False
    slide.shapes._spTree.remove(r._element)
    slide.shapes._spTree.insert(2, r._element)


def text(slide, x, y, w, h, s, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, spacing=1.25):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    for i, line in enumerate(s.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.line_spacing = spacing
        r = p.add_run(); r.text = line
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = FONT


def accent(slide, color=BRICK):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(1.22), Inches(0.09), Inches(0.62))
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background(); s.shadow.inherit = False


def tag(slide, s, color=BRICK):
    tb = slide.shapes.add_textbox(Inches(9.4), Inches(0.45), Inches(3.3), Inches(0.35))
    p = tb.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.RIGHT
    r = p.add_run(); r.text = s
    r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = color; r.font.name = FONT


def footer(slide, n):
    text(slide, 0.55, 6.98, 9, 0.28, "练完吃啥 × 中大通关 · 南校运动地图｜软工菁英杯 · 初级组", 9, False, MUTED)
    text(slide, 11.8, 6.98, 1.0, 0.28, f"{n}/14", 9, False, MUTED, align=PP_ALIGN.RIGHT)


def card(slide, x, y, w, h, title, body, color=GREEN):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = PAPER
    s.line.color.rgb = INK; s.line.width = Pt(1.5); s.shadow.inherit = False
    text(slide, x + 0.22, y + 0.16, w - 0.44, 0.34, title, 15, True, color)
    text(slide, x + 0.22, y + 0.6, w - 0.44, h - 0.75, body, 12, False, INK2, spacing=1.3)


def bullets(slide, items, y=2.3, size=17, x=0.9, w=11.5):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(4.2))
    tf = tb.text_frame; tf.word_wrap = True
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(11); p.line_spacing = 1.3
        bold = it.startswith("**")
        r = p.add_run(); r.text = ("· " if not bold else "") + it.replace("**", "")
        r.font.size = Pt(size); r.font.bold = bold
        r.font.color.rgb = INK if bold else INK2; r.font.name = FONT


def notes(slide, s):
    slide.notes_slide.notes_text_frame.text = s


def new(title, speaker, subtitle=None):
    s = prs.slides.add_slide(BLANK); bg(s); accent(s)
    text(s, 0.9, 1.2, 11.4, 0.7, title, 29, True, INK)
    if subtitle:
        text(s, 0.9, 1.9, 11.4, 0.4, subtitle, 12.5, False, MUTED)
    tag(s, speaker)
    footer(s, len(prs.slides))
    return s


# 1 封面
s = prs.slides.add_slide(BLANK); bg(s)
band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(2.05), prs.slide_width, Inches(0.14))
band.fill.solid(); band.fill.fore_color.rgb = BRICK; band.line.fill.background(); band.shadow.inherit = False
text(s, 0.9, 0.85, 11.5, 0.4, "首届「软工菁英杯」技术创新应用大赛 · 初级组 · 主题词：运动", 13, True, BRICK)
text(s, 0.9, 2.45, 11.5, 0.9, "练完吃啥 × 中大通关", 42, True, INK)
text(s, 0.9, 3.3, 11.5, 0.7, "南校运动地图", 34, True, GREEN)
text(s, 0.9, 4.3, 11.5, 0.5, "运动 × 饮食 × 校园：一个真正能用的运动智能体", 18, False, INK2)
text(s, 0.9, 5.45, 5.6, 1.1, "演示入口\nhttp://120.78.120.161/\nsportsfuel.120.78.120.161.nip.io", 12, False, MUTED)
text(s, 6.9, 5.45, 5.6, 1.1, "备选入口\nhttps://liaohc-42.github.io/sports-fuel-agent/\n（静态版，无后端时走本地引擎）", 12, False, MUTED)
notes(s, "【讲者A｜0:00–0:20】\n各位评委老师好，我们是软件工程学院「练完吃啥」团队，主题词是「运动」。\n"
         "一句话：练完怎么吃、校园里怎么练、去哪练。演示地址有两个，手机也能开。")
footer(s, 1)

# 2 一句话
s = new("一句话：运动消耗的，吃回来；校园里的运动机会，帮你找出来", "讲者A｜0:20–0:55")
card(s, 0.9, 2.3, 3.65, 2.45, "吃", "练完这顿在食堂怎么搭\n2–3 套横向对比\n宏量营养条 + 一句话解释", GREEN)
card(s, 4.85, 2.3, 3.65, 2.45, "练", "13 个校园体育积分机会\n体测全项目评分 + 表8 加分\n提分性价比榜", BRICK)
card(s, 8.8, 2.3, 3.65, 2.45, "场馆", "五校区 22 个场馆\n实时上报 + 历史规律兜底\n人多时给替代建议", GREEN)
text(s, 0.9, 5.15, 11.5, 0.9, "再加一个「教练」：这四个模块共用一个运动营养教练，随时问。", 16, False, INK2)
notes(s, "【讲者A｜0:20–0:55】\n为什么不是又一个健身 App？大学生运动前后真正要做的决定只有两个：练完吃什么、去哪练。\n"
         "所以拆成吃、练、场馆，再共用一个教练。")

# 3 痛点
s = new("三个真实痛点，都来自我们身边", "讲者A｜0:55–1:35")
bullets(s, [
    "**练完不知道吃什么**：食堂菜品固定，微信只能问朋友，练得认真、吃得全凭感觉",
    "**体测前不会练**：1000 米 4 分 35、引体 3 个，网上的计划不是给体育生就是每天 5 公里",
    "**想运动不知道去哪**：跑到体育馆全是人，也不知道学校有这么多能拿体育积分的机会",
], y=2.5, size=17.5)
text(s, 0.9, 5.5, 11.5, 0.6, "对应的就是：配餐、积分雷达 + 体测、场馆人流。", 15, True, GREEN)
notes(s, "【讲者A｜0:55–1:35】\n三个场景各一句，别展开。最后过渡：所以我们做了三个模块 + 一个教练。")

# 4 总览
s = new("产品总览：6 个入口，一条运动动线", "讲者A｜1:35–2:00", "导航顺序按运动动线排：练 → 吃 → 教练 → 场馆 → 记录 → 我的")
for i, (t, d, c) in enumerate([
    ("🎯 练", "积分雷达 + 体测急救站", BRICK),
    ("🍚 吃", "目标 → 选菜 → 2–3 套搭配", GREEN),
    ("🤖 教练", "四个入口共用同一个 Agent", GREEN),
    ("🏟️ 场馆", "人流判定 + 替代建议", GREEN),
    ("📊 记录", "花销 / 运动直方图 / AI 建议", GREEN),
    ("👤 我的", "档案 + 积分进度 + 分支", GREEN),
]):
    card(s, 0.9 + (i % 3) * 3.85, 2.65 + (i // 3) * 1.85, 3.6, 1.55, t, d, c)
notes(s, "【讲者A｜1:35–2:00】\n这一页只让评委知道产品有多大。念六个入口，然后交给下一位。")

# 5 吃
s = new("吃：三步走，10 秒出结果", "讲者B｜2:00–3:10")
card(s, 0.9, 2.15, 3.6, 2.85, "① 定目标", "减脂 / 增肌 / 维持\n三段式控件\n一句解释：\n「缺口约 300–500 kcal，优先保蛋白」", GREEN)
card(s, 4.75, 2.15, 3.6, 2.85, "② 选菜", "搜索「鸡」直接筛\n分类吸顶：主食/蛋白/热菜…\n「不吃的东西」chip 删除线\n已选角标", GREEN)
card(s, 8.6, 2.15, 3.6, 2.85, "③ 出结果", "2–3 套横向对比卡\n热量 / 蛋白 / 价格 / 排队\n宏量条：本餐 / 每餐目标\n一句话解释 + 换一换", BRICK)
text(s, 0.9, 5.35, 11.5, 0.8, "示例：跑步 30 分钟 ≈ 307 千卡；蛋白 45 / 88 g；「练后 1 小时内补快碳 + 蛋白」。", 13.5, False, INK2)
notes(s, "【讲者B｜2:00–3:10】\n边点边讲。重点三件事：目标分段、选菜能搜能锚定、结果是横向对比。\n"
         "数字口径：MET 9 × 65kg × 30min = 307 千卡。")

# 6 吃的算法
s = new("吃：算得准，才敢说「建议」", "讲者B｜3:10–4:00")
bullets(s, [
    "**热量**：运动消耗 = MET × 3.5 × 体重 ÷ 200 × 分钟；静息用 Mifflin-St Jeor；建议摄入按目标 ±300/400",
    "**营养**：本地营养库 ~80 道（标注「库/估」），未收录按菜名关键词→分类兜底",
    "**食堂**：五校区 647 道菜、46 个食堂，来自《食堂菜单价格明细表》；16% 有标价，其余按分类参考价",
    "**边界**：算分、算热量全部本地确定性计算，大模型只做解释和问答",
], y=2.4, size=15.5)
notes(s, "【讲者B｜3:10–4:00】\n回答「数据哪来的、算得对不对」。强调确定性计算不用大模型，估算值有标注。")

# 7 积分雷达
s = new("练：积分雷达，把散落的机会聚合起来", "讲者C｜4:00–5:10")
card(s, 0.9, 2.15, 5.5, 2.1, "13 条机会", "8 条官方：参赛即得 / 打卡累积 / 课程训练 / 服务组织 / 院系日常\n5 条社团·民间：明确标注「不计分」", BRICK)
card(s, 6.6, 2.15, 5.7, 2.1, "筛选与排序", "分类 chips + 状态分段 + 关键词搜索，三者叠加\n未结束按截止日升序、已结束沉底", GREEN)
card(s, 0.9, 4.5, 5.5, 1.95, "详情页", "AI 一句话摘要（失败有本地 fallback）\n我想去 / 找搭子 / 组队缺人\n讨论区 + 运动攻略评分", GREEN)
card(s, 6.6, 4.5, 5.7, 1.95, "设计细节", "分值用「票根章」\n非官方认定、仅个人记录\n数据只存本机", GREEN)
notes(s, "【讲者C｜4:00–5:10】\n先讲为什么：机会散在公众号、群、海报里。再点一个详情页展示 AI 摘要和意向。\n"
         "强调合规：社团活动不计分、积分非官方认定。")

# 8 体测
s = new("练：体测急救站，从「算分」到「该练哪项」", "讲者C｜5:10–6:10")
bullets(s, [
    "**评分表**：《国家学生体质健康标准（2014 修订）》官方原表，内置大一/大二、大三/大四两套",
    "**零分线**：未达到最低得分档记 0 分（引体 4 个 = 0 分，5 个 = 10 分，10 个 = 60 分）",
    "**加分（表 8）**：引体/仰卧每多 1 次 +1 分；1000/800 米按减少秒数加分；单项 +10，总分上限 120",
    "**提分性价比榜**：按「每提升 1 个单位能加多少分」排序，引体 3→10 个 ≈ +54 分排第一",
    "**等级**：≥90 优秀 / ≥80 良好 / ≥60 及格",
], y=2.35, size=15)
notes(s, "【讲者C｜5:10–6:10】\n技术含量最高的一页：讲清 0 分线、表 8 加分、120 上限，说明我们对着手册逐格核过。\n"
         "然后现场改一个成绩，榜单立刻重排。")

# 9 场馆
s = new("场馆：去之前看一眼，到了点一下", "讲者C｜6:10–6:50")
card(s, 0.9, 2.15, 5.5, 2.45, "五校区 22 个场馆", "自绘 SVG 示意图\n不用地图 SDK、不涉及授权\n坐标 0–100 归一化", GREEN)
card(s, 6.6, 2.15, 5.7, 2.45, "两级兜底判定", "① 近 2 小时上报 >60% 优先\n② 无数据 → 历史规律表（20:40 下课、19:00–21:30 室内、周一闭馆…）\n③ 都没有 → 默认「适中，欢迎上报」", BRICK)
text(s, 0.9, 4.95, 11.5, 1.0, "人多时自动给建议：「英东现在人多，建议改去西区田径场」。数据只存本机，页面标注「模拟数据」。", 14, False, INK2)
notes(s, "【讲者C｜6:10–6:50】\n讲判定顺序，这是最容易被问的点。现场点一次「人多」，徽章立刻变。")

# 10 技术架构
s = new("技术架构：纯静态 + 一台国内 ECS + 三通道模型", "讲者D｜6:50–7:15")
card(s, 0.9, 2.15, 3.7, 2.8, "前端", "原生 HTML/CSS/JS\n同源调用 /api\n资源带版本号防缓存", GREEN)
card(s, 4.8, 2.15, 3.7, 2.8, "后端", "阿里云 ECS + Nginx\n/api 反代 Node/Express\nsystemd 守护、开机自启", GREEN)
card(s, 8.7, 2.15, 3.7, 2.8, "模型", "GLM / DeepSeek / Ollama\n三通道任选其一\nKey 只在服务器 .env", BRICK)
text(s, 0.9, 5.3, 11.5, 0.8, "国内直连：http://120.78.120.161/ ｜ sportsfuel.120.78.120.161.nip.io ｜ GitHub Pages 备份", 12.5, False, INK2)
notes(s, "【讲者D｜6:50–7:15】\n25 秒讲清架构与部署：为什么不用 Vercel（国内被墙）、为什么同源（混合内容）。\n"
         "强调：没有后端也能用，本地引擎兜底。")

# 11 Agent
s = new("Agent：四个入口，状态诚实", "讲者D｜7:15–7:40")
bullets(s, [
    "**入口**：教练 tab / 配餐「点评这顿」/ 体测「解读短板」/ 记录页三类建议",
    "**能力**：JSON Schema 校验 + 规则拦截（不承诺提分）+ 失败回退模板",
    "**诚实**：健康检查区分「后端在线」和「真配了模型」；没有 Key 就显示「本地规则」，不冒充 AI",
    "**安全**：Key 只在后端；CORS 白名单；按 IP 限流；3000 端口不对外",
], y=2.45, size=15.5)
notes(s, "【讲者D｜7:15–7:40】\n最容易被问「你们的 AI 在哪」的地方，四句话讲完。\n"
         "有 Key 就演示一句；没有就如实说本地规则。")

# 12 工程质量
s = new("工程与质量：该有的证据都在", "讲者D｜7:40–8:00")
card(s, 0.9, 2.1, 3.6, 2.55, "9 套自动化测试", "引导 / 整站 / 冒烟 / Agent / 模型通道 / 场馆 / ID / 引用 / 线上", GREEN)
card(s, 4.75, 2.1, 3.6, 2.55, "数据可核对", "官方评分表逐格核对\n场馆规律表落库\n营养/食堂标注来源", GREEN)
card(s, 8.6, 2.1, 3.6, 2.55, "双入口部署", "ECS（国内直连 + 域名）\nGitHub Pages（备份）\n一键部署脚本", BRICK)
text(s, 0.9, 4.95, 11.5, 1.2, "边界：无账号体系（数据仅本机）；AI 破冰语、关键词订阅、联网营养检索列为未来方向——如实说明。", 13, False, INK2)
notes(s, "【讲者D｜7:40–8:00】\n用证据收尾：测试、数据、部署。主动说边界比被问出来好。\n"
         "最后一句：以上是我们的全部工作，谢谢老师，欢迎提问。")

# 13 演示动线
s = new("现场演示动线（严格 8 分钟）", "全员｜提词卡")
bullets(s, [
    "0:00 封面 → 一句话（A）",
    "0:20 痛点三连 → 产品总览（A）",
    "2:00 吃：定目标 → 搜「鸡」→ 勾 3 道 → 生成 → 指宏量条（B）",
    "4:00 练：积分雷达 → 详情 → 体测输入 4'35 / 引体 3 → 看提分榜（C）",
    "6:10 场馆：切校区 → 点「人多」→ 看替代建议（C）",
    "6:50 技术架构 → Agent 四入口 → 工程质量（D）",
    "8:00 收尾 + 提问（D 主答，其余补位）",
], y=2.25, size=14.5)
notes(s, "提词卡：谁讲哪段、点什么按钮，全在这里。\n"
         "演示前检查：ECS 能开、教练状态条是绿的、场馆上报已清空。")

# 14 结尾
s = prs.slides.add_slide(BLANK); bg(s)
band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(1.95), prs.slide_width, Inches(0.14))
band.fill.solid(); band.fill.fore_color.rgb = BRICK; band.line.fill.background(); band.shadow.inherit = False
text(s, 0.9, 2.45, 11.5, 0.8, "运动消耗的，我们帮你吃回来；", 30, True, INK)
text(s, 0.9, 3.2, 11.5, 0.8, "校园里的运动机会，我们帮你找出来。", 30, True, GREEN)
text(s, 0.9, 4.5, 11.5, 0.5, "谢谢各位评委老师！", 19, False, INK2)
text(s, 0.9, 5.3, 11.5, 1.2,
     "演示：http://120.78.120.161/ ｜ sportsfuel.120.78.120.161.nip.io\n"
     "源码：https://github.com/liaohc-42/sports-fuel-agent （README 含完整说明）", 12, False, MUTED)
notes(s, "【讲者D｜7:40–8:00】\n最后一句话说完就停。\nQ&A：产品/技术 D 主答；饮食数据 B 补；积分雷达/场馆 C 补；赛制/分工 A 补。")
footer(s, 14)

OUT = r"C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent\docs\答辩PPT-练完吃啥.pptx"
prs.save(OUT)
print("OK slides=", len(prs.slides), OUT)
