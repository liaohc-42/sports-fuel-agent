// 核心逻辑冒烟测试（Node 模拟 window）
global.window = global;
const path = require('path');
const fs = require('fs');
const ROOT = 'C:\\Users\\liao\\Documents\\deepseek-harness\\default-workspace\\sports-fuel-agent\\frontend';

eval(fs.readFileSync(path.join(ROOT, 'data', 'nutrition.js'), 'utf8'));
eval(fs.readFileSync(path.join(ROOT, 'data', 'exercise.js'), 'utf8'));
eval(fs.readFileSync(path.join(ROOT, 'data', 'canteen.js'), 'utf8'));
eval(fs.readFileSync(path.join(ROOT, 'js', 'api.js'), 'utf8'));

let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log('FAIL', name, 'got=', JSON.stringify(got), 'want=', JSON.stringify(want)); }
  else console.log('ok  ', name, '=', JSON.stringify(got));
}

// 营养查询
eq('lookup 白米饭(exact)', NUTRITION.lookup('白米饭').kcal, 232);
eq('lookup 红烧肉(exact)', NUTRITION.lookup('红烧肉').kcal, 480);
eq('lookup 水煮肉片(fuzzy)', NUTRITION.lookup('水煮肉片').matched, 'exact');
eq('lookup 未知菜(category)', NUTRITION.lookup('神秘料理').matched, 'category');
console.log('  未知菜 kcal =', NUTRITION.lookup('神秘料理').kcal);

// 目标宏量
console.log('  targetMacros(增肌,65) =', JSON.stringify(NUTRITION.targetMacros('增肌', 65)));
console.log('  targetMacros(减脂,60) =', JSON.stringify(NUTRITION.targetMacros('减脂', 60)));

// 运动热量
eq('calcKcal(10,65,30)', EXERCISE.calcKcal(10, 65, 30), 341);
eq('calcBMR(male,65,175,19)', EXERCISE.calcBMR('male', 65, 175, 19), Math.round(10*65+6.25*175-5*19+5));
console.log('  targetIntake(增肌) =', JSON.stringify(EXERCISE.targetIntake('增肌', 1600, 340)));

// 食堂数据
console.log('  校区数 =', window.SYSU_CANTEENS.length);
window.SYSU_CANTEENS.forEach(c => console.log('   -', c.campus, '食堂数=', c.canteens.length));

// 本地配餐引擎
const dishes = ['白米饭','水煮肉片','手撕鸡','青菜'].map(n => ({ name: n, nutrition: NUTRITION.lookup(n), price: null, estPrice: 10 }));
const plan = API.generatePlanLocal({ goal: '增肌', weightKg: 65, dishes });
console.log('  plan combos =', plan.combos.length);
console.log('  combo0 =', JSON.stringify(plan.combos[0].dishes.map(d => d.name + ':' + d.label)));
console.log('  combo0 totals =', JSON.stringify(plan.combos[0].totals), 'ratio=', JSON.stringify(plan.combos[0].ratio));
console.log('  combo0 alts =', JSON.stringify(plan.combos[0].alternatives));

// 减脂
const plan2 = API.generatePlanLocal({ goal: '减脂', weightKg: 60, dishes, budget: 30 });
console.log('  plan2(减脂) combo0 =', JSON.stringify(plan2.combos[0].dishes.map(d => d.name + ':' + d.label)));

// 体测评分（复刻表做独立验证）
const FT = { male: { run: {100:197,95:202,90:207,85:214,80:222,78:227,76:232,74:237,72:242,70:247,68:252,66:257,64:262,62:267,60:272,50:292,40:312,30:332,20:352,10:372}, pullup:{100:19,95:18,90:17,85:16,80:15,78:14,76:13,74:12,72:11,70:10,68:9,66:8,64:7,62:6,60:5,50:4,40:3,30:2,20:1,10:0} } };
function scoreFromTable(val, table, lowerBetter){var pts=Object.keys(table).map(Number).sort((a,b)=>b-a); if(lowerBetter?val<=table[100]:val>=table[100])return 100; if(lowerBetter?val>=table[10]:val<=table[10])return 10; for(var i=0;i<pts.length-1;i++){var hi=pts[i],lo=pts[i+1],hiV=table[hi],loV=table[lo]; if(lowerBetter?(val>=hiV&&val<=loV):(val<=hiV&&val>=loV)){var r=(val-hiV)/(loV-hiV); return Math.round(hi+(lo-hi)*r);}} return 10;}
// 1000米 4'35" = 275s
console.log('  1000米 4:35(275s) 得分 =', scoreFromTable(275, FT.male.run, true));
console.log('  引体 3个 得分 =', scoreFromTable(3, FT.male.pullup, false));
console.log('  引体 5个 得分 =', scoreFromTable(5, FT.male.pullup, false));
console.log('  1000米 4:25(265s) 得分 =', scoreFromTable(265, FT.male.run, true));

console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
process.exit(fails ? 1 : 0);
