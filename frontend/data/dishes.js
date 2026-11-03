/* ============================================================
 * dishes.js —— 通用菜品库（"网上数据"默认池）
 * 说明：这是默认数据源，模拟常见高校食堂/快餐菜品，价格与菜品
 *       为常见区间参考；营养数据来自 nutrition.js（.lookup）。
 *       用户也可切换「中山大学食堂」使用真实五校区菜单数据。
 * 字段：
 *   name   菜名（同时作为 nutrition.js 查询键）
 *   price  参考价(元)
 *   cat    分类：主食/蛋白/蔬菜/热菜/汤/饮品
 *   tags   用于「不吃的东西」过滤：辣/花生/海鲜/蛋/奶/豆制品/麸质/猪肉/牛肉/羊肉/鸡肉/鱼
 *   meals  适用餐次
 * ============================================================ */
(function () {
  'use strict';

  const LUNCH = ['午餐', '晚餐'];
  const ALL = ['午餐', '晚餐', '加餐'];

  window.GENERIC_DISHES = [
    // ---------- 主食 ----------
    { name: '白米饭', price: 2, cat: '主食', tags: [], meals: ALL },
    { name: '杂粮饭', price: 3, cat: '主食', tags: ['麸质'], meals: LUNCH },
    { name: '蒸紫薯', price: 2, cat: '主食', tags: [], meals: ALL },
    { name: '水煮玉米', price: 4, cat: '主食', tags: [], meals: ALL },
    { name: '红薯', price: 2, cat: '主食', tags: [], meals: ALL },
    { name: '馒头', price: 1, cat: '主食', tags: ['麸质'], meals: ALL },
    { name: '炒饭', price: 8, cat: '主食', tags: ['蛋'], meals: LUNCH },
    { name: '粥', price: 3, cat: '主食', tags: [], meals: ALL },
    { name: '肠粉', price: 6, cat: '主食', tags: ['蛋'], meals: ALL },
    { name: '饺子', price: 8, cat: '主食', tags: ['麸质', '猪肉'], meals: LUNCH },

    // ---------- 蛋白 / 肉 ----------
    { name: '番茄炒蛋', price: 5, cat: '热菜', tags: ['蛋'], meals: LUNCH },
    { name: '宫保鸡丁', price: 7, cat: '热菜', tags: ['辣', '鸡肉', '花生'], meals: LUNCH },
    { name: '青椒肉丝', price: 7, cat: '热菜', tags: ['猪肉'], meals: LUNCH },
    { name: '红烧肉', price: 9, cat: '热菜', tags: ['猪肉'], meals: LUNCH },
    { name: '糖醋里脊', price: 8, cat: '热菜', tags: ['猪肉', '麸质'], meals: LUNCH },
    { name: '麻辣豆腐', price: 5, cat: '热菜', tags: ['辣', '豆制品'], meals: LUNCH },
    { name: '清蒸鱼块', price: 9, cat: '热菜', tags: ['鱼', '海鲜'], meals: LUNCH },
    { name: '卤牛肉', price: 10, cat: '热菜', tags: ['牛肉'], meals: LUNCH },
    { name: '卤鸡腿', price: 6, cat: '热菜', tags: ['鸡肉'], meals: LUNCH },
    { name: '鸡胸肉', price: 8, cat: '蛋白', tags: ['鸡肉'], meals: LUNCH },
    { name: '白切鸡', price: 8, cat: '热菜', tags: ['鸡肉'], meals: LUNCH },
    { name: '水煮肉片', price: 9, cat: '热菜', tags: ['辣', '猪肉'], meals: LUNCH },
    { name: '酸菜鱼', price: 12, cat: '热菜', tags: ['辣', '鱼', '海鲜'], meals: LUNCH },
    { name: '鸡蛋', price: 2, cat: '蛋白', tags: ['蛋'], meals: ALL },
    { name: '蒸蛋', price: 4, cat: '蛋白', tags: ['蛋'], meals: LUNCH },
    { name: '豆腐', price: 4, cat: '蛋白', tags: ['豆制品'], meals: LUNCH },

    // ---------- 蔬菜 ----------
    { name: '青菜', price: 3, cat: '蔬菜', tags: [], meals: LUNCH },
    { name: '西兰花', price: 4, cat: '蔬菜', tags: [], meals: LUNCH },
    { name: '凉拌菜', price: 3, cat: '蔬菜', tags: ['辣'], meals: LUNCH },
    { name: '沙拉', price: 6, cat: '蔬菜', tags: ['奶'], meals: LUNCH },

    // ---------- 面食 ----------
    { name: '牛肉面', price: 12, cat: '热菜', tags: ['牛肉', '麸质'], meals: LUNCH },
    { name: '拉面', price: 10, cat: '热菜', tags: ['麸质', '牛肉'], meals: LUNCH },
    { name: '螺蛳粉', price: 12, cat: '热菜', tags: ['辣', '花生'], meals: LUNCH },
    { name: '麻辣烫', price: 12, cat: '热菜', tags: ['辣', '豆制品'], meals: LUNCH },
    { name: '汤面', price: 8, cat: '热菜', tags: ['麸质'], meals: LUNCH },
    { name: '云吞', price: 8, cat: '热菜', tags: ['猪肉', '麸质'], meals: ALL },

    // ---------- 汤 / 饮品 ----------
    { name: '番茄蛋汤', price: 4, cat: '汤', tags: ['蛋'], meals: LUNCH },
    { name: '紫菜蛋花汤', price: 4, cat: '汤', tags: ['蛋'], meals: LUNCH },
    { name: '老火汤', price: 6, cat: '汤', tags: [], meals: LUNCH },
    { name: '豆浆', price: 3, cat: '饮品', tags: ['豆制品'], meals: ALL },
    { name: '牛奶', price: 4, cat: '饮品', tags: ['奶'], meals: ALL },
    { name: '酸奶', price: 5, cat: '饮品', tags: ['奶'], meals: ALL },
    { name: '绿豆糖水', price: 5, cat: '饮品', tags: [], meals: ['加餐'] },
    { name: '双皮奶', price: 6, cat: '饮品', tags: ['奶', '蛋'], meals: ['加餐'] },
    { name: '包子', price: 3, cat: '主食', tags: ['麸质', '猪肉'], meals: ALL },
  ];

  // 供 UI 展示的餐次
  window.MEAL_TYPES = ['午餐', '晚餐', '加餐'];

  // "不吃的东西"选项（对应 tags）
  window.DEALBREAKERS = [
    { id: '辣', label: '辣' },
    { id: '花生', label: '花生' },
    { id: '海鲜', label: '海鲜' },
    { id: '蛋', label: '蛋' },
    { id: '奶', label: '奶' },
    { id: '豆制品', label: '豆制品' },
    { id: '麸质', label: '麸质' },
    { id: '猪肉', label: '猪肉' },
    { id: '牛肉', label: '牛肉' },
    { id: '羊肉', label: '羊肉' },
    { id: '鸡肉', label: '鸡肉' },
  ];
})();
