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
  ];
  let ok = true;
  for (const [name, pass] of checks) {
    console.log((pass ? 'OK  ' : 'FAIL') + ' ' + name);
    if (!pass) ok = false;
  }
  console.log(ok ? '\nLIVE VERIFY PASS' : '\nLIVE VERIFY FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
