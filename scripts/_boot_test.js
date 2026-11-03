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
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; },
    },
    addEventListener() {}, removeEventListener() {},
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
  process.exit(0);
}).catch(e => {
  console.log('FAIL: init() 抛错 →', e && e.stack ? e.stack : e);
  process.exit(1);
});
