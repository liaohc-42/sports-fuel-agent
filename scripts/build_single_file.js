// 打包单文件离线版：把 css/js 内联进一个 HTML，双击即可离线打开演示
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent';
const FRONT = path.join(ROOT, 'frontend');
const OUT = path.join(ROOT, 'dist', '练完吃啥-离线单文件版.html');

let html = fs.readFileSync(path.join(FRONT, 'index.html'), 'utf8');

// 内联 CSS
const css = fs.readFileSync(path.join(FRONT, 'css', 'style.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="css\/style\.css" \/>/, '<style>\n' + css + '\n</style>');

// 内联 JS（保持加载顺序）
const scripts = ['data/nutrition.js', 'data/exercise.js', 'data/canteen.js', 'data/dishes.js', 'js/api.js', 'js/app.js'];
for (const s of scripts) {
  const code = fs.readFileSync(path.join(FRONT, s), 'utf8');
  const tag = '<script src="' + s + '"></script>';
  if (!html.includes(tag)) { console.log('WARN 未找到标签: ' + tag); continue; }
  html = html.replace(tag, '<script>\n' + code + '\n</script>');
}

// 加生成标记
html = html.replace('</head>', '  <!-- 本文件由 scripts/build_single_file.js 自动生成，改动请回 frontend/ 源文件 -->\n</head>');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('OK 生成:', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
