/* ============================================================
 * credits.js —— 积分雷达数据（预置，前端本地库）
 * 说明：分值/条件仅作示例，以官方通知为准。
 * ============================================================ */
var CREDIT_ACTIVITIES = [
  {
    id: 1, slug: 'freshman-orienteering', title: '新生定向越野赛', category: '参赛即得',
    credit_value: '3 分', credit_condition: '参赛即得', period_label: '9 月',
    period_start: '2026-09-10', period_end: '2026-11-16', location: '英东体育场',
    campus: '广州南校园', registration_url: 'https://example.com/sports/orienteering',
    status: '报名中', source: 'official', is_recurring: false, sort_hint: 10,
    description: '面向大一新生的校园定向越野，全程约 3km，途经怀士堂、逸仙大道等标志点。示例信息：具体集合时间以官方通知为准。',
    suitable: ['想认识校园的新生', '喜欢轻量跑步的同学'], not_suitable: ['近期有膝踝伤病的同学', '当天有课程冲突无法到场']
  },
  {
    id: 2, slug: 'fitness-class', title: '体能提高班', category: '课程训练',
    credit_value: '8 分', credit_condition: '6 次全勤', period_label: '每学期第 2–3 月',
    period_start: '2026-10-01', period_end: '2026-12-13', location: '体育馆',
    campus: '广州南校园', registration_url: 'https://example.com/sports/fitness-class',
    status: '报名中', source: 'official', is_recurring: true, sort_hint: 8,
    description: '每周一次、共 6 次的体能训练课，含热身、力量与拉伸，适合想建立运动习惯的同学。待确认：本学期具体排课时间。',
    suitable: ['想系统建立训练习惯的同学', '准备体测的同学'], not_suitable: ['已能完成高强度训练的同学', '无法保证 6 次出勤的同学']
  },
  {
    id: 3, slug: 'long-run-month', title: '长跑月', category: '打卡累积',
    credit_value: '每次 1 分', credit_condition: '3km 或 30min 以上', period_label: '每学期第 2–3 月',
    period_start: '2026-10-01', period_end: '2026-11-30', location: '全校',
    campus: '广州南校园', registration_url: 'https://example.com/sports/long-run',
    status: '报名中', source: 'official', is_recurring: true, sort_hint: 9,
    description: '每天 3km 或 30 分钟以上跑步即可打卡，累计达标次数兑换积分。示例：单日上限与认定方式以官方通知为准。',
    suitable: ['已有跑步习惯的同学', '想用碎片时间累计积分的同学'], not_suitable: ['近期有下肢伤病的同学']
  },
  {
    id: 4, slug: 'rope-skipping', title: '天天跳绳打卡', category: '打卡累积',
    credit_value: '每 4 天 3000 个得 1 分', credit_condition: '每 4 天完成 3000 个', period_label: '每学期',
    period_start: '2026-09-01', period_end: '2026-12-31', location: '线上',
    campus: '广州南校园', registration_url: 'https://example.com/sports/rope',
    status: '报名中', source: 'official', is_recurring: true, sort_hint: 6,
    description: '线上跳绳打卡，按 4 天为一个周期累计 3000 个。提示：需开启蓝牙且不要锁屏，否则容易断连。',
    suitable: ['想在宿舍完成运动的同学', '时间碎片化的同学'], not_suitable: ['膝盖不适的同学', '没有跳绳器材的同学']
  },
  {
    id: 5, slug: 'road-race', title: '路跑联赛', category: '参赛即得',
    credit_value: '每次 1 分', credit_condition: '参赛即得', period_label: '每学期多次',
    period_start: '2026-10-01', period_end: '2026-11-06', location: '校外/校内',
    campus: '广州南校园', registration_url: 'https://example.com/sports/road-race',
    status: '即将截止', source: 'official', is_recurring: true, sort_hint: 10,
    description: '校内外多站路跑联赛，单站报名参赛即可获得相应积分。示例信息：各站距离与集合点以官方通知为准。',
    suitable: ['有跑步基础的同学', '想体验比赛氛围的同学'], not_suitable: ['赛前一周有伤病的同学']
  },
  {
    id: 6, slug: 'fitness-test-volunteer', title: '体测志愿者', category: '服务组织',
    credit_value: '2 分', credit_condition: '按次', period_label: '体测周',
    period_start: '2026-11-10', period_end: '2026-11-16', location: '体育馆',
    campus: '广州南校园', registration_url: 'https://example.com/sports/volunteer',
    status: '报名中', source: 'official', is_recurring: false, sort_hint: 7,
    description: '协助体测现场组织、引导与记录，按服务次数认定。适合不擅长比赛但想参与体育活动的同学。',
    suitable: ['想参与体育活动但不擅长比赛的同学', '时间灵活的志愿者'], not_suitable: ['体测周有考试冲突的同学']
  },
  {
    id: 7, slug: 'department-games', title: '院系运动会', category: '院系日常',
    credit_value: '3 分', credit_condition: '参赛即得', period_label: '10 月',
    period_start: '2026-10-01', period_end: '2026-10-18', location: '各校区',
    campus: '广州南校园', registration_url: 'https://example.com/sports/department',
    status: '已结束', source: 'official', is_recurring: true, sort_hint: 0,
    description: '各院系自行组织的秋季运动会，项目含短跑、接力、趣味项目等。示例：各院系项目设置不同。',
    suitable: ['想为院系出力的同学', '喜欢团队项目的同学'], not_suitable: ['已错过报名时间的同学']
  },
  {
    id: 8, slug: 'yixian-cup', title: '逸仙杯系列赛事', category: '参赛即得',
    credit_value: '5 分', credit_condition: '参赛未获奖也有鼓励积分', period_label: '每学期',
    period_start: '2026-10-01', period_end: '2026-12-20', location: '各校区',
    campus: '广州南校园', registration_url: 'https://example.com/sports/yixian',
    status: '报名中', source: 'official', is_recurring: true, sort_hint: 9,
    description: '校级综合赛事系列，覆盖篮球、羽毛球、排球等项目，参赛即有鼓励积分。待确认：各项目报名截止时间。',
    suitable: ['有球类基础的同学', '想和同学组队的同学'], not_suitable: ['近期有伤病的同学']
  },
  {
    id: 9, slug: 'taekwondo-club', title: '跆拳道社·招新体验课', category: '社团活动',
    credit_value: '不计分（社团活动）', credit_condition: '到场体验即可', period_label: '每周五晚',
    period_start: '2026-09-01', period_end: '2026-12-25', location: '体育馆武术房',
    campus: '广州南校园', registration_url: 'https://example.com/sports/taekwondo',
    status: '报名中', source: 'community', is_recurring: true, sort_hint: 5,
    description: '零基础可参加的体验课，教练带练基础步法与踢腿。来源：学生社团，非官方积分活动。',
    suitable: ['想尝试格斗类运动的同学', '零基础想入门的新生'], not_suitable: ['有膝踝旧伤的同学']
  },
  {
    id: 10, slug: 'skate-club', title: '轮滑协会·周末刷街训练', category: '社团活动',
    credit_value: '不计分（社团活动）', credit_condition: '自备轮滑鞋', period_label: '每周六下午',
    period_start: '2026-09-01', period_end: '2026-12-26', location: '逸仙大道及校道',
    campus: '广州南校园', registration_url: 'https://example.com/sports/skate',
    status: '报名中', source: 'community', is_recurring: true, sort_hint: 4,
    description: '周六下午沿逸仙大道刷街，新手可跟着慢速组。来源：学生社团，非官方积分活动。',
    suitable: ['有轮滑基础的同学', '想认识同好的同学'], not_suitable: ['完全零基础且无护具的同学']
  },
  {
    id: 11, slug: 'dragon-boat', title: '龙舟队·晨训招募', category: '社团活动',
    credit_value: '不计分（社团活动）', credit_condition: '通过体能测试', period_label: '每学期',
    period_start: '2026-09-01', period_end: '2026-12-31', location: '北门珠江边训练点',
    campus: '广州南校园', registration_url: 'https://example.com/sports/dragon-boat',
    status: '报名中', source: 'community', is_recurring: true, sort_hint: 3,
    description: '清晨在珠江边进行龙舟训练，需通过基础体能与游泳测试。来源：学生社团，非官方积分活动。',
    suitable: ['体能较好、会游泳的同学', '想体验团队项目的同学'], not_suitable: ['不会游泳的同学']
  },
  {
    id: 12, slug: 'badminton-monthly', title: '羽毛球民间月赛', category: '民间赛事',
    credit_value: '不计分（民间赛事）', credit_condition: '现场报名', period_label: '每月最后一个周日',
    period_start: '2026-09-01', period_end: '2026-11-29', location: '体育馆',
    campus: '广州南校园', registration_url: 'https://example.com/sports/badminton',
    status: '报名中', source: 'community', is_recurring: true, sort_hint: 6,
    description: '同学自发组织的羽毛球月赛，分新手组与进阶组，现场抽签配对。来源：民间组织，不计入学校体育积分。',
    suitable: ['想打比赛但不想太正式的同学', '想练双打配合的同学'], not_suitable: ['没有球拍的同学']
  },
  {
    id: 13, slug: 'night-run-club', title: '夜跑团·环校夜跑', category: '民间活动',
    credit_value: '不计分（民间活动）', credit_condition: '直接来跑', period_label: '每晚 21:00',
    period_start: '2026-09-01', period_end: '2026-12-31', location: '英东体育场',
    campus: '广州南校园', registration_url: 'https://example.com/sports/night-run',
    status: '报名中', source: 'community', is_recurring: true, sort_hint: 7,
    description: '每晚九点英东集合，配速分 6' + "'" + '00 与 7' + "'" + '00 两档，跑完自愿拉伸。来源：民间组织，不计入学校体育积分。',
    suitable: ['想找人一起跑的同学', '晚上才有空的同学'], not_suitable: ['住得较远、回程不便的同学']
  }
];
