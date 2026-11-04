// 打包单文件离线版：把 css/js 内联进一个 HTML，双击即可离线打开演示
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent';
const FRONT = path.join(ROOT, 'frontend');
const OUT = path.join(ROOT, 'dist', '练完吃啥-离线单文件版.html');

let html = fs.readFileSync(path.join(FRONT, 'index.html'), 'utf8');

// 内联 CSS（兼容 ?v= 缓存版本号）
const css = fs.readFileSync(path.join(FRONT, 'css', 'style.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="css\/style\.css(?:\?v=[^"]*)?" \/>/, '<style>\n' + css + '\n</style>');

// 内联 JS（保持加载顺序；兼容标签上的 ?v= 查询串）
const scripts = ['data/nutrition.js', 'data/exercise.js', 'data/canteen.js', 'data/dishes.js', 'data/credits.js', 'data/venues.js', 'js/api.js', 'js/credits.js', 'js/venues.js', 'js/campus.js', 'js/app.js'];
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const s of scripts) {
  const code = fs.readFileSync(path.join(FRONT, s), 'utf8');
  const re = new RegExp('<script src="' + escRe(s) + '(?:\\?v=[^"]*)?"></script>');
  if (!re.test(html)) { console.log('WARN 未找到标签: ' + s); continue; }
  html = html.replace(re, '<script>\n' + code + '\n</script>');
}

// 加生成标记
html = html.replace('</head>', '  <!-- 本文件由 scripts/build_single_file.js 自动生成，改动请回 frontend/ 源文件 -->\n</head>');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('OK 生成:', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
