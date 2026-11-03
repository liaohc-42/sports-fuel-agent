// 用最小 DOM 桩运行 app.js 的 init()，确认前端引导流程无运行时异常
// 说明：仅验证 init() 不抛错（抓 typos / 未定义函数 / 空引用），非完整交互测试。
const fs = require('fs');
const path = require('path');
const FRONT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';

// ---------- 最小 DOM 桩 ----------
function makeEl(id) {
  const el = {
    id: id || '',
    _v: (id === 'exerciseSelect') ? 'run' : '',
    style: {}, dataset: {}, children: [],
    disabled: false, checked: false, scrollTop: 0, scrollHeight: 0,
    innerHTML: '', textContent: '', className: '', label: '',
    _handlers: {},
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; },
    },
    addEventListener(ev, cb) { this._handlers[ev] = cb; }, removeEventListener() {},
    appendChild() {}, removeChild() {}, setAttribute() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    get value() { return this._v; },
    set value(v) { this._v = v; },
    scrollIntoView() {},
    parentElement: null,
  };
  return el;
}

const elCache = {};
const documentStub = {
  _readyCb: null,
  getElementById(id) { return elCache[id] || (elCache[id] = makeEl(id)); },
  querySelector() { return makeEl(); },
  querySelectorAll() { return []; },
  createElement() { return makeEl(); },
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') this._readyCb = cb; },
};

const store = {};
const localStorageStub = {
  getItem(k) { return store[k] || null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
};

global.window = global;
global.document = documentStub;
global.localStorage = localStorageStub;
global.confirm = () => false;
global.alert = () => {};
global.scrollTo = () => {};

function loadScript(p) {
  const code = fs.readFileSync(p, 'utf8');
  const m = new Function('window', 'document', 'localStorage', 'confirm', 'alert', code);
  m(global, documentStub, localStorageStub, global.confirm, global.alert);
}

// 按顺序加载
['data/nutrition.js', 'data/exercise.js', 'data/canteen.js', 'data/dishes.js', 'js/api.js', 'js/app.js'].forEach(f => loadScript(path.join(FRONT, f)));

if (typeof documentStub._readyCb !== 'function') {
  console.log('FAIL: 未捕获 DOMContentLoaded 回调');
  process.exit(1);
}

const p = documentStub._readyCb(); // init() 是 async，返回 Promise
Promise.resolve(p).then(() => {
  console.log('OK: init() 完整执行，无异常');
  console.log('  校验 NUTRITION=', typeof NUTRITION, ' EXERCISE=', typeof EXERCISE, ' API=', typeof API, ' SYSU_CANTEENS=', Array.isArray(SYSU_CANTEENS) ? SYSU_CANTEENS.length : '?');
  // 触发「让 Agent 配这一餐」，检查引擎输出
  var gen = elCache['btnGenerate'];
  if (gen && gen._handlers && gen._handlers.click) {
    try {
      gen._handlers.click();
      var rec = elCache['recommendCards'];
      var html = (rec && rec.innerHTML) || '';
      var ok = html.indexOf('蛋白优先') >= 0 && html.indexOf('rec-card') >= 0;
      console.log('  [' + (ok ? 'OK' : 'FAIL') + '] 推荐引擎输出：含蛋白优先=' + (html.indexOf('蛋白优先') >= 0) + ' 含rec-card=' + (html.indexOf('rec-card') >= 0) + ' 长度=' + html.length);
      if (!ok) process.exit(2);
    } catch (e) { console.log('  [FAIL] 引擎抛错:', e && e.message); process.exit(2); }
  } else {
    console.log('  [WARN] 未捕获 generatePlan 点击处理');
  }
  // 触发体测诊断（全项目 + 专项训练计划）
  documentStub.getElementById('ftGender').value = 'male';
  documentStub.getElementById('ftRunScore').value = '4:35';
  documentStub.getElementById('ftPullup').value = '3';
  documentStub.getElementById('ftVital').value = '4000';
  documentStub.getElementById('ft50').value = '7.5';
  var dia = elCache['btnFtDiagnose'];
  if (dia && dia._handlers && dia._handlers.click) {
    try {
      dia._handlers.click();
      var fr = (elCache['ftResult'] && elCache['ftResult'].innerHTML) || '';
      var ok = fr.indexOf('全项目评分') >= 0 && fr.indexOf('专项训练计划') >= 0;
      console.log('  [' + (ok ? 'OK' : 'FAIL') + '] 体测诊断：含全项目评分=' + (fr.indexOf('全项目评分') >= 0) + ' 含专项训练计划=' + (fr.indexOf('专项训练计划') >= 0) + ' 长度=' + fr.length);
      if (!ok) process.exit(2);
      // 引体向上 0 个应为 0 分
      documentStub.getElementById('ftPullup').value = '0';
      dia._handlers.click();
      var fr0 = (elCache['ftResult'] && elCache['ftResult'].innerHTML) || '';
      var zeroOk = /引体向上<\/td><td[^>]*>0<\/td>/.test(fr0);
      console.log('  [' + (zeroOk ? 'OK' : 'FAIL') + '] 引体向上 0 个 → 0 分');
      if (!zeroOk) process.exit(2);
      // 引体向上 10 个应为 60 分（2014标准及格线）
      documentStub.getElementById('ftPullup').value = '10';
      dia._handlers.click();
      var fr10 = (elCache['ftResult'] && elCache['ftResult'].innerHTML) || '';
      var tenOk = /引体向上<\/td><td[^>]*>60<\/td>/.test(fr10);
      console.log('  [' + (tenOk ? 'OK' : 'FAIL') + '] 引体向上 10 个 → 60 分');
      if (!tenOk) process.exit(2);
    } catch (e) { console.log('  [FAIL] 体测诊断抛错:', e && e.message); process.exit(2); }
  } else {
    console.log('  [WARN] 未捕获体测诊断点击处理');
  }
  process.exit(0);
}).catch(e => {
  console.log('FAIL: init() 抛错 →', e && e.stack ? e.stack : e);
  process.exit(1);
});
