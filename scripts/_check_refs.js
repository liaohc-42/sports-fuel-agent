// 校验 index.html 引用的所有本地资源都存在
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const refs = [];
for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
  const u = m[1];
  if (/^(https?:|#|javascript:)/.test(u)) continue;
  refs.push(u);
}
let fail = 0;
for (const r of refs) {
  // 去掉 ?v= 这类缓存版本号再判断文件是否存在
  const clean = r.split('?')[0];
  const p = path.join(ROOT, clean);
  const ok = fs.existsSync(p);
  console.log((ok ? 'ok  ' : 'MISS') + ' ' + r);
  if (!ok) fail++;
}
console.log(fail ? '\n*** ' + fail + ' 缺失 ***' : '\n所有资源引用有效，共 ' + refs.length + ' 项');
process.exit(fail ? 1 : 0);
