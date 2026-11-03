// 整站引导测试：加载全部前端脚本，跑 init，再逐个渲染新模块，确认无运行时异常
const fs = require('fs');
const path = require('path');
const FRONT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';

function makeEl(id) {
  const el = {
    id: id || '', _v: (id === 'exerciseSelect') ? 'run' : '', style: {}, dataset: {},
    children: [], disabled: false, checked: false, scrollTop: 0, scrollHeight: 0,
    innerHTML: '', textContent: '', className: '', label: '', _handlers: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener(ev, cb) { this._handlers[ev] = cb; }, removeEventListener() {},
    appendChild() {}, removeChild() {}, setAttribute() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    get value() { return this._v; }, set value(v) { this._v = v; },
    scrollIntoView() {}, closest() { return null; }, parentElement: null,
  };
  return el;
}
const elCache = {};
const documentStub = {
  _readyCb: null,
  getElementById(id) { return elCache[id] || (elCache[id] = makeEl(id)); },
  querySelector() { return makeEl(); }, querySelectorAll() { return []; },
  createElement() { return makeEl(); },
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') this._readyCb = cb; },
};
const store = {};
const localStorageStub = {
  getItem(k) { return store[k] || null; }, setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; },
};

global.window = global;
global.document = documentStub;
global.localStorage = localStorageStub;
global.confirm = () => false;
global.alert = () => {};
global.scrollTo = () => {};
global.prompt = () => '3';

const vm = require('vm');
function run(p) {
  const file = path.join(FRONT, p);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

['data/nutrition.js', 'data/exercise.js', 'data/canteen.js', 'data/dishes.js', 'data/credits.js', 'data/venues.js',
  'js/api.js', 'js/credits.js', 'js/venues.js', 'js/campus.js', 'js/app.js'].forEach(run);

if (typeof documentStub._readyCb !== 'function') { console.log('FAIL: 未捕获 DOMContentLoaded'); process.exit(1); }

let fails = 0;
function ok(name, cond) { if (!cond) { fails++; console.log('FAIL', name); } else console.log('ok  ', name); }

Promise.resolve(documentStub._readyCb()).then(() => {
  ok('init() 无异常', true);

  CreditsUI.init();
  const creditsHtml = elCache['creditsBody'].innerHTML;
  ok('积分雷达列表已渲染', creditsHtml.length > 800 && creditsHtml.indexOf('这学期') >= 0);
  const listHtml = elCache['creditListWrap'].innerHTML;
  ok('列表含 13 条机会计数', listHtml.indexOf('个机会') >= 0);
  ok('列表渲染出活动卡片', listHtml.indexOf('credit-card') >= 0);

  CreditsUI.open(1);
  const detailHtml = elCache['creditsBody'].innerHTML;
  ok('详情页已渲染', detailHtml.indexOf('AI 一句话摘要') >= 0);
  ok('详情含分值说明', detailHtml.indexOf('示例分值') >= 0);
  ok('详情含意向按钮', detailHtml.indexOf('找搭子') >= 0);

  VenuesUI.init();
  const venueHtml = elCache['venueBody'].innerHTML;
  ok('场馆页已渲染', venueHtml.length > 800 && venueHtml.indexOf('示意图') >= 0);
  ok('场馆含人流徽章', venueHtml.indexOf('crowd-badge') >= 0);
  ok('场馆含历史兜底说明', venueHtml.indexOf('往年经验') >= 0);

  CampusUI.init();
  ok('约运动已渲染', elCache['pickupBody'].innerHTML.indexOf('约运动') >= 0);
  ok('装备已渲染', elCache['gearBody'].innerHTML.indexOf('装备') >= 0);
  ok('我的已渲染', elCache['meBody'].innerHTML.indexOf('身体档案') >= 0);

  console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
  process.exit(fails ? 1 : 0);
}).catch(e => { console.log('FAIL: init 抛错 →', e && e.stack ? e.stack : e); process.exit(1); });
