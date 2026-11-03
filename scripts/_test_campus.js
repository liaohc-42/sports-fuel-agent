// 新模块（积分雷达 / 场馆）数据与判定逻辑测试（不依赖浏览器）
global.window = global;
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';

function load(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }
eval(load('data/credits.js'));
eval(load('data/venues.js'));
eval(load('js/venues.js'));

let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log('FAIL', name, 'got=', JSON.stringify(got), 'want=', JSON.stringify(want)); }
  else console.log('ok  ', name);
}
function ok(name, cond) {
  if (!cond) { fails++; console.log('FAIL', name); } else console.log('ok  ', name);
}

// ---- 积分雷达数据 ----
eq('活动总数', CREDIT_ACTIVITIES.length, 13);
eq('社团/民间条数', CREDIT_ACTIVITIES.filter(a => a.source === 'community').length, 5);
ok('每条都有分值/条件/截止日', CREDIT_ACTIVITIES.every(a => a.credit_value && a.credit_condition && a.period_end));
ok('id 唯一', new Set(CREDIT_ACTIVITIES.map(a => a.id)).size === 13);
ok('分值原样保留（未简化）', CREDIT_ACTIVITIES.some(a => a.credit_value.indexOf('每 4 天') >= 0));

// ---- 场馆数据 ----
ok('五校区齐全', CAMPUS_LIST.length === 5 && CAMPUS_LIST.every(c => CAMPUS_VENUES.some(v => v.campus === c)));
ok('坐标在 0–100', CAMPUS_VENUES.every(v => v.x >= 0 && v.x <= 100 && v.y >= 0 && v.y <= 100));
ok('每个场馆有备注', CAMPUS_VENUES.every(v => v.note));

// ---- 拥挤度判定（他的两级兜底） ----
const track = CAMPUS_VENUES.find(v => v.name === '英东田径场');
const zhPool = CAMPUS_VENUES.find(v => v.name === '恒温游泳馆');
const eastBasket = CAMPUS_VENUES.find(v => v.name === '室外篮球场');

function at(y, m, d, hh, mm) { return new Date(y, m - 1, d, hh, mm); }

const c1 = VenuesUI.crowdOf(track, at(2026, 11, 3, 20, 45));
eq('英东 20:45 判定', c1.level, 'busy');
ok('英东 20:45 来自历史规律', c1.source === 'history');

const c2 = VenuesUI.crowdOf(track, at(2026, 11, 3, 7, 0));
eq('英东 07:00 判定', c2.level, 'free');

// 找周一（珠海游泳馆闭馆）
let monday = at(2026, 11, 2, 10, 0);
while (monday.getDay() !== 1) monday = new Date(monday.getTime() + 86400000);
const c3 = VenuesUI.crowdOf(zhPool, monday);
eq('珠海游泳馆 周一判定', c3.level, 'closed');

// 找工作日 09:00（东校园室外篮球场教学占用）
let weekday = at(2026, 11, 2, 9, 0);
while (weekday.getDay() === 0 || weekday.getDay() === 6) weekday = new Date(weekday.getTime() + 86400000);
const c4 = VenuesUI.crowdOf(eastBasket, weekday);
eq('东校园篮球场 工作日 09:00', c4.level, 'unavailable');

console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
process.exit(fails ? 1 : 0);
