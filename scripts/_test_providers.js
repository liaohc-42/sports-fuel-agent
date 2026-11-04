// 后端模型选择测试：GLM / DeepSeek / Ollama 三选一 + 无 Key 时返回 null
const a = require('C:/Users/liao/Documents/deepseek-harness/default-workspace/sports-fuel-agent/backend/api/agent.js');

let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log('FAIL', name, 'got=', JSON.stringify(got), 'want=', JSON.stringify(want)); }
  else console.log('ok  ', name);
}
function ok(name, cond) { if (!cond) { fails++; console.log('FAIL', name); } else console.log('ok  ', name); }

const saved = {};
['GLM_API_KEY', 'DEEPSEEK_API_KEY', 'OLLAMA_BASE_URL', 'OLLAMA_MODEL', 'PROVIDER', 'GLM_MODEL', 'DEEPSEEK_MODEL']
  .forEach(k => { saved[k] = process.env[k]; delete process.env[k]; });

eq('无任何 Key → null', a.pickProvider({}), null);

process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
process.env.OLLAMA_MODEL = 'qwen2.5';
ok('Ollama 被识别', /^Ollama/.test(a.pickProvider({}).name));

process.env.DEEPSEEK_API_KEY = 'sk-test';
delete process.env.OLLAMA_BASE_URL;
const d = a.pickProvider({});
ok('DeepSeek 默认模型 = deepseek-flash', /deepseek-flash/.test(d.name));

process.env.DEEPSEEK_MODEL = 'deepseek-v4-pro';
ok('DeepSeek 模型可被环境变量覆盖', /deepseek-v4-pro/.test(a.pickProvider({}).name));

delete process.env.DEEPSEEK_API_KEY;
process.env.GLM_API_KEY = 'glm-test';
const g = a.pickProvider({});
ok('GLM 默认模型 = glm-4-flash', /glm-4-flash/.test(g.name));
ok('GLM 名称格式正确', /^GLM/.test(g.name));

// 显式 PROVIDER 优先级
process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
process.env.PROVIDER = 'glm';
ok('PROVIDER 显式指定优先于 Ollama', /^GLM/.test(a.pickProvider({}).name));
delete process.env.PROVIDER;

// 视觉：无视觉模型时返回 null
delete process.env.GLM_API_KEY;
delete process.env.OLLAMA_VISION_MODEL;
a.recognizeFood('AAAA', 'image/jpeg').then(r => {
  eq('无视觉模型 → null', r, null);

  Object.keys(saved).forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
  process.exit(fails ? 1 : 0);
});
