/* ============================================================
 * app.js —— 练完吃啥 前端主逻辑（深绿主题 · 概念图版）
 * 配餐 / 记录 / 原理与数据 / 体测急救站
 * ============================================================ */
(function () {
  'use strict';

  /* ================= 存储与状态 ================= */
  var LS = { profile: 'sf_profile', meals: 'sf_meals', exercises: 'sf_exercises', spending: 'sf_spending', eat: 'sf_eat' };
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var profile = load(LS.profile, { gender: 'male', age: 19, height: 175, weight: 65, goal: '维持' });
  var meals = load(LS.meals, []);
  var exercises = load(LS.exercises, []);
  var spending = load(LS.spending, []);

  var eat = load(LS.eat, {
    goal: profile.goal, exerciseType: '跑步', duration: 45, intensity: '正常',
    source: 'generic', campus: '广州校区南校园',
    selected: [], budget: 15, timeLimit: 15, mealType: '午餐',
    dealbreakers: [], weight: profile.weight, trainEnd: ''
  });
  if (!eat.weight) eat.weight = profile.weight;

  function today() { return new Date().toISOString().slice(0, 10); }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2000); }
  function fmtPrice(v) { return v == null ? '—' : ('¥' + (Math.round(v * 10) / 10)); }
  function fmtMin(v) { return v == null ? '—' : (v + ' 分钟'); }

  /* ================= 标签路由 ================= */
  function initTabs() {
    var btns = document.querySelectorAll('#tabs button[data-tab]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.tab === 'profile') { openDrawer(); return; }
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        document.querySelectorAll('.tab').forEach(function (s) { s.classList.remove('active'); });
        var sec = $('tab-' + b.dataset.tab); if (sec) sec.classList.add('active');
        if (b.dataset.tab === 'records') renderRecords();
        if (b.dataset.tab === 'science') renderScience();
        window.scrollTo({ top: 0 });
      });
    });
  }

  /* ================= 档案 ================= */
  function openDrawer() {
    $('pGender').value = profile.gender; $('pAge').value = profile.age;
    $('pHeight').value = profile.height; $('pWeight').value = profile.weight; $('pGoal').value = profile.goal;
    $('drawer').classList.add('open'); $('drawerMask').classList.add('open');
  }
  function closeDrawer() { $('drawer').classList.remove('open'); $('drawerMask').classList.remove('open'); }
  function initDrawer() {
    $('drawerMask').addEventListener('click', closeDrawer);
    $('btnSaveProfile').addEventListener('click', function () {
      profile.gender = $('pGender').value; profile.age = +$('pAge').value || 19;
      profile.height = +$('pHeight').value || 175; profile.weight = +$('pWeight').value || 65;
      profile.goal = $('pGoal').value; eat.weight = profile.weight;
      save(LS.profile, profile); save(LS.eat, eat);
      closeDrawer(); renderGoal(); toast('档案已保存 ✅');
    });
    $('btnResetData').addEventListener('click', function () {
      if (!confirm('确定清空本地所有记录吗？')) return;
      [LS.meals, LS.exercises, LS.spending].forEach(function (k) { localStorage.removeItem(k); });
      meals = []; exercises = []; spending = [];
      toast('已清空记录'); renderRecords();
    });
  }

  /* ================= 配餐 · 目标 ================= */
  function renderGoal() {
    document.querySelectorAll('#goalRow .goal-card').forEach(function (c) {
      c.classList.toggle('active', c.dataset.goal === eat.goal);
      c.onclick = function () {
        eat.goal = c.dataset.goal; profile.goal = eat.goal;
        save(LS.eat, eat); save(LS.profile, profile); renderGoal();
      };
    });
  }

  /* ================= 配餐 · 运动 ================= */
  var EX_TYPES = ['跑步', '徒步', '游泳', '力量', '球类', '休息'];
  var EX_DURATIONS = [30, 45, 60, 90];
  var EX_INTENSITY = { '轻松': { met: 0.8, note: '呼吸平稳，能说话' }, '正常': { met: 1.0, note: '微喘，能短句交流' }, '累': { met: 1.25, note: '大口喘气，说话费力' } };
  var EX_MET = { '跑步': 9, '徒步': 5, '游泳': 8, '力量': 6, '球类': 7, '休息': 0 };

  function renderExercise() {
    var t = $('exerciseTypeSeg'); t.innerHTML = '';
    EX_TYPES.forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'pill' + (x === eat.exerciseType ? ' active' : '');
      b.textContent = x;
      b.onclick = function () { eat.exerciseType = x; save(LS.eat, eat); renderExercise(); };
      t.appendChild(b);
    });
    var d = $('durationSeg'); d.innerHTML = '';
    EX_DURATIONS.forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'pill' + (x === eat.duration ? ' active' : '');
      b.textContent = x + ' 分钟';
      b.onclick = function () { eat.duration = x; save(LS.eat, eat); renderExercise(); };
      d.appendChild(b);
    });
    var i = $('intensitySeg'); i.innerHTML = '';
    Object.keys(EX_INTENSITY).forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'pill' + (x === eat.intensity ? ' active' : '');
      b.textContent = x;
      b.onclick = function () { eat.intensity = x; save(LS.eat, eat); renderExercise(); };
      i.appendChild(b);
    });
    $('intensityNote').textContent = EX_INTENSITY[eat.intensity] ? EX_INTENSITY[eat.intensity].note : '';
  }

  function exerciseKcal() {
    var met = EX_MET[eat.exerciseType] || 0;
    return Math.round(met * 3.5 * (eat.weight || 60) / 200 * eat.duration);
  }

  /* ================= 配餐 · 数据源 ================= */
  function renderSource() {
    document.querySelectorAll('#sourceToggle button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.src === eat.source);
      b.onclick = function () {
        eat.source = b.dataset.src; save(LS.eat, eat);
        renderSource(); renderCanteenTabs(); renderDishGrid();
      };
    });
  }

  function renderCanteenTabs() {
    var box = $('canteenTabs');
    if (eat.source === 'generic') { box.innerHTML = ''; return; }
    box.innerHTML = '';
    var campuses = SYSU_CANTEENS.filter(function (c) { return c.campus !== '全校区同步'; });
    campuses.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'ct' + (c.campus === eat.campus ? ' active' : '');
      b.textContent = c.campus;
      b.onclick = function () { eat.campus = c.campus; save(LS.eat, eat); renderCanteenTabs(); renderDishGrid(); };
      box.appendChild(b);
    });
  }

  // 统一菜品对象
  function normGeneric(d) {
    return { name: d.name, price: d.price, cat: d.cat, tags: d.tags || [], queue: QUEUE_BY_CAT[d.cat] || 2, meals: d.meals };
  }
  var QUEUE_BY_CAT = { '主食': 1, '蛋白': 3, '蔬菜': 2, '热菜': 3, '汤': 1, '饮品': 1 };

  function parseTagsFromSysu(s) {
    var out = [];
    var map = { '辣': ['辣'], '猪': ['猪肉'], '牛': ['牛肉'], '羊': ['羊肉'], '鸡': ['鸡肉'], '鱼': ['鱼', '海鲜'], '虾': ['海鲜'], '蛋': ['蛋'], '豆': ['豆制品'], '奶': ['奶'], '面': ['麸质'], '粉': ['麸质'] };
    Object.keys(map).forEach(function (k) { if ((s || '').indexOf(k) >= 0) out = out.concat(map[k]); });
    return out;
  }
  function mapSysuCat(cat, name) {
    var s = (cat || '') + (name || '');
    if (/主食|米饭|馒头|饼|玉米|红薯|紫薯|粥|饺|云吞|面|粉|肠粉/.test(s)) return '主食';
    if (/蛋|鸡|鱼|虾|牛肉|猪肉|排骨|豆腐|肉/.test(s)) return '蛋白';
    if (/青菜|西兰花|蔬菜|素|沙拉|凉拌/.test(s)) return '蔬菜';
    if (/汤/.test(s)) return '汤';
    return '热菜';
  }

  function flattenSysu(campus) {
    var c = SYSU_CANTEENS.find(function (x) { return x.campus === campus; });
    if (!c) return [];
    var out = [];
    c.canteens.forEach(function (ct) {
      ct.windows.forEach(function (w) {
        w.dishes.forEach(function (d) {
          if (!d.name) return;
          out.push({
            name: d.name, price: d.price != null ? d.price : d.estPrice, cat: mapSysuCat(d.category, d.name),
            tags: parseTagsFromSysu((d.tags || '') + (d.name || '')), queue: 2, meals: ['午餐', '晚餐', '加餐']
          });
        });
      });
    });
    return out;
  }

  function getPool() {
    var list;
    if (eat.source === 'generic') {
      list = GENERIC_DISHES.map(normGeneric).filter(function (d) { return d.meals.indexOf(eat.mealType) >= 0; });
    } else {
      list = flattenSysu(eat.campus);
    }
    // 排除不吃的东西
    list = list.filter(function (d) {
      return !(d.tags || []).some(function (t) { return eat.dealbreakers.indexOf(t) >= 0; });
    });
    // 去重（同名只留一次）
    var seen = {}; var out = [];
    list.forEach(function (d) { if (!seen[d.name]) { seen[d.name] = 1; out.push(d); } });
    return out;
  }

  function renderDishGrid() {
    var box = $('dishGrid');
    var pool = getPool();
    if (!pool.length) { box.innerHTML = '<p class="muted" style="padding:12px">当前条件下没有可选菜品，试试换个餐次或取消“不吃的东西”。</p>'; return; }
    box.innerHTML = pool.map(function (d) {
      var on = eat.selected.indexOf(d.name) >= 0;
      return '<div class="dish-card' + (on ? ' active' : '') + '" data-name="' + esc(d.name) + '">' +
        '<div class="row"><span class="nm">' + esc(d.name) + '<span class="check"> ✓</span></span><span class="pr">' + fmtPrice(d.price) + '</span></div>' +
        '<div class="mt">' + esc(d.cat) + ' · 排队约' + d.queue + '分钟</div>' +
        '</div>';
    }).join('');
    box.querySelectorAll('.dish-card').forEach(function (c) {
      c.onclick = function () { toggleDish(c.dataset.name); };
    });
    updateSelectedCount();
  }

  function toggleDish(name) {
    var i = eat.selected.indexOf(name);
    if (i >= 0) eat.selected.splice(i, 1); else eat.selected.push(name);
    save(LS.eat, eat); renderDishGrid();
  }
  function updateSelectedCount() { $('selectedCount').textContent = eat.selected.length; }

  /* ================= 配餐 · 约束 ================= */
  function renderConstraints() {
    var bs = $('budgetSeg'); bs.innerHTML = '';
    [10, 15, 20, '不限'].forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'pill' + ((v === '不限' && eat.budget == null) || v === eat.budget ? ' active' : '');
      b.textContent = v === '不限' ? '不限' : v + ' 元';
      b.onclick = function () { eat.budget = v === '不限' ? null : v; save(LS.eat, eat); renderConstraints(); };
      bs.appendChild(b);
    });
    var ts = $('timeSeg'); ts.innerHTML = '';
    [10, 15, 25, '不赶时间'].forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'pill' + ((v === '不赶时间' && eat.timeLimit == null) || v === eat.timeLimit ? ' active' : '');
      b.textContent = v;
      b.onclick = function () { eat.timeLimit = v === '不赶时间' ? null : v; save(LS.eat, eat); renderConstraints(); };
      ts.appendChild(b);
    });
    var ms = $('mealTypeSeg'); ms.innerHTML = '';
    MEAL_TYPES.forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'pill' + (v === eat.mealType ? ' active' : '');
      b.textContent = v;
      b.onclick = function () { eat.mealType = v; save(LS.eat, eat); renderConstraints(); renderDishGrid(); };
      ms.appendChild(b);
    });
    var ds = $('dealbreakerSeg'); ds.innerHTML = '';
    DEALBREAKERS.forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'pill' + (eat.dealbreakers.indexOf(x.id) >= 0 ? ' active' : '');
      b.textContent = x.label;
      b.onclick = function () {
        var i = eat.dealbreakers.indexOf(x.id);
        if (i >= 0) eat.dealbreakers.splice(i, 1); else eat.dealbreakers.push(x.id);
        save(LS.eat, eat); renderConstraints(); renderDishGrid();
      };
      ds.appendChild(b);
    });
    $('weightInput').value = eat.weight || profile.weight;
  }

  function initWeightInputs() {
    $('weightInput').addEventListener('change', function () {
      eat.weight = +this.value || profile.weight; profile.weight = eat.weight; save(LS.eat, eat); save(LS.profile, profile);
    });
    $('trainEndInput').addEventListener('change', function () { eat.trainEnd = this.value; save(LS.eat, eat); });
  }

  // 跑步测速：距离 + 用时 → 配速 / 速度 / 消耗
  function initPaceCalc() {
    $('btnPaceCalc').onclick = function () {
      var dist = +$('paceDist').value || 1000;
      var t = parseTime($('paceTime').value);
      if (!t) { toast('请输入用时，如 4:35'); return; }
      var paceSec = Math.round(t / (dist / 1000));      // 秒/公里
      var speed = (dist / 1000) / (t / 3600);           // km/h
      var kcal = Math.round(9 * 3.5 * (eat.weight || 60) / 200 * (t / 60));
      $('paceResult').innerHTML = '<div class="kpi-grid">' +
        '<div class="kpi"><div class="v">' + fmtSec(paceSec) + '</div><div class="k">配速 /km</div></div>' +
        '<div class="kpi"><div class="v">' + speed.toFixed(1) + '</div><div class="k">速度 km/h</div></div>' +
        '<div class="kpi"><div class="v">' + kcal + '</div><div class="k">消耗 kcal</div></div>' +
        '</div>';
    };
  }

  /* ================= 配餐 · 生成 3 套 ================= */
  function targetProteinPerMeal() {
    var w = eat.weight || 60;
    var g = eat.goal === '增肌' ? 1.8 : eat.goal === '减脂' ? 2.0 : 1.4;
    return Math.round(w * g / 3); // 每餐目标蛋白
  }

  function buildCombos(pool, state) {
    var targetP = targetProteinPerMeal();
    var budget = state.budget == null ? 999 : state.budget;
    var byCat = { '主食': [], '蛋白': [], '蔬菜': [], '汤': [], '饮品': [], '热菜': [] };
    pool.forEach(function (d) { (byCat[d.cat] || byCat['热菜']).push(d); });
    // 每个菜的营养
    pool.forEach(function (d) { d.nut = NUTRITION.lookup(d.name); });
    function n(d) { return d.nut || { kcal: 0, protein: 0, carbs: 0, fat: 0 }; }
    function pick(list, used, budgetLeft, score) {
      var cands = (list || []).filter(function (d) { return !used[d.name]; }).slice().sort(score);
      for (var i = 0; i < cands.length; i++) {
        var d = cands[i]; var p = d.price || 0;
        if (p <= budgetLeft + 0.01) return d;
      }
      return null;
    }
    function make(strategy) {
      var used = {}, picked = [], spent = 0;
      function add(list, score) {
        if (picked.length >= 4) return;
        var d = pick(list, used, budget - spent, score);
        if (d) { picked.push(d); used[d.name] = true; spent += (d.price || 0); }
      }
      add(byCat['主食'], strategy.main || strategy.protein);
      add(byCat['蛋白'], strategy.protein);
      if (strategy.wantVeg) { add(byCat['蔬菜'], strategy.veg); add(byCat['汤'], strategy.veg); }
      if (picked.length < 2) add(byCat['蔬菜'], strategy.veg);
      if (picked.length < 2) add(byCat['热菜'], strategy.protein);
      return { picked: picked, spent: spent };
    }
    function scoreByProtein(a, b) { return (n(b).protein) - (n(a).protein); }
    function scoreByValue(a, b) {
      var va = n(a).protein / ((a.price || 2) + 1), vb = n(b).protein / ((b.price || 2) + 1);
      return vb - va;
    }
    function scoreByFast(a, b) { return (a.queue || 3) - (b.queue || 3); }
    function scoreByLight(a, b) { return (n(a).kcal) - (n(b).kcal); }

    var strategies = [
      { key: 'protein', title: '蛋白优先', sub: '训练后补肌肉', main: scoreByProtein, protein: scoreByProtein, veg: scoreByLight, wantVeg: false },
      { key: 'value', title: '性价比', sub: '同样营养更省钱', main: scoreByProtein, protein: scoreByValue, veg: scoreByLight, wantVeg: false },
      { key: 'fast', title: '赶时间', sub: '少排队快吃完', main: scoreByFast, protein: scoreByFast, veg: scoreByFast, wantVeg: false },
      { key: 'balanced', title: '均衡', sub: '有荤有素有主食', main: scoreByProtein, protein: scoreByProtein, veg: scoreByLight, wantVeg: true },
    ];

    var combos = strategies.map(function (st) {
      var r = make(st);
      var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      r.picked.forEach(function (d) { var x = n(d); totals.kcal += x.kcal; totals.protein += x.protein; totals.carbs += x.carbs; totals.fat += x.fat; });
      var queue = Math.round(r.picked.reduce(function (s, d) { return s + (d.queue || 2); }, 0) / Math.max(1, r.picked.length));
      var walk = state.timeLimit == null ? 8 : state.timeLimit;
      var totalMin = queue + walk + 5;
      var coverage = Math.min(999, Math.round(totals.protein / Math.max(1, targetP) * 100));
      var price = Math.round(r.spent);
      // 每道菜标签
      var dishes = r.picked.map(function (d) {
        var x = n(d);
        var pr = x.fat * 9 / Math.max(1, x.kcal);
        var label = pr >= 0.5 ? 'bad' : (x.protein >= 12 ? 'good' : 'warn');
        return { name: d.name, price: d.price, label: label };
      });
      var why = '你练了' + state.duration + '分钟' + state.exerciseType + '，' +
        (state.goal === '减脂' ? '减脂要控油控糖、保住蛋白' : state.goal === '增肌' ? '增肌要补足蛋白、吃到热量' : '维持要均衡') + '。' +
        '这 ' + r.picked.length + ' 道共 ' + totals.protein + 'g 蛋白（目标 ' + targetP + 'g 的 ' + coverage + '%），' +
        Math.round(totals.kcal) + ' 千卡，' + price + ' 元，排队约 ' + queue + ' 分钟。';
      return {
        key: st.key, title: st.title, sub: st.sub, dishes: dishes, totals: totals,
        price: price, queue: queue, walk: walk, totalMin: totalMin, coverage: coverage, why: why,
      };
    });
    // 去重：如果两套完全一样，保留第一套
    var seen = {}; var out = [];
    combos.forEach(function (c) {
      var k = c.dishes.map(function (d) { return d.name; }).sort().join('|');
      if (!seen[k]) { seen[k] = 1; out.push(c); }
    });
    return out;
  }

  function renderRecommendCards(combos, state) {
    var box = $('recommendCards');
    if (!combos.length || !combos[0].dishes.length) {
      box.innerHTML = '<div class="card"><p class="muted">没选到合适的菜，试试放宽预算/时间，或取消「不吃的东西」。</p></div>';
      return;
    }
    $('resultMeta').textContent = '（' + eat.mealType + ' · ' + eat.goal + ' · ' + (eat.budget == null ? '不限预算' : eat.budget + '元') + '）';
    box.innerHTML = combos.map(function (c, i) {
      var best = i === 0;
      var dishes = c.dishes.map(function (d) {
        var t = d.label === 'good' ? '推荐' : d.label === 'warn' ? '适量' : '少吃';
        return '<div class="rec-dish"><span class="nm">' + esc(d.name) + '<span class="badge-lite ' + d.label + '">' + t + '</span></span><span class="' + (d.price ? '' : 'muted') + '">' + fmtPrice(d.price) + '</span></div>';
      }).join('');
      var ratio = { p: Math.round(c.totals.protein * 4 / Math.max(1, c.totals.kcal) * 100), c: Math.round(c.totals.carbs * 4 / Math.max(1, c.totals.kcal) * 100) };
      return '<div class="rec-card' + (best ? ' best' : '') + '">' +
        '<div class="rec-tag"><span class="title">' + esc(c.title) + '</span><span class="sub">' + esc(c.sub) + '</span></div>' +
        '<div class="rec-dishes">' + dishes + '</div>' +
        '<div class="macro-row">' +
        '<div class="macro"><div class="v">' + Math.round(c.totals.protein) + 'g</div><div class="k">蛋白</div></div>' +
        '<div class="macro"><div class="v">' + Math.round(c.totals.carbs) + 'g</div><div class="k">碳水</div></div>' +
        '<div class="macro"><div class="v">' + Math.round(c.totals.kcal) + '</div><div class="k">千卡</div></div>' +
        '<div class="macro"><div class="v">' + c.price + '</div><div class="k">合计¥</div></div>' +
        '</div>' +
        '<div class="macro-bar"><span class="p" style="width:' + ratio.p + '%"></span><span class="c" style="width:' + ratio.c + '%"></span><span class="f" style="width:' + Math.max(0, 100 - ratio.p - ratio.c) + '%"></span></div>' +
        '<div class="rec-meta"><span>排队约 <b>' + c.queue + '</b> 分钟</span><span>全程约 <b>' + c.totalMin + '</b> 分钟</span><span>蛋白覆盖 <b>' + c.coverage + '%</b></span></div>' +
        '<div class="why">💡 <b>为什么这么配：</b>' + esc(c.why) + '</div>' +
        '<div class="rec-actions"><button class="btn btn-ghost" data-shuffle="' + i + '">换一换</button><button class="btn btn-primary" data-eat="' + i + '">就吃这个</button></div>' +
        '</div>';
    }).join('');
    // 换一换 / 就吃这个
    box.querySelectorAll('[data-shuffle]').forEach(function (b) {
      b.onclick = function () { var idx = +b.dataset.shuffle; rotateCombo(idx); };
    });
    box.querySelectorAll('[data-eat]').forEach(function (b) {
      b.onclick = function () { var idx = +b.dataset.eat; saveMeal(combos[idx]); };
    });
    window.__lastCombos = combos;
  }

  var combosCache = [];
  function rotateCombo(idx) {
    // 简单的"换一换"：在池里换一个不同的菜再生成
    var pool = getPool();
    if (!pool.length || !combosCache.length) return;
    // 随机替换当前套里的一道菜
    var c = combosCache[idx]; if (!c) return;
    var used = c.dishes.map(function (d) { return d.name; });
    var cands = pool.filter(function (d) { return used.indexOf(d.name) < 0; });
    if (!cands.length) { toast('没有更多可换的菜了'); return; }
    var pick = cands[Math.floor(Math.random() * cands.length)];
    // 重新计算这一套
    var pool2 = pool.map(function (d) { return { name: d.name, price: d.price, cat: d.cat, tags: d.tags, queue: d.queue, meals: d.meals, nut: NUTRITION.lookup(d.name) }; });
    // 直接把 pick 加进这一套重算
    var names = c.dishes.map(function (d) { return d.name; });
    var target = names[0];
    var idx2 = names.indexOf(target);
    names[idx2] = pick.name;
    var picked = names.map(function (nm) { var d = pool2.find(function (x) { return x.name === nm; }); return d || { name: nm, price: null, cat: '热菜', tags: [], queue: 2, nut: NUTRITION.lookup(nm) }; });
    var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    picked.forEach(function (d) { var x = d.nut || { kcal: 0, protein: 0, carbs: 0, fat: 0 }; totals.kcal += x.kcal; totals.protein += x.protein; totals.carbs += x.carbs; totals.fat += x.fat; });
    var tp = targetProteinPerMeal();
    var queue = Math.round(picked.reduce(function (s, d) { return s + (d.queue || 2); }, 0) / Math.max(1, picked.length));
    var walk = eat.timeLimit == null ? 8 : eat.timeLimit;
    var dishes = picked.map(function (d) { var x = d.nut; var pr = x.fat * 9 / Math.max(1, x.kcal); return { name: d.name, price: d.price, label: pr >= 0.5 ? 'bad' : (x.protein >= 12 ? 'good' : 'warn') }; });
    combosCache[idx] = Object.assign({}, c, {
      dishes: dishes, totals: totals, price: Math.round(picked.reduce(function (s, d) { return s + (d.price || 0); }, 0)),
      queue: queue, walk: walk, totalMin: queue + walk + 5,
      coverage: Math.min(999, Math.round(totals.protein / Math.max(1, tp) * 100)),
      why: '换了「' + pick.name + '」：共 ' + totals.protein + 'g 蛋白，' + Math.round(totals.kcal) + ' 千卡。'
    });
    renderRecommendCards(combosCache, eat);
  }

  function saveMeal(c) {
    if (!c) return;
    var m = { date: today(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), dishes: c.dishes.map(function (d) { return d.name; }), kcal: Math.round(c.totals.kcal), price: c.price, goal: eat.goal };
    meals.push(m); save(LS.meals, meals);
    if (c.price) spending.push({ date: today(), amount: c.price });
    save(LS.spending, spending);
    toast('已记录这一餐 ✅');
  }

  function generatePlan() {
    var pool = getPool();
    if (!pool.length) { toast('当前没有可选菜品'); return; }
    var combos = buildCombos(pool, eat);
    combosCache = combos;
    renderRecommendCards(combos, eat);
  }

  /* ================= 配餐 · 菜单图片上传（OCR） ================= */
  function initUpload() {
    var box = $('uploadBox'), file = $('menuFile'), preview = $('menuPreview'), ocrList = $('ocrList');
    box.onclick = function () { file.click(); };
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return;
      var url = URL.createObjectURL(f);
      preview.src = url; preview.style.display = 'block';
      ocrList.innerHTML = '<span class="muted">正在识别中…（首次需下载中文识别模型，约 10-20 秒）</span>';
      runOcr(f);
    });
  }

  function loadTesseract() {
    return new Promise(function (resolve, reject) {
      if (window.Tesseract) return resolve(window.Tesseract);
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = function () { resolve(window.Tesseract); };
      s.onerror = function () { reject(new Error('OCR 库加载失败')); };
      document.head.appendChild(s);
    });
  }

  async function runOcr(file) {
    var ocrList = $('ocrList');
    try {
      var T = await loadTesseract();
      var res = await T.recognize(file, 'chi_sim', { logger: function () {} });
      var text = (res && res.data && res.data.text) || '';
      var pool = getPool();
      var found = [];
      pool.forEach(function (d) { if (text.indexOf(d.name) >= 0) found.push(d.name); });
      // 也尝试从文本里匹配常见菜名（不要求完全包含）
      if (!found.length) {
        pool.forEach(function (d) { if (d.name.length >= 2 && text.indexOf(d.name.slice(0, 2)) >= 0) found.push(d.name); });
      }
      found = Array.from(new Set(found));
      if (!found.length) {
        ocrList.innerHTML = '<span class="muted">没识别出菜品名，可手动勾选。</span>';
        return;
      }
      ocrList.innerHTML = found.map(function (nm) {
        return '<span class="chip">' + esc(nm) + ' <a href="javascript:void(0)" style="color:var(--green)" data-ocr="' + esc(nm) + '">＋加入</a></span>';
      }).join('');
      ocrList.querySelectorAll('[data-ocr]').forEach(function (a) {
        a.onclick = function () {
          var nm = a.dataset.ocr;
          if (eat.selected.indexOf(nm) < 0) eat.selected.push(nm);
          save(LS.eat, eat); renderDishGrid();
          a.textContent = '已加入';
          a.style.color = 'var(--ink-3)';
        };
      });
    } catch (e) {
      ocrList.innerHTML = '<span class="muted">OCR 不可用（离线/网络问题），请手动勾选菜品。</span>';
    }
  }

  /* ================= 记录 ================= */
  function renderRecords() {
    renderRecordMeals();
    renderSpending();
    renderSportChart();
  }
  function renderRecordMeals() {
    var box = $('recordMeals');
    if (!meals.length) { box.innerHTML = '<p class="muted">还没有就餐记录。去「配餐」生成并记下一餐吧。</p>'; return; }
    var latest = meals[meals.length - 1];
    box.innerHTML = '<div class="callout green">最近一餐：' + esc(latest.date) + ' ' + esc(latest.time) + ' · ' + latest.kcal + ' 千卡 · ' + fmtPrice(latest.price) + '</div>' +
      '<div class="seg" style="margin-top:8px">' + latest.dishes.map(function (d, i) {
        return '<span class="chip">' + esc(d) + ' <a href="javascript:void(0)" style="color:var(--red)" data-rm="' + i + '">✕</a></span>';
      }).join('') + '</div>' +
      '<div style="margin-top:10px"><input type="text" id="addMealDish" placeholder="加一个实际吃的菜" /><button class="btn btn-ghost btn-sm" style="margin-top:6px" id="btnAddMealDish">＋ 增加</button></div>';
    box.querySelectorAll('[data-rm]').forEach(function (a) {
      a.onclick = function () {
        var i = +a.dataset.rm; latest.dishes.splice(i, 1);
        latest.kcal = Math.round(latest.dishes.reduce(function (s, n) { return s + NUTRITION.lookup(n).kcal; }, 0));
        save(LS.meals, meals); renderRecordMeals();
      };
    });
    var addBtn = $('btnAddMealDish'); if (addBtn) addBtn.onclick = function () {
      var inp = $('addMealDish'); var nm = inp.value.trim(); if (!nm) return;
      latest.dishes.push(nm);
      latest.kcal = Math.round(latest.dishes.reduce(function (s, n) { return s + NUTRITION.lookup(n).kcal; }, 0));
      save(LS.meals, meals); renderRecordMeals();
    };
  }

  function spendingAvg() { if (!spending.length) return 0; return spending.reduce(function (s, d) { return s + d.amount; }, 0) / spending.length; }
  function renderSpending() {
    var total = spending.reduce(function (s, d) { return s + d.amount; }, 0);
    var n = spending.length, avg = n ? total / n : 0;
    $('spendingStats').innerHTML = '<div class="kpi-grid">' +
      '<div class="kpi"><div class="v">' + n + '</div><div class="k">记录餐数</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(total) + '</div><div class="k">累计花销</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(avg) + '</div><div class="k">平均每餐</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(avg * 30) + '</div><div class="k">预估月花销</div></div>' +
      '</div>';
  }

  function sportStat(period) {
    var now = new Date(), start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 6);
    else if (period === 'month') start.setDate(now.getDate() - 29);
    else start.setFullYear(now.getFullYear(), 0, 1);
    var list = exercises.filter(function (e) { return new Date(e.date) >= start; });
    return { min: list.reduce(function (s, e) { return s + e.minutes; }, 0), kcal: list.reduce(function (s, e) { return s + e.kcal; }, 0), sessions: list.length };
  }
  function renderSportChart() {
    var box = $('sportChart');
    var period = document.querySelector('#sportPeriodSeg .pill.active');
    period = period ? period.dataset.period : 'week';
    var now = new Date(), labels = [], buckets = [];
    if (period === 'week') {
      for (var i = 6; i >= 0; i--) { var d = new Date(now); d.setDate(now.getDate() - i); labels.push(['日', '一', '二', '三', '四', '五', '六'][d.getDay()]); buckets.push({ key: d.toISOString().slice(0, 10), min: 0 }); }
    } else if (period === 'month') {
      for (var j = 29; j >= 0; j--) { var d2 = new Date(now); d2.setDate(now.getDate() - j); labels.push(d2.getDate() + '日'); buckets.push({ key: d2.toISOString().slice(0, 10), min: 0 }); }
    } else {
      for (var m = 0; m < 12; m++) { labels.push((m + 1) + '月'); buckets.push({ key: now.getFullYear() + '-' + String(m + 1).padStart(2, '0'), min: 0 }); }
    }
    exercises.forEach(function (e) {
      var bk = period === 'year' ? e.date.slice(0, 7) : e.date;
      var b = buckets.find(function (x) { return x.key === bk; });
      if (b) b.min += e.minutes;
    });
    var maxMin = Math.max.apply(null, buckets.map(function (b) { return b.min; }).concat([1]));
    box.innerHTML = '<div class="bars">' + buckets.map(function (b, i) {
      var h = Math.round(b.min / maxMin * 100);
      return '<div class="bar" title="' + labels[i] + '：' + b.min + '分钟"><div class="val">' + b.min + '</div><div class="col" style="height:' + (h || 2) + '%"></div><div class="lab">' + labels[i] + '</div></div>';
    }).join('') + '</div>';
  }
  function initRecords() {
    $('btnRegenerateAfter').addEventListener('click', function () {
      if (!meals.length) { toast('还没有就餐记录'); return; }
      var latest = meals[meals.length - 1];
      $('aiAdjustResult').innerHTML = '<div class="callout">🤖 ' + esc(API.localAdjustAnswer ? API.localAdjustAnswer({ eatenKcal: latest.kcal, goal: eat.goal, weightKg: eat.weight }) : '这一餐已记录，注意下一餐均衡。') + '</div>';
    });
    $('btnBudgetAdvice').addEventListener('click', function () {
      var budget = +$('budgetInput').value;
      if (!budget || budget < 300) { toast('请输入合理月预算（≥300 元）'); return; }
      var past = spendingAvg();
      $('budgetAdviceResult').innerHTML = '<div class="callout">🤖 ' + esc(API.localBudgetAnswer ? API.localBudgetAnswer({ budget: budget, pastAvg: past }) : '建议每天约 ' + Math.round(budget / 30) + ' 元。') + '</div>';
    });
    $('btnSportAdvice').addEventListener('click', function () {
      var period = document.querySelector('#sportPeriodSeg .pill.active');
      period = period ? period.dataset.period : 'week';
      var s = sportStat(period);
      $('sportAiAdvice').innerHTML = '<div class="callout">🤖 ' + esc(API.localSportAnswer ? API.localSportAnswer({ period: period, totalMin: s.min, totalKcal: s.kcal, sessions: s.sessions }) : '保持运动习惯。') + '</div>';
    });
    document.querySelectorAll('#sportPeriodSeg .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        document.querySelectorAll('#sportPeriodSeg .pill').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active'); renderSportChart();
      });
    });
  }

  /* ================= 原理与数据 ================= */
  var REFS = [
    { t: '《中国居民膳食指南（2022）》', d: '中国营养学会 — 每日宏量营养素、少盐少油的核心依据。' },
    { t: '《中国食物成分表（标准版 第6版）》', d: '常见菜品热量与三大营养素数值来源。' },
    { t: '《国家学生体质健康标准（2014年修订）》', d: '教育部 — 体测评分与项目标准。' },
    { t: 'Compendium of Physical Activities (2011)', d: 'MET 代谢当量，运动热量计算依据。' },
    { t: 'Mifflin-St Jeor 公式', d: '基础代谢率(BMR)估算。' },
  ];
  var SOURCES = [
    { t: '通用菜品库（默认）', d: '模拟常见高校/快餐菜品，价格为参考区间；营养来自本地营养库。' },
    { t: '中山大学食堂（可选）', d: '647 道菜、46 食堂、5 校区，来自《中山大学食堂菜单价格明细表》；无标价按「自选/称重」参考价估算。' },
    { t: '营养数据', d: '优先《中国食物成分表》匹配，搜不到按常识估算并标注「估算值」。' },
  ];
  function renderScience() {
    $('refList').innerHTML = REFS.map(function (r) { return '<li><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></li>'; }).join('');
    $('dataSourceList').innerHTML = SOURCES.map(function (r) { return '<div class="callout green" style="margin-bottom:8px"><b>' + esc(r.t) + '</b><br>' + esc(r.d) + '</div>'; }).join('');
    var st = API.getState();
    $('devConfigNote').innerHTML = '后端状态：<b>' + esc(st.backendReason) + '</b>。<br>把 <code>GLM_API_KEY</code> 配到后端环境变量即可启用大模型；未配置自动用本地规则引擎（离线、免费、稳定）。';
  }

  /* ================= 智能教练 ================= */
  function initCoach() {
    appendMsg('ai', '你好！我是练完吃啥的智能教练 🤖\n运动训练、食堂饮食搭配、减脂增肌、体测提分都能问我。');
    function send() {
      var inp = $('coachInput'), q = inp.value.trim(); if (!q) return;
      appendMsg('user', q); inp.value = '';
      var t = appendMsg('ai', '…');
      API.callAgent({ type: 'coach', question: q }).then(function (res) { t.textContent = res.text; });
    }
    $('btnCoachSend').addEventListener('click', send);
    $('coachInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  }
  function appendMsg(role, text) {
    var box = $('coachChat'), d = document.createElement('div');
    d.className = 'msg ' + role; d.textContent = text; box.appendChild(d); box.scrollTop = box.scrollHeight;
    return d;
  }

  /* ================= 体测急救站 ================= */
  var FT = {
    male: {
      run: { 100: 197, 95: 202, 90: 207, 85: 214, 80: 222, 78: 227, 76: 232, 74: 237, 72: 242, 70: 247, 68: 252, 66: 257, 64: 262, 62: 267, 60: 272, 50: 292, 40: 312, 30: 332, 20: 352, 10: 372 },
      pullup: { 100: 19, 95: 18, 90: 17, 85: 16, 80: 15, 78: 14, 76: 13, 74: 12, 72: 11, 70: 10, 68: 9, 66: 8, 64: 7, 62: 6, 60: 5, 50: 4, 40: 3, 30: 2, 20: 1, 10: 0 },
    },
    female: {
      run: { 100: 198, 95: 204, 90: 210, 85: 217, 80: 224, 78: 229, 76: 234, 74: 239, 72: 244, 70: 249, 68: 254, 66: 259, 64: 264, 62: 269, 60: 274, 50: 284, 40: 294, 30: 304, 20: 314, 10: 324 },
      situp: { 100: 52, 95: 50, 90: 48, 85: 46, 80: 44, 78: 43, 76: 42, 74: 41, 72: 40, 70: 39, 68: 38, 66: 37, 64: 36, 62: 34, 60: 32, 50: 28, 40: 24, 30: 20, 20: 16, 10: 12 },
    },
  };
  function parseTime(s) { var m = /^(\d+)[:：分](\d{1,2})/.exec((s || '').trim()); if (!m) return null; return (+m[1]) * 60 + (+m[2]); }
  function scoreFromTable(val, table, lowerBetter) {
    var pts = Object.keys(table).map(Number).sort(function (a, b) { return b - a; });
    if (lowerBetter ? val <= table[100] : val >= table[100]) return 100;
    if (lowerBetter ? val >= table[10] : val <= table[10]) return 10;
    for (var i = 0; i < pts.length - 1; i++) {
      var hi = pts[i], lo = pts[i + 1], hiV = table[hi], loV = table[lo];
      if (lowerBetter ? (val >= hiV && val <= loV) : (val <= hiV && val >= loV)) {
        var ratio = (val - hiV) / (loV - hiV);
        return Math.round(hi + (lo - hi) * ratio);
      }
    }
    return 10;
  }
  function fmtSec(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + String(r).padStart(2, '0'); }
  function syncFtGender() {
    var female = $('ftGender').value === 'female';
    $('ftPullupWrap').style.display = female ? 'none' : '';
    $('ftSitupWrap').style.display = female ? '' : 'none';
    $('ftEvent').innerHTML = female ? '<option value="800">800 米（女）</option>' : '<option value="1000">1000 米（男）</option>';
  }
  function initFitness() {
    $('ftGender').addEventListener('change', syncFtGender);
    syncFtGender();
    $('btnFtDiagnose').addEventListener('click', diagnose);
  }
  function diagnose() {
    var gender = $('ftGender').value, daysLeft = +$('ftDaysLeft').value || 12, daysPerWeek = +$('ftDaysPerWeek').value || 5;
    var injury = $('ftInjury').value.trim();
    var runSec = parseTime($('ftRunScore').value);
    var count = gender === 'male' ? (+$('ftPullup').value || 0) : (+$('ftSitup').value || 0);
    if (runSec == null) { toast('请正确填写成绩，格式如 4:35'); return; }
    var table = FT[gender];
    var runScore = scoreFromTable(runSec, table.run, true);
    var strengthScore = scoreFromTable(count, gender === 'male' ? table.pullup : table.situp, false);
    var runGain = Math.max(0, scoreFromTable(Math.max(1, runSec - 10), table.run, true) - runScore);
    var strengthGain = Math.max(0, scoreFromTable(count + 2, gender === 'male' ? table.pullup : table.situp, false) - strengthScore);
    var focusRun = runGain >= strengthGain;
    var runItem = gender === 'male' ? '1000米' : '800米', strengthItem = gender === 'male' ? '引体向上' : '仰卧起坐';
    var plan = buildFtPlan({ daysLeft: daysLeft, daysPerWeek: daysPerWeek, runItem: runItem, strengthItem: strengthItem });
    var targetSec = Math.round(runSec * 0.95), per200 = Math.round(targetSec / (gender === 'male' ? 5 : 4));
    var box = $('ftResult');
    var html = '<div class="card"><h2><span class="icon">📋</span> 提分诊断</h2>';
    html += '<div class="kpi-grid"><div class="kpi"><div class="v">' + runScore + '</div><div class="k">' + runItem + '得分</div></div>' +
      '<div class="kpi"><div class="v">' + strengthScore + '</div><div class="k">' + strengthItem + '得分</div></div>' +
      '<div class="kpi"><div class="v">' + Math.max(runScore, strengthScore) + '</div><div class="k">当前最高分</div></div>' +
      '<div class="kpi"><div class="v">' + daysLeft + '天</div><div class="k">剩余时间</div></div></div>';
    html += '<div class="callout green">🎯 <b>先练这项：' + (focusRun ? runItem : strengthItem) + '</b><br>';
    if (focusRun) html += '当前 ' + runItem + ' ' + $('ftRunScore').value + '（约 ' + runScore + ' 分）。提 10 秒约 +' + runGain + ' 分。';
    else html += '当前 ' + strengthItem + ' ' + count + ' 个（约 ' + strengthScore + ' 分）。+2 个约 +' + strengthGain + ' 分，比 ' + runItem + ' 提 10 秒(+' + runGain + ' 分)更划算。';
    html += '</div>';
    if (injury) html += '<div class="callout">⚠️ 检测到「' + esc(injury) + '」：训练已自动降载/换项。</div>';
    html += '<h3>🗓️ 未来 ' + daysLeft + ' 天计划（每天 15–25 分钟）</h3><div class="dish-list">';
    plan.forEach(function (d) {
      html += '<div class="dish-item" style="cursor:default"><span style="min-width:54px;font-weight:700">D' + d.day + '</span><span class="name">' + esc(d.focus) + '</span><span class="est">' + esc(d.detail) + '</span></div>';
    });
    html += '</div><h3 style="margin-top:14px">🩹 伤病换项</h3><div class="seg"><span class="pill">深蹲 → 臀桥</span><span class="pill">跑步 → 快走</span><span class="pill">卷腹 → 死虫</span></div>';
    html += '<h3 style="margin-top:14px">⏱️ 配速器（跑步测速）</h3><div id="ftPacer"></div>';
    html += '</div>';
    box.innerHTML = html;
    renderPacer(per200, targetSec);
  }
  function buildFtPlan(o) {
    var plan = [];
    for (var i = 1; i <= o.daysLeft; i++) {
      var taper = i > o.daysLeft - 3;
      if (taper) plan.push({ day: i, focus: '减量恢复', detail: '轻松慢跑 10 分钟 + 拉伸' });
      else if (i % 2 === 1) plan.push({ day: i, focus: o.runItem + ' 间歇', detail: '400m×4 组，组间走 200m' });
      else plan.push({ day: i, focus: o.strengthItem + ' 专项', detail: o.strengthItem + '退让/辅助训练 3 组' });
    }
    return plan;
  }
  function renderPacer(per200, targetSec) {
    $('ftPacer').innerHTML = '<div class="pacer-big" id="pacerClock">' + fmtSec(per200) + '</div>' +
      '<div class="grid2" style="margin-top:8px"><button class="btn btn-primary btn-sm" id="btnPacerStart">▶ 开始报时（每200米）</button><button class="btn btn-ghost btn-sm" id="btnPacerStop">⏹ 停止</button></div>' +
      '<p class="hint">目标成绩 ' + fmtSec(targetSec) + '，每 200 米 ' + fmtSec(per200) + '。不依赖 GPS，操场/跑步机都能用。</p>';
    $('btnPacerStart').onclick = function () { startPacer(per200); };
    $('btnPacerStop').onclick = function () { stopPacer(); };
  }
  var pacerInt = null;
  function startPacer(per200) {
    var el = $('pacerClock'), left = per200;
    clearInterval(pacerInt); el.textContent = fmtSec(left); beep(1);
    pacerInt = setInterval(function () { left--; el.textContent = fmtSec(Math.max(0, left)); if (left <= 0) { left = per200; beep(2); } }, 1000);
  }
  function stopPacer() { clearInterval(pacerInt); var el = $('pacerClock'); if (el) el.textContent = '—'; }
  function beep(times) {
    try {
      var ctx = window.__ac || (window.__ac = new (window.AudioContext || window.webkitAudioContext)());
      for (var i = 0; i < times; i++) { (function (i) { setTimeout(function () { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = .3; o.start(); o.stop(ctx.currentTime + .12); }, i * 180); })(i); }
    } catch (e) {}
  }

  /* ================= 初始化 ================= */
  async function init() {
    initTabs(); initDrawer(); renderGoal(); renderExercise(); renderSource();
    renderCanteenTabs(); renderDishGrid(); renderConstraints(); initWeightInputs(); initUpload(); initPaceCalc();
    initRecords(); initCoach(); initFitness();
    $('btnGenerate').addEventListener('click', generatePlan);

    $('weightInput').value = eat.weight || profile.weight;
    $('trainEndInput').value = eat.trainEnd || '';

    var online = await API.checkBackend();
    $('backendStatus').classList.toggle('off', !online);
    $('backendStatusText').textContent = online ? '已连接 Agent' : '本地引擎';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
