// 验证线上页面包含新功能
const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'dsh' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

(async () => {
  const r = await get('https://liaohc-42.github.io/sports-fuel-agent/');
  const t = r.body;
  const checks = [
    ['HTTP 200', r.status === 200],
    ['30+运动', t.indexOf('30+ 主流项目') >= 0],
    ['体测肺活量', t.indexOf('肺活量') >= 0],
    ['坐位体前屈', t.indexOf('坐位体前屈') >= 0],
    ['配速器', t.indexOf('配速器') >= 0],
    ['pacerTarget', t.indexOf('pacerTarget') >= 0],
    ['exerciseCatSeg', t.indexOf('exerciseCatSeg') >= 0],
    ['dishes.js', t.indexOf('dishes.js') >= 0],
    ['时长数轴', t.indexOf('durationRange') >= 0],
    ['预算数轴', t.indexOf('budgetRange') >= 0],
    ['时间数轴', t.indexOf('timeRange') >= 0],
    ['热量缺口', t.indexOf('exerciseStats') >= 0],
    ['食堂三级-canteen', t.indexOf('canteenSelect') >= 0],
    ['食堂三级-window', t.indexOf('windowSelect') >= 0],
    ['日期时间', t.indexOf('dateTime') >= 0],
    ['手动添加', t.indexOf('btnAddManual') >= 0],
    ['大三/大四评分表', t.indexOf('大三/大四') >= 0],
    ['年级自动切换提示', t.indexOf('按年级自动切换') >= 0],
  ];
  let ok = true;
  for (const [name, pass] of checks) {
    console.log((pass ? 'OK  ' : 'FAIL') + ' ' + name);
    if (!pass) ok = false;
  }
  console.log(ok ? '\nLIVE VERIFY PASS' : '\nLIVE VERIFY FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
