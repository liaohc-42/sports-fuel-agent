# -*- coding: utf-8 -*-
"""答辩 PPT v3：网格对齐 / 垂直居中 / 截图卡 + 说明 / 封面半透明色块 / 进度条"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

CREAM = RGBColor(0xF7, 0xF1, 0xE3)
PAPER = RGBColor(0xFF, 0xFC, 0xF2)
INK = RGBColor(0x24, 0x1C, 0x16)
INK2 = RGBColor(0x4A, 0x3F, 0x36)
MUTED = RGBColor(0x8A, 0x7F, 0x73)
BRICK = RGBColor(0x8C, 0x1D, 0x18)
GREEN = RGBColor(0x1F, 0x5C, 0x3A)
LINE = RGBColor(0xD9, 0xCB, 0xB2)
WHITE = RGBColor(0xFF, 0xFC, 0xF2)

FONT = "Microsoft YaHei"
BASE = r'C:\Users\liao\Documents\deepseek-harness\default-workspace\.ecs-tmp'
IMG = os.path.join(BASE, 'ppt')
QR = os.path.join(BASE, 'qr.png')

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
TOTAL = 14

ML = 0.75
CW = 13.333 - ML * 2
BODY_Y = 1.78
TEXT_W = 4.75
PIC_X = 6.05
PIC_W = 6.55
PIC_H = 3.93


def set_alpha(shape, pct):
    """pct: 0-100 不透明度百分比"""
    srgb = shape.fill.fore_color._xFill.find(qn('a:srgbClr'))
    a = srgb.makeelement(qn('a:alpha'), {'val': str(int(pct * 1000))})
    srgb.append(a)


def rect(slide, x, y, w, h, fill=None, line=None, lw=1.25):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid(); s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line; s.line.width = Pt(lw)
    s.shadow.inherit = False
    return s


def text(slide, x, y, w, h, s, size=14, bold=False, color=INK, align=PP_ALIGN.LEFT, spacing=1.3):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    for i, line in enumerate(s.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.line_spacing = spacing
        r = p.add_run(); r.text = line
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = FONT


def bg(slide, color=CREAM):
    slide.shapes.add_picture(os.path.join(IMG, 'bg.jpg'), 0, 0, prs.slide_width, prs.slide_height)


# 讲者标签：页边缘的 A/B/C/D 圆章 + 时间段
SPEAKERS = [('A', '0:20–0:55'), ('A', '0:55–1:35'), ('A', '1:35–2:00'),
            ('B', '2:00–3:10'), ('B', '3:10–4:00'),
            ('C', '4:00–5:10'), ('C', '5:10–6:10'), ('C', '6:10–6:30'),
            ('D', '6:30–7:00'), ('D', '7:00–7:20'), ('D', '7:20–7:40'),
            ('全员', '排练')]
_sp = {'i': 0}


def speaker(slide, who, when, light=False):
    color = BRICK if who == 'D' else (MUTED if who == '全员' else GREEN)
    c = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(11.6), Inches(0.48), Inches(0.44), Inches(0.44))
    c.fill.solid(); c.fill.fore_color.rgb = color
    c.line.color.rgb = INK; c.line.width = Pt(1.0)
    c.shadow.inherit = False
    tf = c.text_frame
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = '全' if who == '全员' else who
    r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = WHITE; r.font.name = FONT
    text(slide, 9.9, 0.55, 1.55, 0.3, when, 9, False, LINE if light else MUTED, align=PP_ALIGN.RIGHT)


def footer(slide, n, section):
    rect(slide, ML, 7.02, CW, 0.035, fill=LINE)
    rect(slide, ML, 7.02, CW * n / TOTAL, 0.035, fill=BRICK)
    text(slide, ML, 7.12, 5, 0.25, section, 9, True, BRICK)
    text(slide, 11.6, 7.12, 1.0, 0.25, f"{n:02d} / {TOTAL}", 9, False, MUTED, align=PP_ALIGN.RIGHT)


def notes(slide, s):
    slide.notes_slide.notes_text_frame.text = s


def head(slide, section, title, subtitle=None):
    text(slide, ML, 0.52, 8, 0.28, section.upper(), 10, True, BRICK)
    text(slide, ML, 0.8, 10.2, 0.62, title, 27, True, INK, spacing=1.1)
    if subtitle:
        text(slide, ML, 1.36, 10.6, 0.35, subtitle, 12, False, MUTED)


def bullet_block(slide, items, x=ML, w=TEXT_W, block_y=BODY_Y, block_h=PIC_H):
    """4 条以内，整体与右侧图片垂直居中"""
    step = 0.82
    total = len(items) * step
    y0 = block_y + max(0.0, (block_h - total) / 2 + 0.05)
    for i, (lead, body, color) in enumerate(items):
        y = y0 + i * step
        rect(slide, x, y + 0.07, 0.09, 0.09, fill=color)
        tb = slide.shapes.add_textbox(Inches(x + 0.26), Inches(y - 0.04), Inches(w - 0.26), Inches(0.72))
        tf = tb.text_frame; tf.word_wrap = True
        tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
        p = tf.paragraphs[0]; p.line_spacing = 1.35
        r1 = p.add_run(); r1.text = lead
        r1.font.size = Pt(14); r1.font.bold = True; r1.font.color.rgb = INK; r1.font.name = FONT
        r2 = p.add_run(); r2.text = body
        r2.font.size = Pt(12.5); r2.font.color.rgb = INK2; r2.font.name = FONT


def pic_card(slide, path, caption):
    rect(slide, PIC_X + 0.08, BODY_Y + 0.08, PIC_W, PIC_H, fill=RGBColor(0xE6, 0xDA, 0xC4))
    p = slide.shapes.add_picture(path, Inches(PIC_X), Inches(BODY_Y), Inches(PIC_W), Inches(PIC_H))
    p.line.color.rgb = INK; p.line.width = Pt(1.25)
    text(slide, PIC_X, BODY_Y + PIC_H + 0.14, PIC_W, 0.3, caption, 10, False, MUTED, align=PP_ALIGN.CENTER)


def new(section, title, subtitle=None):
    s = prs.slides.add_slide(BLANK); bg(s)
    head(s, section, title, subtitle)
    who, when = SPEAKERS[_sp['i']] if _sp['i'] < len(SPEAKERS) else ('D', '')
    _sp['i'] += 1
    speaker(s, who, when)
    footer(s, len(prs.slides), section)
    return s


# 01 封面
s = prs.slides.add_slide(BLANK)
s.shapes.add_picture(os.path.join(IMG, 'cover.jpg'), 0, 0, prs.slide_width, prs.slide_height)
text(s, ML, 1.05, 8, 0.3, "首届「软工菁英杯」· 初级组 · 主题词：运动", 12, True, RGBColor(0xE8, 0xB4, 0xAE))
text(s, ML, 1.55, 8.6, 1.1, "练完吃啥", 54, True, WHITE, spacing=1.0)
text(s, ML, 2.55, 8.6, 0.8, "中大通关 · 南校运动地图", 30, True, RGBColor(0x9E, 0xD3, 0xB0), spacing=1.0)
rect(s, ML, 3.55, 1.2, 0.05, fill=BRICK)
text(s, ML, 3.8, 7.2, 1.0, "运动消耗的，吃回来；\n校园里的运动机会，帮你找出来。", 20, True, WHITE, spacing=1.35)
text(s, ML, 5.55, 7.2, 0.9,
     "演示  http://sportsfuel.120.78.120.161.nip.io/\n源码  github.com/liaohc-42/sports-fuel-agent", 11, False, LINE)
text(s, ML, 6.55, 7.2, 0.3, "汇报 8 分钟 ｜ 提问 2 分钟 ｜ 4 人分工", 10, False, RGBColor(0xB9, 0xAE, 0x9D))
speaker(s, 'A', '0:00–0:20', light=True)
notes(s, "【讲者A｜0:00–0:20】\n各位评委老师好，我们是「练完吃啥」团队，主题词是「运动」。\n"
         "一句话：练完怎么吃、校园里怎么练、去哪练。演示地址在左下角，也可扫码。")

# 02 一句话
s = new("Overview", "一句话：运动之后的两件事，我们都做了")
cards = [("01", "吃", "练完这顿在食堂怎么搭", GREEN),
         ("02", "练", "积分机会 + 体测提分", BRICK),
         ("03", "场馆", "去哪练、几点人少", GREEN)]
for i, (no, t, d, c) in enumerate(cards):
    x = ML + i * (CW / 3)
    rect(s, x, BODY_Y + 0.15, CW / 3 - 0.35, 2.5, fill=PAPER, line=INK)
    text(s, x + 0.3, BODY_Y + 0.4, 1, 0.3, no, 12, True, c)
    text(s, x + 0.3, BODY_Y + 0.75, 2.8, 0.6, t, 30, True, INK, spacing=1.0)
    text(s, x + 0.3, BODY_Y + 1.45, 2.9, 0.8, d, 13, False, INK2)
text(s, ML, BODY_Y + 3.0, CW, 0.5, "再给它们配一个共用的「教练」——训练、饮食、体测，随时能问。", 15, False, INK2)
notes(s, "【讲者A｜0:20–0:55】\n不是又一个健身 App。真正要做的决定只有两个：练完吃什么、去哪练。\n"
         "所以拆成吃、练、场馆，再共用一个教练。")

# 03 痛点
s = new("Problem", "三个真实痛点，都来自我们身边")
rows = [("01", "练完不知道吃什么", "食堂菜品固定，微信只能问朋友，练得认真、吃得全凭感觉"),
        ("02", "体测前不会练", "1000 米 4 分 35、引体 3 个，网上的计划不是给体育生就是每天 5 公里"),
        ("03", "想运动不知道去哪", "跑到体育馆全是人，也不知道学校有这么多能拿积分的机会")]
for i, (no, t, d) in enumerate(rows):
    y = BODY_Y + 0.2 + i * 1.45
    text(s, ML, y, 0.9, 0.5, no, 26, True, BRICK, spacing=1.0)
    text(s, ML + 1.0, y - 0.02, 10.6, 0.45, t, 19, True, INK)
    text(s, ML + 1.0, y + 0.46, 10.6, 0.55, d, 13.5, False, INK2)
    if i < 2:
        rect(s, ML, y + 1.18, CW, 0.012, fill=LINE)
text(s, ML, 5.95, CW, 0.4, "这三件事，正好对应我们的三条产品线：吃 / 练 / 场馆。", 13, False, MUTED)
notes(s, "【讲者A｜0:55–1:35】\n三个场景各一句，别展开。最后过渡：所以做了三个模块 + 一个教练。")

# 04 总览
s = new("Overview", "6 个入口，一条运动动线", "导航顺序：练 → 吃 → 教练 → 场馆 → 记录 → 我的")
items = [("🎯 练", "积分雷达 + 体测"), ("🍚 吃", "配餐 + 记录"), ("🤖 教练", "4 个入口共用"),
         ("🏟️ 场馆", "人流 + 替代建议"), ("📊 记录", "花销 / 运动 / 建议"), ("👤 我的", "档案 + 积分")]
for i, (t, d) in enumerate(items):
    x = ML + (i % 3) * (CW / 3)
    y = BODY_Y + 0.15 + (i // 3) * 1.75
    rect(s, x, y, CW / 3 - 0.35, 1.45, fill=PAPER, line=LINE, lw=1.0)
    text(s, x + 0.28, y + 0.22, 3.4, 0.4, t, 16, True, INK)
    text(s, x + 0.28, y + 0.72, 3.4, 0.5, d, 12, False, INK2)
text(s, ML, BODY_Y + 3.75, CW, 0.4, "每一块都能独立演示，也都能互相跳转。", 12.5, False, MUTED)
notes(s, "【讲者A｜1:35–2:00】\n让评委知道产品有多大。念六个入口，然后交给 B 讲吃。")

# 05 吃
s = new("Eat", "吃：三步，10 秒出结果")
bullet_block(s, [
    ("定目标  ", "减脂 / 增肌 / 维持，三段式；选中给策略", BRICK),
    ("选菜  ", "搜索 + 分类吸顶 + 不吃 chip", BRICK),
    ("出结果  ", "2–3 套横向对比 + 宏量条", BRICK),
    ("示例  ", "跑步 30 分钟 ≈ 307 千卡", GREEN),
])
pic_card(s, os.path.join(IMG, 'eat.jpg'), "配餐页 · 目标 / 运动 / 时长数轴")
notes(s, "【讲者B｜2:00–3:10】\n边点边讲：目标分段、选菜能搜能锚定、结果是横向对比。\nMET 9 × 65kg × 30min = 307 千卡。")

# 06 吃·数据
s = new("Eat", "吃：算得准，才敢给建议")
bullet_block(s, [
    ("热量  ", "MET × 3.5 × 体重 ÷ 200 × 分钟", BRICK),
    ("营养  ", "本地库 ~80 道，未收录按分类兜底", BRICK),
    ("食堂  ", "647 道菜 · 五校区 · 16% 有标价", BRICK),
    ("边界  ", "确定性计算不用大模型", GREEN),
])
pic_card(s, os.path.join(IMG, 'meal.jpg'), "推荐结果 · 宏量条 + 为什么这么配")
notes(s, "【讲者B｜3:10–4:00】\n回答「数据哪来的、算得对不对」。确定性计算不用大模型，估算值有标注。")

# 07 积分雷达
s = new("Practice", "练：积分雷达，把散落的机会聚合")
bullet_block(s, [
    ("13 条机会  ", "8 官方 + 5 社团/民间（不计分）", BRICK),
    ("三筛选叠加  ", "分类 / 状态 / 搜索", BRICK),
    ("排序  ", "未结束升序，已结束沉底", BRICK),
    ("详情  ", "AI 摘要 / 意向 / 讨论 / 评分", GREEN),
])
pic_card(s, os.path.join(IMG, 'radar.jpg'), "积分雷达 · 票根章分值 + 进度条")
notes(s, "【讲者C｜4:00–5:10】\n机会散在公众号、群、海报里。点进详情展示 AI 摘要和意向。社团活动不计分。")

# 08 体测
s = new("Practice", "练：体测，从「算分」到「该练哪项」")
bullet_block(s, [
    ("官方原表  ", "2014 版，大一/大二 + 大三/大四", BRICK),
    ("零分线  ", "引体 4 个 = 0 分，5 个 = 10 分", BRICK),
    ("表 8 加分  ", "单项 +10，总分上限 120", BRICK),
    ("提分榜  ", "引体 3→10 个 ≈ +54 分", GREEN),
])
pic_card(s, os.path.join(IMG, 'fitness.jpg'), "体测急救站 · 录入即算分")
notes(s, "【讲者C｜5:10–6:10】\n0 分线、表 8 加分、120 上限，说明逐格核过。现场改成绩，榜单重排。")

# 09 场馆
s = new("Venue", "场馆：去之前看一眼，到了点一下")
bullet_block(s, [
    ("22 个场馆  ", "五校区，自绘 SVG，不碰地图授权", BRICK),
    ("两级兜底  ", "实时上报 >60% → 历史规律 → 默认", BRICK),
    ("替代建议  ", "人多时自动推荐同类型空场馆", BRICK),
    ("合规  ", "数据只存本机，标注「模拟数据」", GREEN),
])
pic_card(s, os.path.join(IMG, 'venue.jpg'), "场馆页 · 人流徽章 + 规律建议")
notes(s, "【讲者C｜6:10–6:50】\n讲判定顺序，这是最容易被问的点。现场点一次「人多」。")

# 10 教练
s = new("Agent", "教练：四个入口，状态诚实")
bullet_block(s, [
    ("四个入口  ", "教练 / 配餐点评 / 体测解读 / 记录建议", BRICK),
    ("输出校验  ", "JSON Schema + 规则拦截 + 模板回退", BRICK),
    ("不装  ", "没配 Key 就显示「本地规则」", BRICK),
    ("安全  ", "Key 只在后端，限流 + CORS 白名单", GREEN),
])
pic_card(s, os.path.join(IMG, 'coach.jpg'), "教练页 · 在线状态与模型通道")
notes(s, "【讲者D｜6:50–7:20】\n最容易被问「AI 在哪」，四句话讲完。有 Key 就演示一句；没有就如实说本地规则。")

# 11 架构
s = new("Stack", "架构：纯静态 + 一台国内 ECS", "为什么不用 Vercel：国内被墙，评委打不开")
cols = [("前端", "原生 HTML / CSS / JS\n同源调用 /api\n资源带版本号防缓存"),
        ("后端", "阿里云 ECS + Nginx\n/api 反代 Node/Express\nsystemd 守护、开机自启"),
        ("模型", "GLM / DeepSeek / Ollama\n三通道任选其一\nKey 只在服务器 .env")]
for i, (t, d) in enumerate(cols):
    x = ML + i * (CW / 3)
    rect(s, x, BODY_Y + 0.15, CW / 3 - 0.35, 2.25, fill=PAPER, line=INK)
    text(s, x + 0.3, BODY_Y + 0.38, 3.3, 0.4, t, 18, True, BRICK if i == 2 else GREEN)
    text(s, x + 0.3, BODY_Y + 0.92, 3.4, 1.3, d, 12.5, False, INK2, spacing=1.45)
text(s, ML, BODY_Y + 2.85, CW, 0.4,
     "国内直连  http://120.78.120.161/    ｜    域名  http://sportsfuel.120.78.120.161.nip.io/", 12, False, MUTED)
notes(s, "【讲者D｜6:50–7:20】\n25 秒讲清架构与部署：为什么不用 Vercel（被墙）、为什么同源（混合内容）。")

# 12 工程质量
s = new("Quality", "工程质量：该有的证据都在")
stats = [("9", "套自动化测试", "引导 / 整站 / 冒烟 / Agent / 通道 / 场馆 / ID / 引用 / 线上"),
         ("13", "张官方表核对", "BMI、肺活量、50m、体前屈、跳远、引体、耐力跑、加分表"),
         ("2", "个可用入口", "ECS（直连 + 域名）+ GitHub Pages 备份")]
for i, (n, t, d) in enumerate(stats):
    x = ML + i * (CW / 3)
    rect(s, x, BODY_Y + 0.25, CW / 3 - 0.35, 2.75, fill=PAPER, line=LINE, lw=1.0)
    text(s, x + 0.3, BODY_Y + 0.5, 1.6, 0.9, n, 44, True, BRICK, spacing=1.0)
    text(s, x + 0.3, BODY_Y + 1.45, 3.3, 0.4, t, 15, True, INK)
    text(s, x + 0.3, BODY_Y + 1.92, 3.3, 0.9, d, 11.5, False, INK2, spacing=1.35)
text(s, ML, BODY_Y + 3.35, CW, 0.7, "边界：无账号体系（数据本机）；AI 破冰语、关键词订阅、联网检索列为未来方向——如实说明。", 12, False, MUTED)
notes(s, "【讲者D｜7:20–7:40】\n用证据收尾：测试、数据、部署。主动说边界比被问出来好。")

# 13 演示动线
s = new("Runbook", "排练用：谁、讲多久、点什么", "正式页右上角已标注讲者与时间段，这里只做排练速查")
plan = [("A", "0:00–2:00", "开场 → 痛点 → 总览", "停在封面讲"),
        ("B", "2:00–4:00", "吃：定目标 → 搜「鸡」→ 生成", "指宏量条"),
        ("C", "4:00–6:30", "练：雷达 → 体测 → 场馆", "改成绩看榜"),
        ("D", "6:30–8:00", "架构 → Agent → 收尾", "指状态条")]
for i, (who, t, d, tip) in enumerate(plan):
    y = BODY_Y + 0.1 + i * 1.25
    rect(s, ML, y, 0.62, 0.62, fill=BRICK if who == "D" else GREEN)
    text(s, ML, y + 0.13, 0.62, 0.4, who, 18, True, WHITE, align=PP_ALIGN.CENTER)
    text(s, ML + 0.95, y + 0.02, 2.2, 0.4, t, 15, True, INK)
    text(s, ML + 3.2, y + 0.02, 6.2, 0.4, d, 14, False, INK2)
    text(s, ML + 9.6, y + 0.02, 2.4, 0.4, tip, 11.5, False, MUTED)
notes(s, "提词卡：谁讲哪段、点什么。\n演示前检查：ECS 能开、状态条绿色、场馆上报已清空。")

# 14 结尾
s = prs.slides.add_slide(BLANK); bg(s)
rect(s, 0, 0, 0.18, 7.5, fill=BRICK)
text(s, ML, 1.15, 7.4, 0.85, "运动消耗的，", 36, True, INK, spacing=1.0)
text(s, ML, 1.95, 7.4, 0.85, "我们帮你吃回来；", 36, True, BRICK, spacing=1.0)
text(s, ML, 2.75, 7.4, 0.85, "校园里的运动机会，", 36, True, INK, spacing=1.0)
text(s, ML, 3.55, 7.4, 0.85, "我们帮你找出来。", 36, True, GREEN, spacing=1.0)
rect(s, ML, 4.75, 1.2, 0.05, fill=BRICK)
text(s, ML, 4.98, 7.4, 0.4, "谢谢各位评委老师！", 18, False, INK2)
text(s, ML, 5.65, 7.4, 1.2,
     "团队：练完吃啥（4 人分工：产品 / 饮食 / 运动 / 技术）\n"
     "源码：github.com/liaohc-42/sports-fuel-agent\n"
     "演示：http://sportsfuel.120.78.120.161.nip.io/", 11, False, MUTED, spacing=1.4)
rect(s, 9.35, 1.55, 2.5, 2.5, fill=RGBColor(0xFF, 0xFF, 0xFF), line=INK)
s.shapes.add_picture(QR, Inches(9.47), Inches(1.67), Inches(2.26), Inches(2.26))
text(s, 9.1, 4.2, 3.0, 0.9, "扫码体验\n演示入口 / 手机可用", 11, False, MUTED, align=PP_ALIGN.CENTER, spacing=1.35)
speaker(s, 'D', '7:40–8:00')
footer(s, 14, "End")
notes(s, "【讲者D｜7:40–8:00】\n最后一句话说完就停。\nQ&A：D 主答，B 补饮食、C 补运动、A 补赛制。")

OUT = r"C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent\docs\答辩PPT-练完吃啥.pptx"
prs.save(OUT)
print("OK slides=", len(prs.slides), OUT)
