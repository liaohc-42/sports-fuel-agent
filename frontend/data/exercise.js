/* ============================================================
 * exercise.js —— 运动项目库（30+ 主流项目，含子分支）
 * 热量公式：kcal = MET × 3.5 × 体重(kg) / 200 × 分钟
 * ============================================================ */
(function () {
  'use strict';

  // 分类 → 项目。每个项目有 MET 与说明；group 用于「子分支」展示
  const LIB = {
    '有氧': [
      { id: 'run', name: '跑步', met: 9, note: '配速约 6 分/公里' },
      { id: 'walk', name: '快走', met: 4.5, note: '约 6 公里/小时' },
      { id: 'hike', name: '徒步', met: 5, note: '平地快步' },
      { id: 'climb', name: '登山', met: 7, note: '爬坡/负重' },
      { id: 'bike', name: '骑行', met: 6, note: '16-19 公里/小时' },
      { id: 'rope', name: '跳绳', met: 10, note: '中速约 120 次/分' },
      { id: 'row', name: '划船机', met: 7, note: '中等阻力' },
      { id: 'elliptical', name: '椭圆机', met: 5, note: '中等阻力' },
      { id: 'spin', name: '动感单车', met: 6, note: '中等阻力' },
      { id: 'stairs', name: '爬楼', met: 8, note: '连续上楼' },
      { id: 'hiit', name: 'HIIT', met: 10, note: '高强度间歇' },
      { id: 'dance', name: '舞蹈', met: 5, note: '街舞/健身舞' },
      { id: 'boxing', name: '搏击操', met: 8, note: '有氧搏击' },
    ],
    '游泳': [
      { id: 'swim-br', name: '蛙泳', met: 6, note: '休闲蛙泳' },
      { id: 'swim-fr', name: '自由泳', met: 8, note: '中等强度' },
      { id: 'swim-bk', name: '仰泳', met: 7, note: '中等强度' },
      { id: 'swim-fly', name: '蝶泳', met: 11, note: '高消耗' },
    ],
    '力量': [
      { id: 'str-up', name: '上肢', met: 3.5, note: '俯卧撑/引体/推举' },
      { id: 'str-low', name: '下肢', met: 5, note: '深蹲/弓步/臀桥' },
      { id: 'str-core', name: '核心', met: 3.8, note: '平板/卷腹/死虫' },
      { id: 'str-full', name: '全身', met: 6, note: '杠铃/哑铃综合' },
    ],
    '球类': [
      { id: 'basket', name: '篮球', met: 6.5, note: '半场对抗' },
      { id: 'foot', name: '足球', met: 7, note: '对抗' },
      { id: 'badm', name: '羽毛球', met: 5.5, note: '休闲对抗' },
      { id: 'table', name: '乒乓球', met: 4, note: '中等对抗' },
      { id: 'volley', name: '排球', met: 4, note: '休闲' },
      { id: 'tennis', name: '网球', met: 7, note: '中等对抗' },
    ],
    '其他': [
      { id: 'yoga', name: '瑜伽', met: 3, note: '流瑜伽/拉伸' },
      { id: 'pilates', name: '普拉提', met: 3, note: '核心控制' },
      { id: 'taichi', name: '太极', met: 3, note: '慢速练习' },
    ],
  };

  // 展平，方便按 id 查询
  const FLAT = [];
  Object.keys(LIB).forEach(function (cat) {
    LIB[cat].forEach(function (o) { FLAT.push(Object.assign({ category: cat }, o)); });
  });

  function find(id) { return FLAT.find(function (x) { return x.id === id; }) || null; }

  function calcKcal(met, weightKg, minutes) {
    return Math.round(met * 3.5 * (weightKg || 60) / 200 * (minutes || 0));
  }

  // BMR（Mifflin-St Jeor）
  function calcBMR(gender, w, h, age) {
    var base = 10 * (w || 60) + 6.25 * (h || 170) - 5 * (age || 20);
    return Math.round(gender === 'female' ? base - 161 : base + 5);
  }

  window.EXERCISE = {
    LIB: LIB,
    FLAT: FLAT,
    find: find,
    calcKcal: calcKcal,
    calcBMR: calcBMR,
  };
})();
