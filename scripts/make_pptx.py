# -*- coding: utf-8 -*-
"""生成「练完吃啥」答辩演示 PPT（16:9，与 docs/答辩稿.md 对应）"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

GREEN = RGBColor(0x16, 0xA3, 0x4A)
GREEN_DARK = RGBColor(0x15, 0x80, 0x3D)
ORANGE = RGBColor(0xF9, 0x73, 0x16)
INK = RGBColor(0x1F, 0x29, 0x37)
GRAY = RGBColor(0x4B, 0x55, 0x63)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = RGBColor(0xF6, 0xF8, 0xF7)
SOFT_GREEN = RGBColor(0xEC, 0xFD, 0xF5)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

def add_rect(slide, x, y, w, h, color, line=False):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = color
    if line:
        sh.line.color.rgb = color
    else:
        sh.line.fill.background()
    sh.shadow.inherit = False
    return sh

def add_text(slide, x, y, w, h, text, size, color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font='Microsoft YaHei'):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]; p.alignment = align
    r = p.add_run(); r.text = text
    r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = font
    return tb

def add_bullets(slide, x, y, w, h, items, size=18, color=INK, gap=8, lead_color=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    first = True
    for it in items:
        if isinstance(it, tuple):
            txt, sub = it
        else:
            txt, sub = it, None
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(gap)
        if lead_color is not None:
            lead = p.add_run(); lead.text = '▍'; lead.font.color.rgb = lead_color; lead.font.bold = True; lead.font.size = Pt(size)
        r = p.add_run(); r.text = txt
        r.font.size = Pt(size); r.font.color.rgb = color; r.font.name = 'Microsoft YaHei'
        if sub:
            p2 = tf.add_paragraph(); p2.space_after = Pt(gap + 2)
            r2 = p2.add_run(); r2.text = '    ' + sub
            r2.font.size = Pt(size - 3); r2.font.color.rgb = GRAY; r2.font.name = 'Microsoft YaHei'
    return tb

def header(slide, title, accent=GREEN, kicker=None):
    add_rect(slide, 0, 0, prs.slide_width, Inches(1.15), accent)
    add_rect(slide, 0, Inches(1.15), prs.slide_width, Inches(0.06), ORANGE)
    add_text(slide, Inches(0.6), Inches(0.18), Inches(11), Inches(0.5), title, 26, WHITE, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    if kicker:
        add_text(slide, Inches(0.6), Inches(0.72), Inches(11), Inches(0.32), kicker, 12, RGBColor(0xDD, 0xF7, 0xE8))

def footer(slide, n):
    add_text(slide, Inches(0.6), Inches(7.02), Inches(6), Inches(0.3), '练完吃啥 · 软工菁英杯', 10, RGBColor(0x9C, 0xA3, 0xAF))
    add_text(slide, Inches(12.3), Inches(7.02), Inches(0.7), Inches(0.3), str(n), 12, RGBColor(0x9C, 0xA3, 0xAF), align=PP_ALIGN.RIGHT)

# ---------- 1 封面 ----------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, prs.slide_width, prs.slide_height, GREEN)
add_rect(s, 0, Inches(5.1), prs.slide_width, Inches(0.09), ORANGE)
add_text(s, Inches(0.9), Inches(1.6), Inches(11.5), Inches(1.2), '🔥 练完吃啥', 60, WHITE, bold=True)
add_text(s, Inches(0.9), Inches(2.9), Inches(11.5), Inches(0.7), '运动 × 饮食 · 智能体', 30, RGBColor(0xDD, 0xF7, 0xE8), bold=True)
add_text(s, Inches(0.9), Inches(3.8), Inches(11.5), Inches(0.5), '主题词：运动 ｜ 练完吃啥 · 体测急救站', 18, WHITE)
add_text(s, Inches(0.9), Inches(5.5), Inches(11.5), Inches(1.0), '软件工程学院 · 首届「软工菁英杯」技术创新应用大赛\n团队：________  答辩日期：____', 16, WHITE)

# ---------- 2 一句话 ----------
s = prs.slides.add_slide(BLANK)
header(s, '我们的一句话', GREEN, 'WHAT WE DO')
add_text(s, Inches(1.2), Inches(2.2), Inches(11), Inches(1.2), '运动消耗的，吃回来补上；', 40, INK, bold=True)
add_text(s, Inches(1.2), Inches(3.6), Inches(11), Inches(1.2), '体测要考的，练上去提分。', 40, ORANGE, bold=True)
add_text(s, Inches(1.2), Inches(5.2), Inches(11), Inches(0.8), '一个面向中山大学学生的「运动 + 饮食」智能体，不是健身 App，也不是静态计划表。', 20, GRAY)
footer(s, 2)

# ---------- 3 痛点 ----------
s = prs.slides.add_slide(BLANK)
header(s, '痛点：两个真实高频的困扰', ORANGE, 'WHY')
add_rect(s, Inches(0.6), Inches(1.6), Inches(5.9), Inches(4.6), SOFT_GREEN)
add_text(s, Inches(0.9), Inches(1.85), Inches(5.3), Inches(0.5), '痛点一：想增肌/减脂，食堂不会搭', 20, GREEN_DARK, bold=True)
add_bullets(s, Inches(0.9), Inches(2.5), Inches(5.3), Inches(3.4), [
    '食堂菜品固定，不知如何搭配',
    '微信只能问朋友，闹钟只能提醒吃饭',
    '都拿不出专业营养建议',
], 16, INK, lead_color=GREEN)
add_rect(s, Inches(6.85), Inches(1.6), Inches(5.9), Inches(4.6), RGBColor(0xFF, 0xF7, 0xED))
add_text(s, Inches(7.15), Inches(1.85), Inches(5.3), Inches(0.5), '痛点二：体测临近，想提分不会练', 20, ORANGE, bold=True)
add_bullets(s, Inches(7.15), Inches(2.5), Inches(5.3), Inches(3.4), [
    '1000 米 4 分 35、引体 3 个，怎么练？',
    '网上计划不是给体育生，就是让你每天跑 5 公里',
    '体测 ≠ 健身，是「固定日期前多拿几分」',
], 16, INK, lead_color=ORANGE)
footer(s, 3)

# ---------- 4 产品结构 ----------
s = prs.slides.add_slide(BLANK)
header(s, '产品结构：一主一副', GREEN, 'WHAT')
add_rect(s, Inches(0.6), Inches(1.6), Inches(7.4), Inches(4.6), WHITE)
add_text(s, Inches(0.9), Inches(1.8), Inches(6.8), Inches(0.5), '方案 A · 练完吃啥（主）', 24, GREEN_DARK, bold=True)
add_bullets(s, Inches(0.9), Inches(2.4), Inches(6.8), Inches(3.5), [
    '食堂运动餐推荐官',
    '选目标 → 勾菜品 → 出 2 套搭配 + 营养占比',
    '运动消耗 / 热量缺口 / 替代建议',
], 18, INK, lead_color=GREEN)
add_rect(s, Inches(8.3), Inches(1.6), Inches(4.4), Inches(4.6), WHITE)
add_text(s, Inches(8.6), Inches(1.8), Inches(3.9), Inches(0.5), '方案 B · 体测急救站', 24, ORANGE, bold=True)
add_bullets(s, Inches(8.6), Inches(2.4), Inches(3.9), Inches(3.5), [
    '14 天体测提分教练',
    '30 秒输入 → 诊断',
    '7 天计划 + 配速器',
], 18, INK, lead_color=ORANGE)
footer(s, 4)

# ---------- 5 方案A演示 ----------
s = prs.slides.add_slide(BLANK)
header(s, '方案 A 演示 · 练完吃啥', GREEN, 'DEMO A')
steps = ['① 选目标 增肌/减脂/维持', '② 选运动·时长·强度', '③ 勾今天食堂的菜', '④ 设预算/时间约束', '⑤ 生成搭配']
x = Inches(0.6); w = Inches(2.25)
for i, st in enumerate(steps):
    add_rect(s, x, Inches(1.7), w, Inches(1.0), GREEN if i % 2 == 0 else ORANGE)
    add_text(s, x + Inches(0.08), Inches(1.85), w - Inches(0.16), Inches(0.7), st, 15, WHITE, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    x += w + Inches(0.18)
add_rect(s, Inches(0.6), Inches(3.1), Inches(12.1), Inches(3.5), LIGHT)
add_bullets(s, Inches(0.9), Inches(3.35), Inches(11.5), Inches(3.0), [
    ('输出：两套搭配 + 每道菜「推荐/适量/少吃」 + 蛋白质·碳水·脂肪占比条', None),
    ('替代建议：白米饭 → 玉米/杂粮饭；水煮肉片 → 清蒸鱼/白切鸡', None),
    ('核心任务 30 秒完成，一键即用', None),
], 18, INK, lead_color=GREEN)
footer(s, 5)

# ---------- 6 亮点 ----------
s = prs.slides.add_slide(BLANK)
header(s, '方案 A 亮点', GREEN, 'HIGHLIGHTS')
add_bullets(s, Inches(0.7), Inches(1.6), Inches(12), Inches(5.2), [
    ('运动项目含徒步/游泳，力量·球类拆分子分支', '上肢/下肢/核心/全身；篮球/足球/羽毛球/乒乓球/排球/网球'),
    ('时长数轴（分度 5 分钟）+ 强度参考小字', '跑步「正常」= 配速 5\'00"~7\'00"'),
    ('自动算运动消耗 + 今日热量缺口', '基于 MET × 3.5 × 体重 / 200 × 分钟'),
    ('五校区食堂数据 + 价格 + 后台手动更新', '647 道菜，覆盖广州南/北/东、珠海、深圳'),
    ('预算/时间数轴 + 不限/不赶时间/自定义', '分度值 1 元 / 1 分钟'),
    ('记录：改方案·花销统计·最近运动直方图', '本周/本月/今年 + AI 建议'),
], 17, INK, gap=10, lead_color=GREEN)
footer(s, 6)

# ---------- 7 方案B演示 ----------
s = prs.slides.add_slide(BLANK)
header(s, '方案 B 演示 · 体测急救站', ORANGE, 'DEMO B')
add_text(s, Inches(0.7), Inches(1.5), Inches(12), Inches(0.5), '人设：大一男生 · 1000 米 4\'35" · 引体 3 个 · 12 天后体测', 18, INK, bold=True)
add_bullets(s, Inches(0.7), Inches(2.15), Inches(12), Inches(2.6), [
    ('30 秒输入 → 诊断：1000 米 ≈ 59 分，引体 ≈ 40 分', None),
    ('今日训练：分步计划 + 计时器 + 语音提示', None),
    ('配速器：每 200 米报时，不依赖 GPS', None),
    ('打卡调载：太累/疼痛/没时间 → 自动降载换项', '膝盖疼 → 深蹲自动换成臀桥/死虫'),
], 17, INK, gap=8, lead_color=ORANGE)
add_rect(s, Inches(0.7), Inches(5.0), Inches(12), Inches(1.6), RGBColor(0xFF, 0xF7, 0xED))
add_text(s, Inches(0.95), Inches(5.15), Inches(11.5), Inches(0.4), '关键交互：它不是静态计划表，会根据你的反馈实时改', 16, ORANGE, bold=True)
footer(s, 7)

# ---------- 8 提分性价比 ----------
s = prs.slides.add_slide(BLANK)
header(s, '提分性价比：先练哪项？', ORANGE, 'DIAGNOSIS')
add_rect(s, Inches(0.7), Inches(1.7), Inches(5.8), Inches(4.4), SOFT_GREEN)
add_text(s, Inches(0.95), Inches(1.95), Inches(5.3), Inches(0.5), '引体向上：3 → 5 个', 20, GREEN_DARK, bold=True)
add_text(s, Inches(0.95), Inches(2.55), Inches(5.3), Inches(1.0), '≈ +20 分', 44, GREEN_DARK, bold=True)
add_text(s, Inches(0.95), Inches(3.7), Inches(5.3), Inches(0.5), '（40 分 → 60 分）', 16, GRAY)
add_rect(s, Inches(6.85), Inches(1.7), Inches(5.8), Inches(4.4), RGBColor(0xFF, 0xF7, 0xED))
add_text(s, Inches(7.1), Inches(1.95), Inches(5.3), Inches(0.5), '1000 米：提 10 秒', 20, ORANGE, bold=True)
add_text(s, Inches(7.1), Inches(2.55), Inches(5.3), Inches(1.0), '≈ +4 分', 44, ORANGE, bold=True)
add_text(s, Inches(7.1), Inches(3.7), Inches(5.3), Inches(0.5), '（59 分 → 63 分）', 16, GRAY)
add_text(s, Inches(0.7), Inches(6.25), Inches(12), Inches(0.5), '结论：先练引体向上，性价比更高 —— 按《国家学生体质健康标准》透明算分，不用大模型', 16, INK, bold=True)
footer(s, 8)

# ---------- 9 技术架构 ----------
s = prs.slides.add_slide(BLANK)
header(s, '技术架构：大模型只做「解释」，不做「计算」', GREEN, 'TECH')
add_rect(s, Inches(0.7), Inches(1.6), Inches(5.8), Inches(4.5), LIGHT)
add_text(s, Inches(0.95), Inches(1.8), Inches(5.3), Inches(0.5), '前端（GitHub Pages 静态）', 18, GREEN_DARK, bold=True)
add_bullets(s, Inches(0.95), Inches(2.4), Inches(5.3), Inches(3.5), [
    '原生 HTML/CSS/JS',
    '本地规则引擎（离线兜底）',
    '营养库 / MET 库 / 评分表',
], 16, INK, lead_color=GREEN)
add_rect(s, Inches(6.85), Inches(1.6), Inches(5.8), Inches(4.5), RGBColor(0xFF, 0xF7, 0xED))
add_text(s, Inches(7.1), Inches(1.8), Inches(5.3), Inches(0.5), '后端（Express / Vercel）', 18, ORANGE, bold=True)
add_bullets(s, Inches(7.1), Inches(2.4), Inches(5.3), Inches(3.5), [
    '代理调用 GLM-4-Flash',
    'API Key 藏在后端',
    'JSON 校验 + 回退模板',
], 16, INK, lead_color=ORANGE)
add_text(s, Inches(0.7), Inches(6.25), Inches(12), Inches(0.5), '评分/热量/营养 = 本地确定性计算；大模型只做点评、问答、教练 —— 零幻觉、可复核', 16, INK, bold=True)
footer(s, 9)

# ---------- 10 数据 ----------
s = prs.slides.add_slide(BLANK)
header(s, '数据：可追溯、明示估算', GREEN, 'DATA')
add_bullets(s, Inches(0.7), Inches(1.6), Inches(12), Inches(5.2), [
    ('食堂数据', '《中山大学食堂菜单价格明细表》647 道菜、46 个食堂、5 校区，每条标注出处'),
    ('营养数据', '优先《中国食物成分表》匹配，搜不到按常识估算并标注「估算值」'),
    ('运动热量', 'MET（Compendium 2011）+ Mifflin-St Jeor 公式'),
    ('体测评分', '《国家学生体质健康标准(2014 修订)》本地 JSON 透明算分'),
    ('无标价菜品（约 84%）', '按分类「参考价(估)」+ 支持后台手动更新，如实说明更可信'),
], 17, INK, gap=10, lead_color=GREEN)
footer(s, 10)

# ---------- 11 加分项 ----------
s = prs.slides.add_slide(BLANK)
header(s, '加分项：逐条命中', ORANGE, 'BONUS')
items = [
    ('🏆 六边形战士奖', '功能(A+B) · 创意(运动×饮食) · 体验(数轴/直方图/配速器) · 展示 全覆盖'),
    ('🎯 需求洞察奖', '解决「练后不会搭食堂餐」和「体测不会针对性训练」两个真实高频需求'),
    ('⚡ 一键即用奖', '选目标→勾菜品→出方案；30 秒输入→出诊断；无后端/无网也能用'),
]
y = Inches(1.7)
for t, d in items:
    add_rect(s, Inches(0.7), y, Inches(12), Inches(1.4), LIGHT if '六' in t else (RGBColor(0xFF, 0xF7, 0xED) if '需求' in t else SOFT_GREEN))
    add_text(s, Inches(1.0), y + Inches(0.16), Inches(11.4), Inches(0.5), t, 20, GREEN_DARK if '六' in t or '一键' in t else ORANGE, bold=True)
    add_text(s, Inches(1.0), y + Inches(0.72), Inches(11.4), Inches(0.5), d, 15, GRAY)
    y += Inches(1.62)
add_text(s, Inches(0.7), Inches(6.6), Inches(12), Inches(0.5), '实际应用价值：可每天使用，非一次性工具', 16, INK, bold=True)
footer(s, 11)

# ---------- 12 总结 ----------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, prs.slide_width, prs.slide_height, GREEN)
add_text(s, Inches(1.2), Inches(2.3), Inches(11), Inches(1.0), '运动消耗的，吃回来补上；', 38, WHITE, bold=True)
add_text(s, Inches(1.2), Inches(3.5), Inches(11), Inches(1.0), '体测要考的，练上去提分。', 38, RGBColor(0xFF, 0xE5, 0xC8), bold=True)
add_text(s, Inches(1.2), Inches(5.2), Inches(11), Inches(0.6), '谢谢各位评委老师！欢迎提问。', 22, WHITE)

prs.save(r'C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent\docs\答辩PPT-练完吃啥.pptx')
print('OK 生成 PPTX：', prs.slides.__len__(), '页')
