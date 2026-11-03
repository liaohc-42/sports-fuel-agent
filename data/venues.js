/* ============================================================
 * venues.js —— 场馆与拥挤度数据
 * 数据来源：《中山大学场馆拥挤度规律表》（三校区五校园）
 * 判定：① 近 2 小时实时上报聚合 → ② 历史规律（校区+场馆+星期+小时）→ ③ 默认中等
 * ============================================================ */
var CAMPUS_LIST = ['广州南校园', '广州东校园', '广州北校园', '珠海校区', '深圳校区'];

/* 每个场馆：peak / mid / free 为时间段数组（HH:MM-HH:MM），closedDays 为闭馆星期（0=周日） */
var CAMPUS_VENUES = [
  /* ---------------- 南校园 ---------------- */
  { id: 'syd-track', campus: '广州南校园', name: '英东田径场', type: '田径场', x: 46, y: 58,
    hours: '约 6:00–22:00', price: '免费', booking: '无需预约，先到先得',
    note: '400m 橡胶跑道，体测主场地；夜跑最热闹',
    peak: ['20:40-22:00'], mid: ['17:00-20:40'], free: ['06:00-09:00', '09:00-17:00'], closedDays: [] },
  { id: 'xq-track', campus: '广州南校园', name: '西区田径场', type: '田径场', x: 22, y: 74,
    hours: '6:30–21:30', price: '免费', booking: '无需预约',
    note: '路面不平，人比英东少，可分流',
    peak: ['17:30-20:00'], mid: ['09:00-12:00'], free: ['06:30-09:00', '12:00-17:30'], closedDays: [] },
  { id: 'syd-gym-badminton', campus: '广州南校园', name: '新体育馆（羽毛球）', type: '综合馆', x: 62, y: 44,
    hours: '按预约时段', price: '30 元/全场/小时', booking: '网上预约/现场刷卡',
    note: '学生主力馆，靠生活区；黄金时段基本满',
    peak: ['19:00-21:00'], mid: ['14:00-17:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'syd-gym', campus: '广州南校园', name: '新体育馆（健身房）', type: '健身房', x: 64, y: 40,
    hours: '按预约时段', price: '学生 3 元/人/场', booking: '网上预约',
    note: '学生价极便宜，易满',
    peak: ['19:00-21:00'], mid: ['16:00-18:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'syd-pool', campus: '广州南校园', name: '游泳池', type: '游泳馆', x: 68, y: 70,
    hours: '工作日 6:30–8:00、19:30–21:00', price: '学生 3–5 元', booking: '先线上预约→换泳票',
    note: '需游泳证；冬天可能不开放；晚场人最多',
    peak: ['19:30-21:00'], mid: ['16:00-17:30'], free: ['06:30-08:00'], closedDays: [] },
  { id: 'syd-basket', campus: '广州南校园', name: '篮球场（室外）', type: '球场', x: 54, y: 32,
    hours: '6:00–22:00', price: '免费（周末收费）', booking: '先到先得',
    note: '避开周一至周五 8:00–12:00 教学高峰',
    peak: ['16:00-21:00'], mid: ['14:00-16:00'], free: ['06:00-08:00', '08:00-12:00'], closedDays: [] },
  { id: 'syd-north-track', campus: '广州南校园', name: '北门田径场', type: '田径场', x: 30, y: 18,
    hours: '6:00–22:00', price: '免费', booking: '无需预约',
    note: '离北门近，人少，适合放松跑',
    peak: ['18:00-20:00'], mid: ['16:00-18:00'], free: ['06:00-09:00', '09:00-16:00'], closedDays: [] },

  /* ---------------- 东校园 ---------------- */
  { id: 'east-artificial', campus: '广州东校园', name: '假草体育场', type: '田径场', x: 44, y: 62,
    hours: '6:00–22:00', price: '免费', booking: '无需预约',
    note: '灯光足、离宿舍近、安全，最热门',
    peak: ['20:40-22:00'], mid: ['17:00-20:40'], free: ['06:00-09:00', '09:00-17:00'], closedDays: [] },
  { id: 'east-gym', campus: '广州东校园', name: '体育馆（羽毛球）', type: '综合馆', x: 60, y: 40,
    hours: '按预约时段', price: '运动经费抵扣', booking: '网上预约',
    note: '系统显示饱和度；羽协周四晚、周六下午有活动',
    peak: ['19:00-21:00'], mid: ['14:00-17:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'east-pool', campus: '广州东校园', name: '体育馆（游泳池）', type: '游泳馆', x: 34, y: 30,
    hours: '按场次', price: '运动经费抵扣', booking: '网上预约 + 游泳证',
    note: '办证后可用',
    peak: ['17:00-19:00'], mid: ['14:00-17:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'east-basket', campus: '广州东校园', name: '室外篮球场', type: '球场', x: 70, y: 58,
    hours: '6:00–22:00', price: '免费', booking: '先到先得',
    note: '避开周一至周五 8:00–12:00 教学',
    peak: ['16:00-21:00'], mid: ['14:00-16:00'], free: ['06:00-08:00'], closedDays: [], teachingBlock: ['08:00-12:00'] },

  /* ---------------- 北校园 ---------------- */
  { id: 'north-track', campus: '广州北校园', name: '北校园田径场', type: '田径场', x: 48, y: 52,
    hours: '日常可跑', price: '免费', booking: '无需预约',
    note: '场地较小，医学部学生集中',
    peak: ['17:00-19:00'], mid: ['09:00-12:00'], free: ['12:00-14:00'], closedDays: [] },
  { id: 'north-gym', campus: '广州北校园', name: '北校园体育馆', type: '综合馆', x: 64, y: 36,
    hours: '按预约时段', price: '20–30 元/场/小时', booking: '网上预约',
    note: '分学生场/教职工场',
    peak: ['19:00-21:00'], mid: ['14:00-17:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'north-pool', campus: '广州北校园', name: '游泳池', type: '游泳馆', x: 36, y: 66,
    hours: '按场次', price: '学生 3–5 元', booking: '线上预约 + 游泳证',
    note: '高峰人多；冬天可能不开放',
    peak: ['17:00-19:00'], mid: ['14:00-17:00'], free: ['09:00-11:00'], closedDays: [] },

  /* ---------------- 珠海校区 ---------------- */
  { id: 'zh-track', campus: '珠海校区', name: '珠海田径场', type: '田径场', x: 46, y: 60,
    hours: '6:00–22:30', price: '免费', booking: '无需预约',
    note: '仅半个操场有灯',
    peak: ['20:40-21:30'], mid: ['17:00-20:40'], free: ['06:00-09:00'], closedDays: [] },
  { id: 'zh-gym', campus: '珠海校区', name: '珠海体育馆', type: '综合馆', x: 62, y: 42,
    hours: '8:00–12:00、14:00–22:00', price: '运动经费抵扣', booking: '网上预约',
    note: '新体育馆，地上/地下分层',
    peak: ['19:00-21:30'], mid: ['14:00-17:00'], free: ['08:00-12:00'], closedDays: [] },
  { id: 'zh-pool', campus: '珠海校区', name: '恒温游泳馆', type: '游泳馆', x: 34, y: 34,
    hours: '周二至周日 7:00–9:00、15:00–21:30', price: '运动经费抵扣', booking: '网上预约 + 游泳证',
    note: '周一闭馆，别去',
    peak: ['15:00-21:30'], mid: ['07:00-09:00'], free: [], closedDays: [1] },

  /* ---------------- 深圳校区 ---------------- */
  { id: 'sz-main', campus: '深圳校区', name: '深圳体育馆主馆', type: '综合馆', x: 52, y: 46,
    hours: '8:00–12:00、14:00–22:00', price: '运动经费抵扣', booking: '网上预约',
    note: '15 片羽毛球 + 篮球，广东高校最大之一',
    peak: ['19:00-21:00'], mid: ['14:00-17:00'], free: ['08:00-11:00'], closedDays: [] },
  { id: 'sz-track', campus: '深圳校区', name: '深圳田径场', type: '田径场', x: 38, y: 64,
    hours: '6:30–22:30', price: '免费', booking: '无需预约',
    note: '灯光开放，晚间人多',
    peak: ['20:00-22:00'], mid: ['17:00-20:00'], free: ['06:30-09:00'], closedDays: [] },
  { id: 'sz-pool', campus: '深圳校区', name: 'C 馆游泳馆', type: '游泳馆', x: 68, y: 62,
    hours: '8:00–22:00', price: '运动经费抵扣', booking: '网上预约 + 游泳证',
    note: '室内恒温 50m + 室外池',
    peak: ['17:00-19:00'], mid: ['08:00-11:00'], free: ['13:00-17:00'], closedDays: [] }
];

/* 跨校区通用规律（历史兜底） */
var CROWD_RULES = [
  { test: function (h, m, weekday, v) { return weekday >= 1 && weekday <= 5 && h === 20 && m >= 40 && v.campus.indexOf('广州') === 0; }, level: 'busy', why: '20:40 前后下课高峰' },
  { test: function (h, m, weekday, v) { return h >= 19 && (h < 21 || (h === 21 && m <= 30)) && v.type !== '田径场' && v.type !== '球场'; }, level: 'busy', why: '19:00–21:30 黄金晚间（室内馆）' },
  { test: function (h) { return h >= 17 && h < 19; }, level: 'normal', why: '晚饭前后' },
  { test: function (h) { return h >= 6 && h < 9; }, level: 'free', why: '早起档' },
  { test: function (h, m, weekday) { return weekday >= 1 && weekday <= 5 && h >= 8 && h < 17; }, level: 'free', why: '工作日白天（非教学场地）' }
];
