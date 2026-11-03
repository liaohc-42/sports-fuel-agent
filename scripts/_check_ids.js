// 校验 app.js 中所有 getElementById 引用的 id 是否存在于 index.html（或为动态注入）
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';
const appjs = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const htmlIds = new Set();
for (const m of html.matchAll(/id="([^"]+)"/g)) htmlIds.add(m[1]);

// 动态注入的 id（app.js 通过 innerHTML 创建的）
const dynamicIds = new Set([
  'dishSearch', 'dishItems', 'addMealDish', 'btnAddMealDish',
  'ftToday', 'ftPacer', 'ftCheckinMsg', 'ftTimer', 'pacerClock',
  'btnPacerStart', 'btnPacerStop', 'aiComment',
]);

const used = new Set();
for (const m of appjs.matchAll(/\$\('([^']+)'\)/g)) used.add(m[1]);
for (const m of appjs.matchAll(/getElementById\('([^']+)'\)/g)) used.add(m[1]);
// 动态拼接的 tab-x
for (const t of ['eat','records','science','fitness']) used.delete('tab-' + t); // 这些是拼接的，单独处理

let fail = 0;
const sorted = [...used].sort();
for (const id of sorted) {
  const ok = htmlIds.has(id) || dynamicIds.has(id);
  if (!ok) { console.log('MISS  $(\'' + id + '\')'); fail++; }
  else console.log('ok    $(\'' + id + '\')' + (dynamicIds.has(id) ? ' (动态)' : ''));
}
// tab-x 拼接目标检查
for (const t of ['eat','records','practice','venue','me','pickup','gear','science']) {
  if (!htmlIds.has('tab-' + t)) { console.log('MISS  tab-' + t); fail++; }
}
console.log(fail ? '\n*** ' + fail + ' 个 id 缺失 ***' : '\n所有 id 引用一致，共 ' + sorted.length + ' 个');
process.exit(fail ? 1 : 0);
