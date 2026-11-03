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
    goal: profile.goal, exerciseType: 'run', exerciseCat: '有氧', duration: 45, intensity: '正常',
    source: 'generic', campus: '广州校区南校园', canteen: '', window: '',
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

  /* ================= 配餐 · 运动（30+ 项目） ================= */
  var EX_CATS = ['有氧', '游泳', '力量', '球类', '其他'];
  var EX_DURATIONS = [30, 45, 60, 90];
  var EX_INTENSITY = { '轻松': { f: 0.8, note: '呼吸平稳，能说话' }, '正常': { f: 1.0, note: '微喘，能短句交流' }, '累': { f: 1.25, note: '大口喘气，说话费力' } };

  function currentEx() {
    return EXERCISE.find(eat.exerciseType) || EXERCISE.find('run') || { id: 'run', name: '跑步', met: 9, category: '有氧' };
  }

  function renderExercise() {
    var curCat = eat.exerciseCat || currentEx().category;
    var c = $('exerciseCatSeg'); c.innerHTML = '';
    EX_CATS.forEach(function (cat) {
      var b = document.createElement('button');
      b.className = 'pill' + (cat === curCat ? ' active' : '');
      b.textContent = cat;
      b.onclick = function () { eat.exerciseCat = cat; save(LS.eat, eat); renderExercise(); };
      c.appendChild(b);
    });
    var opts = EXERCISE.LIB[curCat] || [];
    var t = $('exerciseTypeSeg'); t.innerHTML = '';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'pill' + (o.id === eat.exerciseType ? ' active' : '');
      b.textContent = o.name;
      b.title = o.note || '';
      b.onclick = function () { eat.exerciseType = o.id; save(LS.eat, eat); renderExercise(); };
      t.appendChild(b);
    });
    // 时长：数轴（分度 5 分钟）
    var dr = $('durationRange');
    if (dr) {
      dr.value = eat.duration;
      $('durationVal').textContent = eat.duration + ' 分钟';
      dr.oninput = function () { eat.duration = +dr.value; $('durationVal').textContent = eat.duration + ' 分钟'; save(LS.eat, eat); updateStats(); };
    }
    var i = $('intensitySeg'); i.innerHTML = '';
    Object.keys(EX_INTENSITY).forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'pill' + (x === eat.intensity ? ' active' : '');
      b.textContent = x;
      b.onclick = function () { eat.intensity = x; save(LS.eat, eat); renderExercise(); };
      i.appendChild(b);
    });
    $('intensityNote').textContent = (EX_INTENSITY[eat.intensity] ? EX_INTENSITY[eat.intensity].note : '');
    updateStats();
  }

  // 运动消耗 + 今日热量缺口
  function updateStats() {
    var box = $('exerciseStats'); if (!box) return;
    var kcal = exerciseKcal();
    var bmr = EXERCISE.calcBMR(profile.gender, eat.weight || 65, profile.height, profile.age);
    var maintain = Math.round(bmr * 1.3 + kcal);
    var target = eat.goal === '增肌' ? maintain + 300 : eat.goal === '减脂' ? Math.max(1200, maintain - 400) : maintain;
    var intake = eat.selected.reduce(function (s, n) { return s + NUTRITION.lookup(n).kcal; }, 0);
    var gap = target - intake;
    box.innerHTML = '<div class="kpi-grid">' +
      '<div class="kpi"><div class="v">' + kcal + '</div><div class="k">运动消耗 kcal</div></div>' +
      '<div class="kpi"><div class="v">' + target + '</div><div class="k">建议摄入 kcal</div></div>' +
      '<div class="kpi"><div class="v" style="color:' + (gap >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (gap >= 0 ? '+' : '') + gap + '</div><div class="k">今日热量缺口/盈余</div></div>' +
      '</div>';
  }

  function exerciseKcal() {
    var ex = currentEx();
    var f = EX_INTENSITY[eat.intensity] ? EX_INTENSITY[eat.intensity].f : 1;
    return EXERCISE.calcKcal(ex.met * f, eat.weight || 60, eat.duration);
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
    var levels = $('sysuLevels');
    if (eat.source === 'generic') { box.innerHTML = ''; if (levels) levels.style.display = 'none'; return; }
    if (levels) levels.style.display = '';
    box.innerHTML = '';
    var campuses = SYSU_CANTEENS.filter(function (c) { return c.campus !== '全校区同步'; });
    campuses.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'ct' + (c.campus === eat.campus ? ' active' : '');
      b.textContent = c.campus;
      b.onclick = function () { eat.campus = c.campus; eat.canteen = ''; eat.window = ''; save(LS.eat, eat); renderCanteenTabs(); renderDishGrid(); };
      box.appendChild(b);
    });
    renderCanteenSelect();
    renderWindowSelect();
  }

  function renderCanteenSelect() {
    var campus = SYSU_CANTEENS.find(function (x) { return x.campus === eat.campus; });
    var cs = $('canteenSelect'); if (!cs) return;
    cs.innerHTML = '';
    if (!campus) { return; }
    campus.canteens.forEach(function (ct) {
      var o = document.createElement('option');
      o.value = ct.name; o.textContent = ct.name;
      cs.appendChild(o);
    });
    if (!eat.canteen || !campus.canteens.some(function (ct) { return ct.name === eat.canteen; })) {
      eat.canteen = campus.canteens[0] ? campus.canteens[0].name : '';
    }
    cs.value = eat.canteen;
    cs.onchange = function () { eat.canteen = cs.value; eat.window = ''; save(LS.eat, eat); renderWindowSelect(); renderDishGrid(); };
  }

  function renderWindowSelect() {
    var campus = SYSU_CANTEENS.find(function (x) { return x.campus === eat.campus; });
    var canteen = campus && campus.canteens.find(function (ct) { return ct.name === eat.canteen; });
    var ws = $('windowSelect'); if (!ws) return;
    ws.innerHTML = '<option value="">全部窗口</option>';
    if (canteen) {
      canteen.windows.forEach(function (w) {
        var o = document.createElement('option');
        o.value = w.name; o.textContent = w.name + ' (' + w.dishes.length + ')';
        ws.appendChild(o);
      });
    }
    ws.value = eat.window || '';
    ws.onchange = function () { eat.window = ws.value; save(LS.eat, eat); renderDishGrid(); };
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
      if (eat.canteen && ct.name !== eat.canteen) return;
      ct.windows.forEach(function (w) {
        if (eat.window && w.name !== eat.window) return;
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
    save(LS.eat, eat); renderDishGrid(); updateStats();
  }
  function updateSelectedCount() { $('selectedCount').textContent = eat.selected.length; }

  /* ================= 配餐 · 约束 ================= */
  function renderConstraints() {
    // 预算（数轴，分度 1 元）
    var br = $('budgetRange');
    br.value = eat.budget == null ? 0 : eat.budget;
    $('budgetVal').textContent = eat.budget == null ? '不限' : eat.budget + ' 元';
    br.oninput = function () { eat.budget = +br.value; $('budgetVal').textContent = eat.budget + ' 元'; save(LS.eat, eat); };
    $('btnBudgetUnlimited').onclick = function () { eat.budget = null; br.value = 0; $('budgetVal').textContent = '不限'; save(LS.eat, eat); };
    $('budgetCustom').oninput = function () { var v = +this.value; if (v > 0) { eat.budget = v; br.value = Math.min(30, v); $('budgetVal').textContent = v + ' 元'; save(LS.eat, eat); } };

    // 路上时间（数轴，分度 1 分钟）
    var tr = $('timeRange');
    tr.value = eat.timeLimit == null ? 30 : eat.timeLimit;
    $('timeVal').textContent = eat.timeLimit == null ? '不赶时间' : eat.timeLimit + ' 分钟';
    tr.oninput = function () { eat.timeLimit = +tr.value; $('timeVal').textContent = eat.timeLimit + ' 分钟'; save(LS.eat, eat); };
    $('btnTimeNoRush').onclick = function () { eat.timeLimit = null; tr.value = 30; $('timeVal').textContent = '不赶时间'; save(LS.eat, eat); };
    $('timeCustom').oninput = function () { var v = +this.value; if (v > 0) { eat.timeLimit = v; tr.value = Math.min(30, v); $('timeVal').textContent = v + ' 分钟'; save(LS.eat, eat); } };

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
      var why = '你练了' + state.duration + '分钟' + currentEx().name + '，' +
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

  /* ================= 体测急救站（全项目） ================= */
  // 评分表依据《国家学生体质健康标准(2014修订)》大学组整理（数值为参考，以学校执行为准）
  var FT = {
    male: {
      bmi: { normal: [17.9, 23.9], mild: [17.8, 27.9] },
      vital: { 100: 5040, 95: 4800, 90: 4550, 85: 4300, 80: 4050, 78: 3950, 76: 3850, 74: 3750, 72: 3650, 70: 3550, 68: 3450, 66: 3350, 64: 3250, 62: 3150, 60: 3100, 50: 2800, 40: 2500, 30: 2200, 20: 1900, 10: 1600 },
      run50: { 100: 6.7, 95: 6.8, 90: 6.9, 85: 7.0, 80: 7.1, 78: 7.2, 76: 7.3, 74: 7.4, 72: 7.5, 70: 7.6, 68: 7.7, 66: 7.8, 64: 7.9, 62: 8.0, 60: 8.1, 50: 8.4, 40: 8.7, 30: 9.0, 20: 9.3, 10: 9.6 },
      reach: { 100: 24.9, 95: 23.1, 90: 21.3, 85: 19.5, 80: 17.7, 78: 16.5, 76: 15.3, 74: 14.1, 72: 12.9, 70: 11.7, 68: 10.5, 66: 9.3, 64: 8.1, 62: 6.9, 60: 3.7, 50: 1.0, 40: -1.7, 30: -4.4, 20: -7.1, 10: -9.8 },
      jump: { 100: 273, 95: 268, 90: 263, 85: 258, 80: 253, 78: 248, 76: 243, 74: 238, 72: 233, 70: 228, 68: 223, 66: 218, 64: 213, 62: 208, 60: 203, 50: 193, 40: 183, 30: 173, 20: 163, 10: 153 },
      pullup: { 100: 19, 95: 18, 90: 17, 85: 16, 80: 15, 78: 14, 76: 13, 74: 12, 72: 11, 70: 10, 68: 9, 66: 8, 64: 7, 62: 6, 60: 5, 50: 4, 40: 3, 30: 2, 20: 1, 10: 0 },
      run: { 100: 197, 95: 202, 90: 207, 85: 214, 80: 222, 78: 227, 76: 232, 74: 237, 72: 242, 70: 247, 68: 252, 66: 257, 64: 262, 62: 267, 60: 272, 50: 292, 40: 312, 30: 332, 20: 352, 10: 372 },
    },
    female: {
      bmi: { normal: [17.2, 23.9], mild: [17.1, 27.9] },
      vital: { 100: 3400, 95: 3250, 90: 3100, 85: 2950, 80: 2800, 78: 2700, 76: 2600, 74: 2500, 72: 2400, 70: 2300, 68: 2200, 66: 2100, 64: 2000, 62: 1900, 60: 1850, 50: 1650, 40: 1450, 30: 1250, 20: 1050, 10: 850 },
      run50: { 100: 7.5, 95: 7.6, 90: 7.7, 85: 7.8, 80: 7.9, 78: 8.0, 76: 8.1, 74: 8.2, 72: 8.3, 70: 8.4, 68: 8.5, 66: 8.6, 64: 8.7, 62: 8.8, 60: 8.9, 50: 9.3, 40: 9.7, 30: 10.1, 20: 10.5, 10: 10.9 },
      reach: { 100: 25.8, 95: 24.0, 90: 22.2, 85: 20.4, 80: 18.6, 78: 17.4, 76: 16.2, 74: 15.0, 72: 13.8, 70: 12.6, 68: 11.4, 66: 10.2, 64: 9.0, 62: 7.8, 60: 6.0, 50: 3.5, 40: 1.0, 30: -1.5, 20: -4.0, 10: -6.5 },
      jump: { 100: 207, 95: 202, 90: 197, 85: 192, 80: 187, 78: 182, 76: 177, 74: 172, 72: 167, 70: 162, 68: 157, 66: 152, 64: 147, 62: 142, 60: 137, 50: 127, 40: 117, 30: 107, 20: 97, 10: 87 },
      situp: { 100: 52, 95: 50, 90: 48, 85: 46, 80: 44, 78: 43, 76: 42, 74: 41, 72: 40, 70: 39, 68: 38, 66: 37, 64: 36, 62: 34, 60: 32, 50: 28, 40: 24, 30: 20, 20: 16, 10: 12 },
      run: { 100: 198, 95: 204, 90: 210, 85: 217, 80: 224, 78: 229, 76: 234, 74: 239, 72: 244, 70: 249, 68: 254, 66: 259, 64: 264, 62: 269, 60: 274, 50: 284, 40: 294, 30: 304, 20: 314, 10: 324 },
    },
  };
  // 各项权重（《标准》总分加权）
  var FT_WEIGHT = { bmi: .15, vital: .15, run50: .20, reach: .10, jump: .10, strength: .10, run: .20 };
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
    updateBmi();
    $('ftHeight').addEventListener('input', updateBmi);
    $('ftWeight').addEventListener('input', updateBmi);
    $('btnFtDiagnose').addEventListener('click', diagnose);
    initPacer();
  }

  function updateBmi() {
    var h = +$('ftHeight').value || 175, w = +$('ftWeight').value || 65;
    var bmi = w / ((h / 100) * (h / 100));
    $('ftBmi').textContent = bmi.toFixed(1);
  }

  function scoreBmi(bmi, gender) {
    var t = FT[gender].bmi;
    if (bmi >= t.normal[0] && bmi <= t.normal[1]) return 100;
    if (bmi >= t.mild[0] && bmi <= t.mild[1]) return 80;
    return 60;
  }

  // ---------- 专项训练计划（引体/仰卧，4 周递进） ----------
  var PULLUP_PLAN = [
    { phase: '第1周 · 退让 + 悬垂', items: ['悬垂 3 组 × 20 秒', '退让引体（跳上慢下）3 组 × 3 次', '澳洲引体 3 组 × 6 次'] },
    { phase: '第2周 · 弹力带辅助', items: ['弹力带辅助引体 4 组 × 5 次', '悬垂 3 组 × 30 秒', '澳洲引体 3 组 × 8 次'] },
    { phase: '第3周 · 减带增次数', items: ['减一条弹力带引体 4 组 × 4 次', '退让引体 3 组 × 5 次', '划船 3 组 × 10 次'] },
    { phase: '第4周 · 冲标准引体', items: ['标准引体 4 组 × 尽量多', '辅助引体 2 组 × 6 次', '悬垂 2 组 × 40 秒'] },
  ];
  var SITUP_PLAN = [
    { phase: '第1周 · 基础卷腹', items: ['卷腹 3 组 × 15 次', '平板支撑 3 组 × 30 秒', '仰卧举腿 3 组 × 10 次'] },
    { phase: '第2周 · 加组数', items: ['卷腹 4 组 × 20 次', '平板支撑 3 组 × 45 秒', '俄罗斯转体 3 组 × 20 次'] },
    { phase: '第3周 · 计时冲刺', items: ['1 分钟仰卧起坐 2 组', '负重卷腹 3 组 × 15 次', '平板支撑 3 组 × 60 秒'] },
    { phase: '第4周 · 模拟测试', items: ['1 分钟仰卧起坐 3 组（计满）', '卷腹 2 组 × 25 次', '拉伸放松'] },
  ];
  function renderStrengthPlan(gender) {
    var plan = gender === 'male' ? PULLUP_PLAN : SITUP_PLAN;
    var name = gender === 'male' ? '引体向上' : '仰卧起坐';
    var html = '<div class="card"><h2><span class="icon">🎯</span> ' + name + ' · 专项训练计划（4 周递进）</h2>';
    plan.forEach(function (w) {
      html += '<h3>' + esc(w.phase) + '</h3><div class="seg">' + w.items.map(function (it) { return '<span class="pill">' + esc(it) + '</span>'; }).join('') + '</div>';
    });
    html += '</div>';
    return html;
  }

  // ---------- 全项目诊断 ----------
  function diagnose() {
    var gender = $('ftGender').value;
    var daysLeft = +$('ftDaysLeft').value || 12;
    var injury = $('ftInjury').value.trim();
    var table = FT[gender];
    var h = +$('ftHeight').value || 175, w = +$('ftWeight').value || 65;
    var bmi = w / ((h / 100) * (h / 100));
    var runSec = parseTime($('ftRunScore').value);
    var count = gender === 'male' ? (+$('ftPullup').value || 0) : (+$('ftSitup').value || 0);
    if (runSec == null) { toast('请正确填写耐力跑成绩，如 4:35'); return; }

    var items = [];
    items.push({ key: 'bmi', label: 'BMI', score: scoreBmi(bmi, gender), weight: FT_WEIGHT.bmi });
    if (+$('ftVital').value > 0) items.push({ key: 'vital', label: '肺活量', score: scoreFromTable(+$('ftVital').value, table.vital, false), weight: FT_WEIGHT.vital });
    if ($('ft50').value.trim()) items.push({ key: 'run50', label: '50米跑', score: scoreFromTable(parseFloat($('ft50').value), table.run50, true), weight: FT_WEIGHT.run50 });
    if ($('ftReach').value.trim()) items.push({ key: 'reach', label: '坐位体前屈', score: scoreFromTable(parseFloat($('ftReach').value), table.reach, false), weight: FT_WEIGHT.reach });
    if (+$('ftJump').value > 0) items.push({ key: 'jump', label: '立定跳远', score: scoreFromTable(+$('ftJump').value, table.jump, false), weight: FT_WEIGHT.jump });
    items.push({ key: 'strength', label: gender === 'male' ? '引体向上' : '仰卧起坐', score: scoreFromTable(count, gender === 'male' ? table.pullup : table.situp, false), weight: FT_WEIGHT.strength });
    items.push({ key: 'run', label: gender === 'male' ? '1000米' : '800米', score: scoreFromTable(runSec, table.run, true), weight: FT_WEIGHT.run });

    var total = 0, wsum = 0;
    items.forEach(function (x) { total += x.score * x.weight; wsum += x.weight; });
    total = wsum ? Math.round(total / wsum) : 0;

    var runScore = scoreFromTable(runSec, table.run, true);
    var strengthScore = scoreFromTable(count, gender === 'male' ? table.pullup : table.situp, false);
    var runGain = Math.max(0, scoreFromTable(Math.max(1, runSec - 10), table.run, true) - runScore);
    var strengthGain = Math.max(0, scoreFromTable(count + 2, gender === 'male' ? table.pullup : table.situp, false) - strengthScore);
    var focusRun = runGain >= strengthGain;
    var runItem = gender === 'male' ? '1000米' : '800米', strengthItem = gender === 'male' ? '引体向上' : '仰卧起坐';
    var plan = buildFtPlan({ daysLeft: daysLeft, runItem: runItem, strengthItem: strengthItem });

    var box = $('ftResult');
    var html = '<div class="card"><h2><span class="icon">📋</span> 全项目评分</h2>';
    html += '<div class="kpi-grid"><div class="kpi"><div class="v">' + total + '</div><div class="k">加权总分</div></div>' +
      '<div class="kpi"><div class="v">' + bmi.toFixed(1) + '</div><div class="k">BMI</div></div>' +
      '<div class="kpi"><div class="v">' + daysLeft + '天</div><div class="k">剩余时间</div></div>' +
      '<div class="kpi"><div class="v">' + (focusRun ? runItem : strengthItem) + '</div><div class="k">优先提升</div></div></div>';
    html += '<table style="margin-top:12px"><thead><tr><th>项目</th><th>得分</th><th>权重</th></tr></thead><tbody>';
    items.forEach(function (x) {
      var cls = x.score < 60 ? 'style="color:#fca5a5"' : x.score >= 80 ? 'style="color:#86efac"' : '';
      html += '<tr><td>' + esc(x.label) + '</td><td ' + cls + '>' + x.score + '</td><td>' + Math.round(x.weight * 100) + '%</td></tr>';
    });
    html += '</tbody></table></div>';

    html += '<div class="card"><h2><span class="icon">🎯</span> 提分诊断</h2>';
    html += '<div class="callout green">🎯 <b>先练这项：' + (focusRun ? runItem : strengthItem) + '</b><br>';
    if (focusRun) html += '当前 ' + runItem + ' ' + fmtSec(runSec) + '（约 ' + runScore + ' 分）。提 10 秒约 +' + runGain + ' 分。';
    else html += '当前 ' + strengthItem + ' ' + count + ' 个（约 ' + strengthScore + ' 分）。+2 个约 +' + strengthGain + ' 分，比 ' + runItem + ' 提 10 秒(+' + runGain + ' 分)更划算。';
    html += '</div>';
    if (injury) html += '<div class="callout">⚠️ 检测到「' + esc(injury) + '」：训练已自动降载/换项。</div>';
    html += '</div>';

    html += '<div class="card"><h2><span class="icon">🗓️</span> 未来 ' + daysLeft + ' 天计划（每天 15–25 分钟）</h2><div class="dish-list">';
    plan.forEach(function (d) {
      html += '<div class="dish-item" style="cursor:default"><span style="min-width:54px;font-weight:700">D' + d.day + '</span><span class="name">' + esc(d.focus) + '</span><span class="est">' + esc(d.detail) + '</span></div>';
    });
    html += '</div></div>';

    html += renderStrengthPlan(gender);
    box.innerHTML = html;
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

  // ---------- 配速器（独立卡片：目标成绩 → 分段 → 报时） ----------
  function initPacer() {
    $('btnPacerPlan').onclick = function () {
      var dist = +$('pacerDist').value || 1000;
      var t = parseTime($('pacerTarget').value);
      if (!t) { toast('请输入目标成绩，如 4:30'); return; }
      var seg = +$('pacerSeg').value || 200;
      var n = Math.ceil(dist / seg);
      var per = Math.round(t / n);
      var html = '<div class="seg">';
      for (var i = 1; i <= n; i++) html += '<span class="pill">' + (i * seg) + 'm · ' + fmtSec(per) + '</span>';
      html += '</div><p class="hint">目标 ' + fmtSec(t) + '，共 ' + n + ' 段，每段 ' + fmtSec(per) + '。点「开始报时」按分段叮声。</p>';
      $('pacerResult').innerHTML = html;
      window.__pacer = { per: per, n: n };
    };
    $('btnPacerStart').onclick = function () { startPacer2(); };
    $('btnPacerStop').onclick = function () { stopPacer2(); };
  }
  var pacerInt2 = null;
  function startPacer2() {
    var p = window.__pacer;
    if (!p) { toast('先点「生成分段」'); return; }
    var el = $('pacerClock'), segLeft = p.per, segIdx = 0;
    clearInterval(pacerInt2);
    el.textContent = '1/' + p.n + ' · ' + fmtSec(segLeft);
    beep(1);
    pacerInt2 = setInterval(function () {
      segLeft--;
      el.textContent = (segIdx + 1) + '/' + p.n + ' · ' + fmtSec(Math.max(0, segLeft));
      if (segLeft <= 0) {
        segIdx++;
        if (segIdx >= p.n) { clearInterval(pacerInt2); el.textContent = '完成 🎉'; beep(3); return; }
        segLeft = p.per; beep(2);
      }
    }, 1000);
  }
  function stopPacer2() { clearInterval(pacerInt2); var el = $('pacerClock'); if (el) el.textContent = '—'; }
  function beep(times) {
    try {
      var ctx = window.__ac || (window.__ac = new (window.AudioContext || window.webkitAudioContext)());
      for (var i = 0; i < times; i++) { (function (i) { setTimeout(function () { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = .3; o.start(); o.stop(ctx.currentTime + .12); }, i * 180); })(i); }
    } catch (e) {}
  }

  /* ================= 初始化 ================= */
  function renderDateTime() {
    var el = $('dateTime'); if (!el) return;
    var now = new Date();
    var w = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    el.textContent = now.toLocaleDateString('zh-CN') + ' 周' + w + ' ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function initManualAdd() {
    var btn = $('btnAddManual'); if (!btn) return;
    btn.onclick = function () {
      var inp = $('manualDish'); var nm = (inp.value || '').trim();
      if (!nm) { toast('请输入菜品名'); return; }
      if (eat.selected.indexOf(nm) < 0) eat.selected.push(nm);
      inp.value = '';
      save(LS.eat, eat); renderDishGrid(); updateStats();
      toast('已添加「' + nm + '」');
    };
  }

  async function init() {
    renderDateTime();
    initTabs(); initDrawer(); renderGoal(); renderExercise(); renderSource();
    renderCanteenTabs(); renderDishGrid(); renderConstraints(); initWeightInputs(); initUpload(); initPaceCalc(); initManualAdd();
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
