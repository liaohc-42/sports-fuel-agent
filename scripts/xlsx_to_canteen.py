# -*- coding: utf-8 -*-
"""把《中山大学食堂菜单价格明细表.xlsx》转换为前端/后端可用的食堂数据。
输出:
  - frontend/data/canteen.js   (window.SYSU_CANTEENS = [...] 前端直接 <script> 引入)
  - backend/data/canteen.json   (后端/admin 使用)
"""
import openpyxl, json, re, os

SRC = r'C:\Users\liao\Desktop\中山大学食堂菜单价格明细表.xlsx'
ROOT = r'C:\Users\liao\Documents\deepseek-harness\default-workspace\sports-fuel-agent'
os.makedirs(os.path.join(ROOT, 'frontend', 'data'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'backend', 'data'), exist_ok=True)

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb['菜品价格明细']

# ---- 价格解析 ----
def parse_price(v):
    """返回 (price, price_min, price_max, note)
    price=None 表示无标价。"""
    if v is None:
        return None, None, None, '无标价(自选/称重/当日浮动)'
    s = str(v).strip()
    if s in ('', '无', 'None', 'nan'):
        return None, None, None, '无标价(自选/称重/当日浮动)'
    s = s.replace('元', '').strip()
    if s == '' or s in ('无标价',):
        return None, None, None, '无标价(自选/称重/当日浮动)'
    m = re.match(r'^(\d+(?:\.\d+)?)\s*[-~—]\s*(\d+(?:\.\d+)?)$', s)
    if m:
        lo, hi = float(m.group(1)), float(m.group(2))
        return None, lo, hi, '区间价'
    m = re.match(r'^(\d+(?:\.\d+)?)$', s)
    if m:
        p = float(m.group(1))
        return p, None, None, '有标价'
    return None, None, None, '无标价(自选/称重/当日浮动)'

# ---- 分类默认参考价(估算) ----
def est_price(category, name, tags):
    cat = (category or '')
    n = (name or '')
    tg = (tags or '')
    if any(k in cat for k in ('套餐',)) or '套餐' in n:
        return 20
    if any(k in cat for k in ('烧腊', '卤味', '卤水')):
        return 15
    if any(k in cat for k in ('糖水', '甜品', '饮品', '饮料')):
        return 8
    if any(k in cat for k in ('饺子', '云吞', '面点')) or any(k in n for k in ('饺', '云吞', '包', '饼', '馒头')):
        return 8
    if any(k in cat for k in ('面食', '面点', '粉面', '粥', '主食')) or any(k in n for k in ('面', '粉', '粥', '饭', '粿条', '肠粉')):
        return 10
    if any(k in cat for k in ('素', '青菜', '蔬菜', '凉拌')) or any(k in n for k in ('青菜', '素', '蔬菜', '西兰花')):
        return 4
    if any(k in cat for k in ('热菜', '肉类', '小炒', '湘菜', '川湘', '粤菜', '风味', '清真', '大众', '自选')):
        return 14
    return 12

rows = []
for r in ws.iter_rows(min_row=2, values_only=True):
    seq, campus, canteen, window, cat, name, price_v, price_status, comp, tags, source = (list(r) + [None]*11)[:11]
    if not name or not str(name).strip() or str(name).strip() == '无':
        continue
    campus = (campus or '').strip()
    canteen = (canteen or '').strip()
    window = (window or '全层').strip()
    cat = (cat or '').strip()
    name = str(name).strip()
    price, pmin, pmax, pnote = parse_price(price_v)
    tags = (tags or '').strip()
    source = (source or '').strip()
    est = est_price(cat, name, tags)
    rows.append({
        'campus': campus,
        'canteen': canteen,
        'window': window,
        'category': cat,
        'name': name,
        'price': price,
        'priceMin': pmin,
        'priceMax': pmax,
        'priceNote': pnote,
        'estPrice': est,
        'tags': tags,
        'source': source,
    })

# ---- 分组: campus -> canteen -> window -> dishes ----
campus_map = {}
for d in rows:
    cm = campus_map.setdefault(d['campus'], {})
    ct = cm.setdefault(d['canteen'], {})
    wd = ct.setdefault(d['window'], [])
    wd.append({k: d[k] for k in ('category', 'name', 'price', 'priceMin', 'priceMax', 'priceNote', 'estPrice', 'tags', 'source')})

canteens_data = []
for campus in campus_map:
    canteens = []
    for cname in campus_map[campus]:
        windows = []
        for wname in campus_map[campus][cname]:
            dishes = campus_map[campus][cname][wname]
            # 去重(同名菜品同一窗口只留一条，保留有标价的优先)
            seen = {}
            for d in dishes:
                key = d['name']
                if key in seen:
                    if d['price'] is not None and seen[key]['price'] is None:
                        seen[key] = d
                    continue
                seen[key] = d
            windows.append({'name': wname, 'dishes': list(seen.values())})
        canteens.append({'name': cname, 'windows': windows})
    canteens_data.append({'campus': campus, 'canteens': canteens})

# 校区排序：五校区在前，全校区同步最后
CAMPUS_ORDER = ['广州校区南校园', '广州校区北校园', '广州校区东校园', '珠海校区', '深圳校区']
def campus_key(c):
    if c in CAMPUS_ORDER:
        return CAMPUS_ORDER.index(c)
    return 99
canteens_data.sort(key=lambda c: campus_key(c['campus']))

# ---- 写 JSON ----
json_path = os.path.join(ROOT, 'backend', 'data', 'canteen.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump({'generatedFrom': '中山大学食堂菜单价格明细表.xlsx', 'campuses': canteens_data},
              f, ensure_ascii=False, indent=2)

# ---- 写 JS ----
js_path = os.path.join(ROOT, 'frontend', 'data', 'canteen.js')
with open(js_path, 'w', encoding='utf-8') as f:
    f.write('/* 由 scripts/xlsx_to_canteen.py 从《中山大学食堂菜单价格明细表.xlsx》自动生成，请勿手改 */\n')
    f.write('window.SYSU_CANTEENS = ')
    json.dump(canteens_data, f, ensure_ascii=False)
    f.write(';\n')

n_dish = len(rows)
n_priced = sum(1 for d in rows if d['price'] is not None)
print('OK 菜品总数=%d  有标价=%d  (%.0f%%)' % (n_dish, n_priced, 100*n_priced/max(1,n_dish)))
print('校区数=%d' % len(canteens_data))
for c in canteens_data:
    nc = len(c['canteens'])
    print('  - %s (%d个食堂)' % (c['campus'], nc))
print('JSON ->', json_path)
print('JS   ->', js_path)
