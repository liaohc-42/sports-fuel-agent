// 测试 backend/api/agent.js 的 JSON 校验与回退逻辑（不联网）
process.env = {};
const a = require('C:/Users/liao/Documents/deepseek-harness/default-workspace/sports-fuel-agent/backend/api/agent.js');

let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log('FAIL', name, 'got=', JSON.stringify(got), 'want=', JSON.stringify(want)); }
  else console.log('ok  ', name);
}

eq('valid object', a.validate({ answer: 'ok', points: ['a', 'b'], caution: 'c' }), true);
eq('reject 承诺词', a.validate({ answer: '保证提分', points: [] }), false);
eq('reject missing answer', a.validate({ points: ['a'] }), false);
eq('reject non-string point', a.validate({ answer: 'x', points: [1] }), false);

const wrapped = '```json\n{"answer":"好"}\n```';
eq('parseJson wrapped', a.parseJson(wrapped).answer, '好');
const noisy = '前言{ "answer": "ok", "points": ["a"] }后记';
eq('parseJson noisy', a.parseJson(noisy).answer, 'ok');

// 无 provider → null
a.runAgent('coach', { question: 'hi' }).then(r => {
  eq('runAgent no provider → null', r, null);
  console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
  process.exit(fails ? 1 : 0);
});
