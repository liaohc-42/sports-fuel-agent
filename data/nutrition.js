/* ============================================================
 * 营养数据库 nutrition.js
 * 说明：以下数值为“每份(常见食堂份量)”的估算值。
 *   - src === '库'  : 参考《中国食物成分表(第6版)》等常见份量换算
 *   - src === '估'  : 基于常见做法/常识估算，前端会标注「估算值」
 * 单位：kcal(千卡)、protein(蛋白质g)、carbs(碳水g)、fat(脂肪g)
 * ============================================================ */
(function () {
  'use strict';

  // 单个菜品：{ kcal, protein, carbs, fat, per, src, cat }
  // cat 用于归类与替代建议：主食/蛋白/蔬菜/热菜/烧腊/面食/糖水/饮品/汤/其他
  const DB = {
    // ---------- 主食 ----------
    '白米饭':     { kcal: 232, protein: 4.3, carbs: 51.6, fat: 0.3, per: '200g/碗', src: '库', cat: '主食' },
    '紫米饭':     { kcal: 220, protein: 5, carbs: 48, fat: 1, per: '200g', src: '估', cat: '主食' },
    '杂粮饭':     { kcal: 220, protein: 5, carbs: 48, fat: 1, per: '200g', src: '估', cat: '主食' },
    '玉米':       { kcal: 112, protein: 4, carbs: 24, fat: 1.5, per: '1根', src: '库', cat: '主食' },
    '红薯':       { kcal: 130, protein: 2, carbs: 30, fat: 0.3, per: '150g', src: '库', cat: '主食' },
    '紫薯':       { kcal: 120, protein: 2, carbs: 28, fat: 0.3, per: '150g', src: '库', cat: '主食' },
    '炒饭':       { kcal: 420, protein: 9, carbs: 60, fat: 16, per: '250g', src: '估', cat: '主食' },
    '馒头':       { kcal: 223, protein: 7, carbs: 47, fat: 1, per: '100g/个', src: '库', cat: '主食' },
    '包子':       { kcal: 150, protein: 6, carbs: 25, fat: 4, per: '1个', src: '库', cat: '主食' },
    '粥':         { kcal: 140, protein: 3, carbs: 30, fat: 0.5, per: '300g/碗', src: '估', cat: '主食' },
    '肠粉':       { kcal: 280, protein: 6, carbs: 45, fat: 8, per: '250g', src: '估', cat: '主食' },
    '饺子':       { kcal: 350, protein: 15, carbs: 45, fat: 12, per: '10个', src: '估', cat: '主食' },
    '云吞':       { kcal: 300, protein: 14, carbs: 40, fat: 10, per: '10个', src: '估', cat: '主食' },
    '炒粉':       { kcal: 400, protein: 10, carbs: 55, fat: 16, per: '300g', src: '估', cat: '主食' },
    '油条':       { kcal: 270, protein: 6, carbs: 30, fat: 14, per: '1根', src: '库', cat: '主食' },

    // ---------- 蛋白质 / 肉类 ----------
    '鸡胸肉':     { kcal: 200, protein: 38, carbs: 0, fat: 5, per: '150g', src: '库', cat: '蛋白' },
    '鸡扒':       { kcal: 260, protein: 30, carbs: 5, fat: 13, per: '150g', src: '估', cat: '蛋白' },
    '鸡腿':       { kcal: 260, protein: 28, carbs: 0, fat: 16, per: '150g', src: '库', cat: '蛋白' },
    '白切鸡':     { kcal: 250, protein: 30, carbs: 1, fat: 14, per: '150g', src: '估', cat: '蛋白' },
    '手撕鸡':     { kcal: 280, protein: 30, carbs: 3, fat: 16, per: '150g', src: '估', cat: '蛋白' },
    '烧鸭':       { kcal: 320, protein: 28, carbs: 2, fat: 22, per: '150g', src: '估', cat: '烧腊' },
    '烧腊':       { kcal: 320, protein: 28, carbs: 2, fat: 22, per: '150g', src: '估', cat: '烧腊' },
    '叉烧':       { kcal: 300, protein: 25, carbs: 10, fat: 18, per: '150g', src: '估', cat: '烧腊' },
    '烧肉':       { kcal: 400, protein: 24, carbs: 0, fat: 33, per: '150g', src: '估', cat: '烧腊' },
    '卤味':       { kcal: 300, protein: 26, carbs: 3, fat: 20, per: '150g', src: '估', cat: '烧腊' },
    '鱼':         { kcal: 160, protein: 28, carbs: 0, fat: 5, per: '150g', src: '库', cat: '蛋白' },
    '鱼片':       { kcal: 160, protein: 28, carbs: 0, fat: 5, per: '150g', src: '估', cat: '蛋白' },
    '虾':         { kcal: 90, protein: 19, carbs: 1, fat: 1, per: '100g', src: '库', cat: '蛋白' },
    '牛肉':       { kcal: 250, protein: 32, carbs: 0, fat: 13, per: '150g', src: '库', cat: '蛋白' },
    '猪肉':       { kcal: 300, protein: 25, carbs: 0, fat: 22, per: '150g', src: '库', cat: '蛋白' },
    '红烧肉':     { kcal: 480, protein: 20, carbs: 5, fat: 40, per: '150g', src: '估', cat: '热菜' },
    '鸡蛋':       { kcal: 140, protein: 12, carbs: 1, fat: 9, per: '2个', src: '库', cat: '蛋白' },
    '蒸蛋':       { kcal: 120, protein: 10, carbs: 2, fat: 8, per: '1份', src: '估', cat: '蛋白' },
    '豆腐':       { kcal: 150, protein: 14, carbs: 4, fat: 8, per: '200g', src: '库', cat: '蛋白' },
    '鸡蛋羹':     { kcal: 120, protein: 10, carbs: 2, fat: 8, per: '1份', src: '估', cat: '蛋白' },

    // ---------- 热菜 / 家常菜 ----------
    '水煮肉片':   { kcal: 350, protein: 25, carbs: 3, fat: 26, per: '200g', src: '估', cat: '热菜' },
    '水煮鱼':     { kcal: 300, protein: 26, carbs: 4, fat: 20, per: '200g', src: '估', cat: '热菜' },
    '宫保鸡丁':   { kcal: 320, protein: 22, carbs: 12, fat: 20, per: '180g', src: '估', cat: '热菜' },
    '咕噜肉':     { kcal: 380, protein: 15, carbs: 20, fat: 28, per: '180g', src: '估', cat: '热菜' },
    '大盘鸡':     { kcal: 420, protein: 30, carbs: 8, fat: 30, per: '250g', src: '估', cat: '热菜' },
    '农家小炒肉': { kcal: 330, protein: 20, carbs: 5, fat: 26, per: '180g', src: '估', cat: '热菜' },
    '小炒肉':     { kcal: 330, protein: 20, carbs: 5, fat: 26, per: '180g', src: '估', cat: '热菜' },
    '韭菜煎蛋':   { kcal: 200, protein: 12, carbs: 3, fat: 15, per: '150g', src: '估', cat: '热菜' },
    '西红柿炒蛋': { kcal: 170, protein: 8, carbs: 6, fat: 12, per: '150g', src: '估', cat: '热菜' },
    '番茄炒蛋':   { kcal: 170, protein: 8, carbs: 6, fat: 12, per: '150g', src: '估', cat: '热菜' },
    '锅包肉':     { kcal: 400, protein: 18, carbs: 25, fat: 27, per: '180g', src: '估', cat: '热菜' },
    '糖醋里脊':   { kcal: 390, protein: 16, carbs: 28, fat: 25, per: '180g', src: '估', cat: '热菜' },
    '辣子鸡':     { kcal: 380, protein: 25, carbs: 6, fat: 29, per: '180g', src: '估', cat: '热菜' },
    '酸菜鱼':     { kcal: 280, protein: 28, carbs: 6, fat: 16, per: '250g', src: '估', cat: '热菜' },
    '猪肚鸡':     { kcal: 350, protein: 28, carbs: 4, fat: 24, per: '250g', src: '估', cat: '热菜' },
    '黄焖鸡':     { kcal: 380, protein: 26, carbs: 10, fat: 26, per: '250g', src: '估', cat: '热菜' },
    '煲仔饭':     { kcal: 600, protein: 22, carbs: 70, fat: 24, per: '400g', src: '估', cat: '主食' },
    '鸡公煲':     { kcal: 480, protein: 30, carbs: 10, fat: 34, per: '300g', src: '估', cat: '热菜' },

    // ---------- 蔬菜 / 素菜 ----------
    '青菜':       { kcal: 60, protein: 5, carbs: 8, fat: 1, per: '200g', src: '库', cat: '蔬菜' },
    '西兰花':     { kcal: 60, protein: 5, carbs: 8, fat: 1, per: '200g', src: '库', cat: '蔬菜' },
    '素菜':       { kcal: 60, protein: 5, carbs: 8, fat: 1, per: '200g', src: '估', cat: '蔬菜' },
    '凉拌菜':     { kcal: 80, protein: 3, carbs: 10, fat: 3, per: '200g', src: '估', cat: '蔬菜' },
    '沙拉':       { kcal: 90, protein: 4, carbs: 10, fat: 4, per: '200g', src: '估', cat: '蔬菜' },

    // ---------- 面食 / 粉 ----------
    '牛肉面':     { kcal: 450, protein: 20, carbs: 55, fat: 15, per: '400g', src: '估', cat: '面食' },
    '拉面':       { kcal: 420, protein: 15, carbs: 60, fat: 12, per: '400g', src: '估', cat: '面食' },
    '螺蛳粉':     { kcal: 500, protein: 10, carbs: 70, fat: 20, per: '400g', src: '估', cat: '面食' },
    '麻辣烫':     { kcal: 450, protein: 20, carbs: 35, fat: 25, per: '400g', src: '估', cat: '面食' },
    '汤粉':       { kcal: 350, protein: 12, carbs: 50, fat: 10, per: '350g', src: '估', cat: '面食' },
    '汤面':       { kcal: 380, protein: 12, carbs: 55, fat: 11, per: '350g', src: '估', cat: '面食' },
    '炒面':       { kcal: 420, protein: 12, carbs: 55, fat: 17, per: '300g', src: '估', cat: '面食' },
    '拌面':       { kcal: 420, protein: 12, carbs: 55, fat: 17, per: '300g', src: '估', cat: '面食' },

    // ---------- 糖水 / 饮品 / 汤 ----------
    '双皮奶':     { kcal: 180, protein: 5, carbs: 20, fat: 8, per: '150g', src: '估', cat: '糖水' },
    '绿豆糖水':   { kcal: 180, protein: 5, carbs: 40, fat: 1, per: '300g', src: '估', cat: '糖水' },
    '糖水':       { kcal: 180, protein: 4, carbs: 38, fat: 2, per: '300g', src: '估', cat: '糖水' },
    '奶茶':       { kcal: 350, protein: 5, carbs: 50, fat: 14, per: '500ml', src: '估', cat: '饮品' },
    '果汁':       { kcal: 150, protein: 1, carbs: 38, fat: 0, per: '300ml', src: '估', cat: '饮品' },
    '老火汤':     { kcal: 120, protein: 8, carbs: 4, fat: 8, per: '300ml', src: '估', cat: '汤' },
    '炖汤':       { kcal: 120, protein: 8, carbs: 4, fat: 8, per: '300ml', src: '估', cat: '汤' },
    '例汤':       { kcal: 60, protein: 3, carbs: 4, fat: 3, per: '250ml', src: '估', cat: '汤' },

    // ---------- 套餐（组合，可拆） ----------
    '鸡扒饭':     { kcal: 520, protein: 30, carbs: 55, fat: 18, per: '1份', src: '估', cat: '套餐' },
    '猪脚饭':     { kcal: 550, protein: 25, carbs: 55, fat: 28, per: '1份', src: '估', cat: '套餐' },
    '滑蛋饭':     { kcal: 480, protein: 20, carbs: 55, fat: 18, per: '1份', src: '估', cat: '套餐' },
    '烧腊套餐':   { kcal: 520, protein: 28, carbs: 55, fat: 20, per: '1份', src: '估', cat: '套餐' },
    '焗饭':       { kcal: 550, protein: 22, carbs: 55, fat: 25, per: '1份', src: '估', cat: '套餐' },
    '石锅拌饭':   { kcal: 520, protein: 20, carbs: 60, fat: 20, per: '1份', src: '估', cat: '套餐' },
    '意粉':       { kcal: 480, protein: 16, carbs: 60, fat: 18, per: '1份', src: '估', cat: '套餐' },
  };

  // 分类兜底（未匹配到具体菜名时使用）
  const DEFAULT = {
    '主食': { kcal: 300, protein: 8, carbs: 50, fat: 8, per: '1份', src: '估' },
    '蛋白': { kcal: 220, protein: 28, carbs: 2, fat: 11, per: '1份', src: '估' },
    '蔬菜': { kcal: 70, protein: 5, carbs: 9, fat: 1, per: '1份', src: '估' },
    '热菜': { kcal: 320, protein: 20, carbs: 6, fat: 24, per: '1份', src: '估' },
    '烧腊': { kcal: 320, protein: 27, carbs: 3, fat: 22, per: '1份', src: '估' },
    '面食': { kcal: 400, protein: 14, carbs: 55, fat: 13, per: '1份', src: '估' },
    '糖水': { kcal: 180, protein: 4, carbs: 38, fat: 2, per: '1份', src: '估' },
    '饮品': { kcal: 200, protein: 2, carbs: 35, fat: 5, per: '1份', src: '估' },
    '汤':   { kcal: 100, protein: 6, carbs: 4, fat: 6, per: '1份', src: '估' },
    '套餐': { kcal: 500, protein: 24, carbs: 55, fat: 20, per: '1份', src: '估' },
    '其他': { kcal: 300, protein: 15, carbs: 20, fat: 18, per: '1份', src: '估' },
  };

  // 关键词 → 分类，用于把菜名映射到兜底分类
  const CAT_KEYWORDS = [
    ['主食', ['饭', '米饭', '粥', '馒头', '包子', '饼', '玉米', '红薯', '紫薯', '炒饭', '肠粉', '饺', '云吞', '粿条', '面', '粉']],
    ['蛋白', ['鸡', '鱼', '虾', '牛肉', '猪肉', '排骨', '蛋', '豆腐', '肉']],
    ['蔬菜', ['菜', '青菜', '西兰花', '蔬', '素', '沙拉', '瓜']],
    ['烧腊', ['烧', '腊', '卤', '叉烧', '烤鸭']],
    ['糖水', ['糖水', '双皮奶', '甜品', '甜']],
    ['饮品', ['奶茶', '果汁', '饮', '汽水', '咖啡']],
    ['汤', ['汤']],
    ['面食', ['面', '粉', '馄饨', '水饺']],
  ];

  function normalize(s) {
    return String(s || '').replace(/\s+/g, '').replace(/[（(].*?[)）]/g, '');
  }

  // 通过关键词推断分类
  function inferCat(name) {
    const n = normalize(name);
    for (const [cat, kws] of CAT_KEYWORDS) {
      for (const k of kws) {
        if (n.includes(k)) return cat;
      }
    }
    return '其他';
  }

  function lookup(name) {
    const n = normalize(name);
    // 1. 精确
    if (DB[n]) return { ...DB[n], name, matched: 'exact' };
    // 2. 包含（菜名含库key 或 库key含菜名）
    let best = null, bestLen = 0;
    for (const key of Object.keys(DB)) {
      if (n.includes(key) || key.includes(n)) {
        if (key.length > bestLen) { best = DB[key]; bestLen = key.length; }
      }
    }
    if (best) return { ...best, name, matched: 'fuzzy' };
    // 3. 关键词分类兜底
    const cat = inferCat(name);
    return { ...(DEFAULT[cat] || DEFAULT['其他']), name, cat, matched: 'category' };
  }

  window.NUTRITION = {
    DB,
    DEFAULT,
    lookup,
    inferCat,
    // 目标宏量营养建议(g/kg体重)
    targetMacros(goal, weightKg) {
      // 返回 {protein, carbs, fat, kcal} 每日目标
      const w = weightKg || 60;
      let kcal, protein, carbs, fat;
      if (goal === '增肌') {
        kcal = w * 33 + 300;   protein = w * 1.8; carbs = w * 4.5; fat = w * 0.9;
      } else if (goal === '减脂') {
        kcal = w * 30 - 300;   protein = w * 2.0; carbs = w * 2.8; fat = w * 0.7;
      } else { // 维持
        kcal = w * 30;         protein = w * 1.4; carbs = w * 4.0; fat = w * 1.0;
      }
      return { kcal: Math.round(kcal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
    }
  };
})();
