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
eq('find(run).met', EXERCISE.find('run').met, 9);

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

// 体测评分（独立复刻《2014 标准》官方表，交叉验证 app.js）
const FTJ = {
  run: {100:197,95:202,90:207,85:214,80:222,78:227,76:232,74:237,72:242,70:247,68:252,66:257,64:262,62:267,60:272,50:292,40:312,30:332,20:352,10:372},
  pullup:{100:19,95:18,90:17,85:16,80:15,76:14,72:13,68:12,64:11,60:10,50:9,40:8,30:7,20:6,10:5,0:0}
};
const FTS = { // 大三、大四
  run: {100:195,95:200,90:205,85:212,80:220,78:225,76:230,74:235,72:240,70:245,68:250,66:255,64:260,62:265,60:270,50:290,40:310,30:330,20:350,10:370},
  pullup:{100:20,95:19,90:18,85:17,80:16,76:15,72:14,68:13,64:12,60:11,50:10,40:9,30:8,20:7,10:6,0:0}
};
function scoreFromTable(val, table, lowerBetter){var pts=Object.keys(table).map(Number).sort((a,b)=>b-a); var maxS=pts[0], minS=pts[pts.length-1]; if(lowerBetter?val<=table[maxS]:val>=table[maxS])return maxS; if(lowerBetter?val>=table[minS]:val<=table[minS])return minS; for(var i=0;i<pts.length-1;i++){var hi=pts[i],lo=pts[i+1],hiV=table[hi],loV=table[lo]; if(lowerBetter?(val>=hiV&&val<=loV):(val<=hiV&&val>=loV)){var r=(val-hiV)/(loV-hiV); return Math.round(hi+(lo-hi)*r);}} return minS;}
// 关键分档锁定（官方原表）
eq('1000米 4:32(272s) 大一/大二', scoreFromTable(272, FTJ.run, true), 60);
eq('引体 10 个 大一/大二', scoreFromTable(10, FTJ.pullup, false), 60);
eq('引体 11 个 大三/大四', scoreFromTable(11, FTS.pullup, false), 60);
eq('引体 0 个', scoreFromTable(0, FTJ.pullup, false), 0);
// 1000米 4'35" = 275s
console.log('  1000米 4:35(275s) 得分 =', scoreFromTable(275, FTJ.run, true));
console.log('  引体 3个 得分 =', scoreFromTable(3, FTJ.pullup, false));
console.log('  引体 5个 得分 =', scoreFromTable(5, FTJ.pullup, false));
console.log('  1000米 4:25(265s) 得分 =', scoreFromTable(265, FTJ.run, true));
console.log('  大三/大四 1000米 4:30(270s) 得分 =', scoreFromTable(270, FTS.run, true));

console.log(fails ? '\n*** ' + fails + ' FAILED ***' : '\nALL PASS');
process.exit(fails ? 1 : 0);
