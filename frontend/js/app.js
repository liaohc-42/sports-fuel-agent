/* ============================================================
 * app.js —— 练完吃啥 前端主逻辑
 * 包含：标签路由 / 用户档案 / 练完吃啥(配餐) / 记录 / 原理数据
 *       / 智能教练 / 体测急救站
 * ============================================================ */
(function () {
  'use strict';

  /* ================= 状态与存储 ================= */
  var LS = {
    profile: 'sf_profile',
    meals: 'sf_meals',       // 就餐记录
    exercises: 'sf_exercises', // 运动记录
    spending: 'sf_spending', // 花销记录
  };

  function load(key, dft) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dft; }
    catch (e) { return dft; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  var profile = load(LS.profile, { gender: 'male', age: 19, height: 175, weight: 65, goal: '维持' });
  var meals = load(LS.meals, []);
  var exercises = load(LS.exercises, []);
  var spending = load(LS.spending, []);

  // 会话态
  var selectedDishes = [];        // {name, nutrition, price, estPrice, priceNote}
  var currentExercise = null;     // 顶级运动对象
  var currentChild = null;        // 子分支对象(可空)
  var currentIntensity = 'normal';
  var lastPlan = null;            // 最近一次生成的搭配

  function today() { return new Date().toISOString().slice(0, 10); }
  function fmtPrice(v) { return v == null ? '—' : ('¥' + (Number.isInteger(v) ? v : v.toFixed(1))); }

  /* ================= 工具 ================= */
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ================= 标签路由 ================= */
  function initTabs() {
    var btns = document.querySelectorAll('#tabs button[data-tab]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.tab === 'profile') { openDrawer(); return; }
        var id = b.dataset.tab;
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        document.querySelectorAll('.tab').forEach(function (s) { s.classList.remove('active'); });
        var sec = $('tab-' + id); if (sec) sec.classList.add('active');
        if (id === 'records') renderRecords();
        if (id === 'science') renderScience();
        if (id === 'fitness') { /* 体测页保留现场 */ }
        window.scrollTo({ top: 0 });
      });
    });
  }

  /* ================= 档案抽屉 ================= */
  function openDrawer() {
    $('pGender').value = profile.gender;
    $('pAge').value = profile.age;
    $('pHeight').value = profile.height;
    $('pWeight').value = profile.weight;
    $('pGoal').value = profile.goal;
    $('drawer').classList.add('open');
    $('drawerMask').classList.add('open');
  }
  function closeDrawer() {
    $('drawer').classList.remove('open');
    $('drawerMask').classList.remove('open');
  }
  function initDrawer() {
    $('drawerMask').addEventListener('click', closeDrawer);
    $('btnSaveProfile').addEventListener('click', function () {
      profile.gender = $('pGender').value;
      profile.age = +$('pAge').value || 19;
      profile.height = +$('pHeight').value || 175;
      profile.weight = +$('pWeight').value || 65;
      profile.goal = $('pGoal').value;
      save(LS.profile, profile);
      // 同步目标选择
      document.querySelectorAll('#goalSeg .pill').forEach(function (p) {
        p.classList.toggle('active', p.dataset.goal === profile.goal);
      });
      closeDrawer();
      refreshExerciseResult();
      toast('档案已保存 ✅');
    });
    $('btnResetData').addEventListener('click', function () {
      if (confirm('确定清空本地所有记录吗？此操作不可撤销。')) {
        localStorage.removeItem(LS.meals);
        localStorage.removeItem(LS.exercises);
        localStorage.removeItem(LS.spending);
        meals = []; exercises = []; spending = [];
        toast('已清空记录');
        renderRecords();
      }
    });
  }

  /* ================= 目标 ================= */
  function initGoal() {
    document.querySelectorAll('#goalSeg .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.goal === profile.goal);
      p.addEventListener('click', function () {
        document.querySelectorAll('#goalSeg .pill').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active');
        profile.goal = p.dataset.goal;
        save(LS.profile, profile);
        var hints = {
          '增肌': '增肌：高蛋白+热量盈余；练后 30–60 分钟内补充“碳水+蛋白”吸收最好。',
          '减脂': '减脂：高蛋白低脂+热量缺口；主食换玉米/杂粮，吃饱不挨饿。',
          '维持': '维持：均衡饮食即可，主食+优质蛋白+蔬菜各占一份。',
        };
        $('goalHint').textContent = hints[p.dataset.goal];
      });
    });
  }

  /* ================= 练完吃啥：运动 ================= */
  function buildExerciseSelect() {
    var sel = $('exerciseSelect');
    var groups = { '有氧': [], '无氧': [], '有氧+无氧': [], '柔韧': [] };
    EXERCISE.EXERCISES.forEach(function (e) {
      (groups[e.category] || (groups[e.category] = [])).push(e);
    });
    sel.innerHTML = '';
    Object.keys(groups).forEach(function (g) {
      if (!groups[g].length) return;
      var og = document.createElement('optgroup');
      og.label = g;
      groups[g].forEach(function (e) {
        var o = document.createElement('option');
        o.value = e.id; o.textContent = e.icon + ' ' + e.name;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    sel.addEventListener('change', onExerciseChange);
    onExerciseChange();
  }

  function onExerciseChange() {
    var id = $('exerciseSelect').value;
    currentExercise = EXERCISE.EXERCISES.find(function (e) { return e.id === id; });
    currentChild = null;

    // 子分支
    var sub = $('exerciseSubGroup');
    if (currentExercise.children && currentExercise.children.length) {
      sub.style.display = 'flex';
      sub.innerHTML = '';
      currentExercise.children.forEach(function (c) {
        var b = document.createElement('button');
        b.className = 'pill orange';
        b.textContent = c.icon + ' ' + c.name;
        b.dataset.cid = c.id;
        b.addEventListener('click', function () {
          currentChild = c;
          sub.querySelectorAll('.pill').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          refreshIntensityNote();
          refreshExerciseResult();
        });
        sub.appendChild(b);
      });
      currentChild = currentExercise.children[0];
      sub.querySelector('.pill').classList.add('active');
    } else {
      sub.style.display = 'none';
      sub.innerHTML = '';
    }

    // 强度
    currentIntensity = 'normal';
    var iseg = $('intensitySeg');
    iseg.innerHTML = '';
    currentExercise.intensities.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'pill' + (it.id === 'normal' ? ' active' : '');
      b.textContent = it.label;
      b.dataset.intensity = it.id;
      b.addEventListener('click', function () {
        currentIntensity = it.id;
        iseg.querySelectorAll('.pill').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        refreshIntensityNote();
        refreshExerciseResult();
      });
      iseg.appendChild(b);
    });
    refreshIntensityNote();
    refreshExerciseResult();
  }

  function currentMet() {
    if (!currentExercise) return 5;
    if (currentChild) {
      var factor = currentIntensity === 'easy' ? 0.8 : currentIntensity === 'fast' ? 1.25 : 1.0;
      return currentChild.met * factor;
    }
    var it = currentExercise.intensities.find(function (i) { return i.id === currentIntensity; }) || currentExercise.intensities[1];
    return it.met;
  }

  function refreshIntensityNote() {
    var note = '';
    if (currentChild) note = (currentChild.note || '') + ' · ';
    var it = currentExercise.intensities.find(function (i) { return i.id === currentIntensity; }) || currentExercise.intensities[1];
    note += (it.label + '：' + it.note);
    $('intensityNote').textContent = note;
  }

  function refreshExerciseResult() {
    var wrap = $('exerciseResult');
    var minutes = +$('durationRange').value || 0;
    var met = currentMet();
    var kcal = EXERCISE.calcKcal(met, profile.weight, minutes);
    var bmr = EXERCISE.calcBMR(profile.gender, profile.weight, profile.height, profile.age);
    var ti = EXERCISE.targetIntake(profile.goal, bmr, kcal);
    // 今日已吃（当前已选菜品）
    var eaten = selectedDishes.reduce(function (s, d) { return s + (d.nutrition ? d.nutrition.kcal : 0); }, 0);
    var gap = ti.target - eaten; // 正值=还可吃，负值=已超

    wrap.innerHTML =
      '<div class="kpi-grid">' +
      '<div class="kpi"><div class="v">' + kcal + '</div><div class="k">运动消耗(kcal)</div></div>' +
      '<div class="kpi"><div class="v">' + bmr + '</div><div class="k">基础代谢(kcal)</div></div>' +
      '<div class="kpi"><div class="v">' + ti.target + '</div><div class="k">建议摄入(kcal)</div></div>' +
      '<div class="kpi"><div class="v" style="color:' + (gap >= 0 ? 'var(--green-dark)' : 'var(--red)') + '">' + (gap >= 0 ? '+' : '') + gap + '</div><div class="k">今日热量缺口/盈余</div></div>' +
      '</div>' +
      '<p class="hint">' + (gap >= 0 ? '今日还可再摄入约 ' + gap + ' 千卡' : '今日已超出约 ' + (-gap) + ' 千卡，注意控制下一餐') + '（基于你已选菜品估算）。</p>';
  }

  /* ================= 练完吃啥：食堂 ================= */
  function initCanteen() {
    var campSel = $('campusSelect'), cantSel = $('canteenSelect'), winSel = $('windowSelect');
    campSel.innerHTML = '<option value="">请选择校区</option>';
    SYSU_CANTEENS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.campus; o.textContent = c.campus;
      campSel.appendChild(o);
    });
    campSel.addEventListener('change', function () {
      var campus = SYSU_CANTEENS.find(function (c) { return c.campus === campSel.value; });
      cantSel.innerHTML = '<option value="">请选择食堂</option>';
      winSel.innerHTML = '<option value="">请选择窗口/楼层</option>';
      $('dishList').innerHTML = '';
      $('canteenMeta').textContent = '';
      if (!campus) return;
      campus.canteens.forEach(function (ct) {
        var o = document.createElement('option');
        o.value = ct.name; o.textContent = ct.name;
        cantSel.appendChild(o);
      });
    });
    cantSel.addEventListener('change', function () {
      var campus = SYSU_CANTEENS.find(function (c) { return c.campus === campSel.value; });
      var canteen = campus && campus.canteens.find(function (c) { return c.name === cantSel.value; });
      winSel.innerHTML = '<option value="">全部窗口</option>';
      $('dishList').innerHTML = '';
      $('canteenMeta').textContent = '';
      if (!canteen) return;
      var nDish = 0, nPriced = 0;
      canteen.windows.forEach(function (w) {
        w.dishes.forEach(function () { nDish++; });
      });
      canteen.windows.forEach(function (w) {
        w.dishes.forEach(function (d) { if (d.price != null) nPriced++; });
        var o = document.createElement('option');
        o.value = w.name; o.textContent = w.name + ' (' + w.dishes.length + ')';
        winSel.appendChild(o);
      });
      $('canteenMeta').textContent = canteen.name + ' · ' + nDish + ' 道菜 · ' + nPriced + ' 道有标价 · 无标价按「自选/称重·参考价」估算';
    });
    winSel.addEventListener('change', renderDishList);
    $('btnAddManual').addEventListener('click', addManualDish);
    $('manualDishInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') addManualDish(); });
  }

  function currentWindowDishes() {
    var campSel = $('campusSelect'), cantSel = $('canteenSelect'), winSel = $('windowSelect');
    var campus = SYSU_CANTEENS.find(function (c) { return c.campus === campSel.value; });
    var canteen = campus && campus.canteens.find(function (c) { return c.name === cantSel.value; });
    if (!canteen) return [];
    var dishes = [];
    canteen.windows.forEach(function (w) {
      if (!winSel.value || w.name === winSel.value) {
        w.dishes.forEach(function (d) { dishes.push(d); });
      }
    });
    return dishes;
  }

  function renderDishList() {
    var box = $('dishList');
    var dishes = currentWindowDishes();
    if (!dishes.length) { box.innerHTML = '<div class="muted" style="padding:16px">请先选择校区 → 食堂 → 窗口</div>'; return; }
    var html = '<div class="search-bar"><input type="search" id="dishSearch" placeholder="🔍 搜索菜品…" oninput="window.__filterDish(this.value)" /></div>';
    html += '<div id="dishItems">' + dishes.map(function (d, i) {
      var checked = selectedDishes.some(function (s) { return s.name === d.name && s.window === d.window; });
      var priceHtml;
      if (d.price != null) priceHtml = '<span class="price">' + fmtPrice(d.price) + '</span>';
      else if (d.priceMin != null) priceHtml = '<span class="price">¥' + d.priceMin + '–' + d.priceMax + '</span>';
      else priceHtml = '<span class="est">参考 ¥' + d.estPrice + '</span>';
      return '<div class="dish-item" data-name="' + esc(d.name) + '" data-window="' + esc(d.window) + '">' +
        '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="window.__toggleDish(' + i + ')">' +
        '<span class="name">' + esc(d.name) + '</span>' + priceHtml + '</div>';
    }).join('') + '</div>';
    box.innerHTML = html;
    window.__curDishes = dishes;
  }

  window.__curDishes = [];
  window.__filterDish = function (kw) {
    var items = document.querySelectorAll('#dishItems .dish-item');
    kw = (kw || '').toLowerCase();
    items.forEach(function (it) {
      it.style.display = it.dataset.name.toLowerCase().includes(kw) ? '' : 'none';
    });
  };
  window.__toggleDish = function (i) {
    var d = window.__curDishes[i];
    if (!d) return;
    var idx = selectedDishes.findIndex(function (s) { return s.name === d.name && s.window === d.window; });
    if (idx >= 0) selectedDishes.splice(idx, 1);
    else {
      var n = NUTRITION.lookup(d.name);
      selectedDishes.push({ name: d.name, window: d.window, nutrition: n, price: d.price, estPrice: d.estPrice, priceNote: d.priceNote });
    }
    renderSelectedDishes();
    refreshExerciseResult();
  };

  function addManualDish() {
    var inp = $('manualDishInput');
    var name = inp.value.trim();
    if (!name) { toast('请输入菜品名'); return; }
    var n = NUTRITION.lookup(name);
    selectedDishes.push({ name: name, window: '手动添加', nutrition: n, price: null, estPrice: null, priceNote: '手动' });
    inp.value = '';
    renderSelectedDishes();
    refreshExerciseResult();
    toast('已添加「' + name + '」（营养数据按常识估算）');
  }

  function renderSelectedDishes() {
    var box = $('selectedDishes');
    $('selectedCount').textContent = selectedDishes.length + ' 项';
    box.innerHTML = selectedDishes.map(function (d, i) {
      return '<span class="chip">' + esc(d.name) +
        (d.price != null ? ' <b>' + fmtPrice(d.price) + '</b>' : '') +
        ' <a href="javascript:void(0)" style="color:var(--red);text-decoration:none" onclick="window.__removeDish(' + i + ')">✕</a></span>';
    }).join('') || '<span class="muted">还没有选择菜品，去上面勾选或手动添加吧。</span>';

    var t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    selectedDishes.forEach(function (d) { t.kcal += d.nutrition.kcal; t.protein += d.nutrition.protein; t.carbs += d.nutrition.carbs; t.fat += d.nutrition.fat; });
    var price = selectedDishes.reduce(function (s, d) { return s + (d.price != null ? d.price : (d.estPrice || 0)); }, 0);
    $('selectedTotal').innerHTML =
      '<div class="kpi"><div class="v">' + Math.round(t.kcal) + '</div><div class="k">热量 kcal</div></div>' +
      '<div class="kpi"><div class="v">' + Math.round(t.protein) + 'g</div><div class="k">蛋白质</div></div>' +
      '<div class="kpi"><div class="v">' + Math.round(t.carbs) + 'g</div><div class="k">碳水</div></div>' +
      '<div class="kpi"><div class="v">' + Math.round(t.fat) + 'g</div><div class="k">脂肪</div></div>';
  }
  window.__removeDish = function (i) {
    selectedDishes.splice(i, 1);
    renderSelectedDishes();
    refreshExerciseResult();
  };

  /* ================= 练完吃啥：约束 ================= */
  function initConstraints() {
    var budgetRange = $('budgetRange'), budgetVal = $('budgetVal');
    budgetRange.addEventListener('input', function () {
      budgetVal.textContent = budgetRange.value + ' 元';
      if (budgetRange.value === '0') budgetVal.textContent = '不限';
    });
    document.querySelectorAll('[data-budget]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('[data-budget]').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var custom = $('budgetCustom');
        if (b.dataset.budget === 'unlimited') { budgetRange.value = 0; budgetVal.textContent = '不限'; custom.style.display = 'none'; }
        else if (b.dataset.budget === 'custom') { custom.style.display = ''; budgetRange.disabled = false; }
      });
    });
    $('budgetCustom').addEventListener('input', function () {
      var v = +this.value;
      if (v > 0) { budgetRange.value = Math.min(30, Math.max(1, v)); budgetVal.textContent = v + ' 元'; }
    });

    var timeRange = $('timeRange'), timeVal = $('timeVal');
    timeRange.addEventListener('input', function () {
      timeVal.textContent = timeRange.value + ' 分钟';
      if (timeRange.value === '0') timeVal.textContent = '不限';
    });
    document.querySelectorAll('[data-time]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('[data-time]').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var custom = $('timeCustom');
        if (b.dataset.time === 'norush') { timeRange.value = 30; timeVal.textContent = '30 分钟'; custom.style.display = 'none'; }
        else if (b.dataset.time === 'custom') { custom.style.display = ''; }
      });
    });
    $('timeCustom').addEventListener('input', function () {
      var v = +this.value;
      if (v > 0) { timeRange.value = Math.min(30, Math.max(1, v)); timeVal.textContent = v + ' 分钟'; }
    });
  }

  /* ================= 生成搭配 ================= */
  function initGenerate() {
    $('btnGenerate').addEventListener('click', generatePlan);
    $('durationRange').addEventListener('input', function () {
      $('durationVal').textContent = this.value + ' 分钟';
      refreshExerciseResult();
    });
  }

  async function generatePlan() {
    if (!selectedDishes.length) { toast('请先勾选今天食堂的菜品'); return; }
    var btn = $('btnGenerate');
    var budget = +$('budgetRange').value === 0 ? null : +$('budgetRange').value;
    var time = +$('timeRange').value === 0 ? null : +$('timeRange').value;
    var minutes = +$('durationRange').value || 0;
    var met = currentMet();
    var exerciseKcal = EXERCISE.calcKcal(met, profile.weight, minutes);

    var payload = {
      type: 'meal',
      goal: profile.goal,
      weightKg: profile.weight,
      exercise: currentExercise ? currentExercise.name + (currentChild ? '·' + currentChild.name : '') : '',
      minutes: minutes,
      intensity: currentIntensity,
      exerciseKcal: exerciseKcal,
      budget: budget,
      timeLimit: time,
      dishes: selectedDishes.map(function (d) { return { name: d.name, nutrition: d.nutrition, price: d.price, estPrice: d.estPrice }; }),
    };

    // 1) 本地结构引擎：永远给出可靠的搭配（离线可用）
    var plan = API.generatePlanLocal(payload);
    lastPlan = plan;

    // 2) 调用 Agent 获得自然语言点评（后端可用时）
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> 正在生成…';
    var ai = null;
    try {
      var res = await API.callAgent(payload);
      if (res.text) ai = res.text;
    } catch (e) { ai = null; }
    btn.disabled = false;
    btn.innerHTML = '✨ 生成我的搭配';

    renderMealResult(plan, ai);
    $('mealResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderMealResult(plan, aiText) {
    var box = $('mealResult');
    var html = '<div class="card"><h2><span class="icon">🍱</span> 推荐搭配</h2>';
    html += '<div class="callout green">' + esc(plan.summary) + '</div>';
    if (aiText) html += '<div class="callout">🤖 AI 点评：' + esc(aiText) + '</div>';

    plan.combos.forEach(function (c, i) {
      var best = i === 0;
      html += '<div class="combo ' + (best ? 'best' : '') + '"><span class="combo-tag">' + (best ? '首选推荐' : '备选方案') + '</span>';
      html += '<div class="dishes">' + c.dishes.map(function (d) {
        var cls = d.label === 'good' ? 'good' : d.label === 'warn' ? 'warn' : 'bad';
        var tag = d.label === 'good' ? '推荐' : d.label === 'warn' ? '适量' : '少吃';
        return '<span class="chip ' + cls + '">' + esc(d.name) + ' · ' + tag + (d.price != null ? ' ' + fmtPrice(d.price) : '') + '</span>';
      }).join('') + '</div>';
      html += '<div class="kpi-grid">' +
        '<div class="kpi"><div class="v">' + c.totals.kcal + '</div><div class="k">热量 kcal</div></div>' +
        '<div class="kpi"><div class="v">' + c.totals.protein + 'g</div><div class="k">蛋白质</div></div>' +
        '<div class="kpi"><div class="v">' + c.totals.carbs + 'g</div><div class="k">碳水</div></div>' +
        '<div class="kpi"><div class="v">' + c.totals.fat + 'g</div><div class="k">脂肪</div></div></div>';
      html += '<div class="macro-bar"><span class="p" style="width:' + c.ratio.protein + '%"></span><span class="c" style="width:' + c.ratio.carbs + '%"></span><span class="f" style="width:' + c.ratio.fat + '%"></span></div>';
      html += '<div class="macro-legend"><span><i style="background:#3b82f6"></i>蛋白质 ' + c.ratio.protein + '%</span><span><i style="background:#f59e0b"></i>碳水 ' + c.ratio.carbs + '%</span><span><i style="background:#ef4444"></i>脂肪 ' + c.ratio.fat + '%</span></div>';
      if (c.price) html += '<p class="hint">预估合计 ' + c.price + ' 元</p>';
      if (c.alternatives.length) {
        html += '<h3>💡 替代建议</h3>';
        c.alternatives.forEach(function (a) { html += '<p class="hint">• ' + esc(a.dish) + ' → ' + esc(a.suggestion) + '</p>'; });
      }
      html += '</div>';
    });

    html += '<div class="grid2" style="margin-top:8px"><button class="btn btn-orange" onclick="window.__savePlan()">💾 记下这一餐</button><button class="btn btn-ghost" onclick="window.__editPlan()">✏️ 去记录里修改</button></div>';
    html += '</div>';
    box.innerHTML = html;
  }

  window.__savePlan = function () {
    if (!lastPlan) return;
    var dishes = lastPlan.combos[0].dishes.map(function (d) { return d.name; });
    meals.push({ date: today(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), dishes: dishes, kcal: lastPlan.combos[0].totals.kcal, price: lastPlan.combos[0].price });
    save(LS.meals, meals);
    // 花销
    if (lastPlan.combos[0].price) spending.push({ date: today(), amount: lastPlan.combos[0].price });
    save(LS.spending, spending);
    toast('已记录这一餐 ✅');
  };
  window.__editPlan = function () {
    document.querySelectorAll('#tabs button[data-tab]').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === 'records'); });
    document.querySelectorAll('.tab').forEach(function (s) { s.classList.remove('active'); });
    $('tab-records').classList.add('active');
    renderRecords();
    window.scrollTo({ top: 0 });
  };

  /* ================= 记录 ================= */
  function renderRecords() {
    renderRecordMeals();
    renderSpending();
    renderSportChart();
  }

  function renderRecordMeals() {
    var box = $('recordMeals');
    if (!meals.length) {
      box.innerHTML = '<p class="muted">还没有就餐记录。去「练完吃啥」生成并记下一餐吧。</p>';
      return;
    }
    var latest = meals[meals.length - 1];
    box.innerHTML = '<div class="callout green">最近一餐：' + esc(latest.date) + ' ' + esc(latest.time) + ' · ' + latest.kcal + ' kcal · ' + fmtPrice(latest.price) + '</div>' +
      '<div class="seg">' + latest.dishes.map(function (d, i) {
        return '<span class="chip">' + esc(d) + ' <a href="javascript:void(0)" style="color:var(--red);text-decoration:none" onclick="window.__removeMealDish(' + i + ')">✕</a></span>';
      }).join('') + '</div>' +
      '<div style="margin-top:10px"><input type="text" id="addMealDish" placeholder="加一个实际吃的菜，如：水煮蛋" /><button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="window.__addMealDish()">＋ 增加</button></div>';
  }
  window.__removeMealDish = function (i) {
    var m = meals[meals.length - 1];
    var removed = m.dishes.splice(i, 1);
    // 重新估算热量
    var kcal = m.dishes.reduce(function (s, d) { return s + NUTRITION.lookup(d).kcal; }, 0);
    m.kcal = Math.round(kcal);
    save(LS.meals, meals);
    renderRecordMeals();
    toast('已移除「' + removed[0] + '」');
  };
  window.__addMealDish = function () {
    var inp = $('addMealDish'); if (!inp) return;
    var name = inp.value.trim(); if (!name) return;
    var m = meals[meals.length - 1];
    m.dishes.push(name);
    m.kcal = Math.round(m.dishes.reduce(function (s, d) { return s + NUTRITION.lookup(d).kcal; }, 0));
    save(LS.meals, meals);
    renderRecordMeals();
    toast('已增加「' + name + '」');
  };

  function initRecords() {
    $('btnRegenerateAfter').addEventListener('click', async function () {
      if (!meals.length) { toast('还没有就餐记录'); return; }
      var latest = meals[meals.length - 1];
      var btn = this;
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> 分析中…';
      var res = await API.callAgent({ type: 'adjust', eatenKcal: latest.kcal, goal: profile.goal, weightKg: profile.weight });
      btn.disabled = false; btn.innerHTML = '🧠 让 AI 给我接下来的建议';
      $('aiAdjustResult').innerHTML = '<div class="callout">🤖 ' + esc(res.text) + '</div>';
    });

    $('btnBudgetAdvice').addEventListener('click', async function () {
      var budget = +$('budgetInput').value;
      if (!budget || budget < 300) { toast('请输入合理的月预算（≥300 元）'); return; }
      var pastAvg = spendingAvg();
      var res = await API.callAgent({ type: 'budget', budget: budget, pastAvg: pastAvg });
      $('budgetAdviceResult').innerHTML = '<div class="callout">🤖 ' + esc(res.text) + '</div>';
    });

    $('btnSportAdvice').addEventListener('click', async function () {
      var period = document.querySelector('#sportPeriodSeg .pill.active').dataset.period;
      var stat = sportStat(period);
      var res = await API.callAgent({ type: 'sport', period: period, totalMin: stat.min, totalKcal: stat.kcal, sessions: stat.sessions });
      $('sportAiAdvice').innerHTML = '<div class="callout">🤖 ' + esc(res.text) + '</div>';
    });

    document.querySelectorAll('#sportPeriodSeg .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        document.querySelectorAll('#sportPeriodSeg .pill').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active');
        renderSportChart();
      });
    });
  }

  function spendingAvg() {
    if (!spending.length) return 0;
    var sum = spending.reduce(function (s, d) { return s + d.amount; }, 0);
    return sum / spending.length;
  }
  function renderSpending() {
    var box = $('spendingStats');
    var total = spending.reduce(function (s, d) { return s + d.amount; }, 0);
    var n = spending.length;
    var avg = n ? total / n : 0;
    var estMonth = avg * 30;
    box.innerHTML = '<div class="kpi-grid">' +
      '<div class="kpi"><div class="v">' + n + '</div><div class="k">记录餐数</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(total) + '</div><div class="k">累计花销</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(avg) + '</div><div class="k">平均每餐</div></div>' +
      '<div class="kpi"><div class="v">¥' + Math.round(estMonth) + '</div><div class="k">预估月花销</div></div>' +
      '</div>';
  }

  function sportStat(period) {
    var now = new Date();
    var start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 6);
    else if (period === 'month') start.setDate(now.getDate() - 29);
    else start.setFullYear(now.getFullYear(), 0, 1);
    var list = exercises.filter(function (e) { return new Date(e.date) >= start; });
    return {
      min: list.reduce(function (s, e) { return s + e.minutes; }, 0),
      kcal: list.reduce(function (s, e) { return s + e.kcal; }, 0),
      sessions: list.length,
      list: list,
    };
  }

  function renderSportChart() {
    var box = $('sportChart');
    var period = (document.querySelector('#sportPeriodSeg .pill.active') || {}).dataset ? document.querySelector('#sportPeriodSeg .pill.active').dataset.period : 'week';
    if (!period) period = 'week';
    var now = new Date();
    var labels = [], buckets = [];
    var nBuckets, key;
    if (period === 'week') {
      nBuckets = 7;
      for (var i = 6; i >= 0; i--) {
        var d = new Date(now); d.setDate(now.getDate() - i);
        labels.push(['日', '一', '二', '三', '四', '五', '六'][d.getDay()]);
        key = d.toISOString().slice(0, 10); buckets.push({ key: key, min: 0, kcal: 0 });
      }
    } else if (period === 'month') {
      nBuckets = 30;
      for (var j = 29; j >= 0; j--) {
        var d2 = new Date(now); d2.setDate(now.getDate() - j);
        labels.push(d2.getDate() + '日');
        key = d2.toISOString().slice(0, 10); buckets.push({ key: key, min: 0, kcal: 0 });
      }
    } else {
      nBuckets = 12;
      for (var m = 0; m < 12; m++) {
        labels.push((m + 1) + '月');
        buckets.push({ key: now.getFullYear() + '-' + String(m + 1).padStart(2, '0'), min: 0, kcal: 0 });
      }
    }
    exercises.forEach(function (e) {
      var bk = period === 'year' ? e.date.slice(0, 7) : e.date;
      var b = buckets.find(function (x) { return x.key === bk; });
      if (b) { b.min += e.minutes; b.kcal += e.kcal; }
    });
    var maxMin = Math.max.apply(null, buckets.map(function (b) { return b.min; }).concat([1]));
    box.innerHTML = '<div class="bars">' + buckets.map(function (b, i) {
      var h = Math.round(b.min / maxMin * 100);
      return '<div class="bar" title="' + esc(labels[i]) + '：' + b.min + '分钟 / ' + b.kcal + 'kcal"><div class="val">' + b.min + '</div><div class="col" style="height:' + (h || 2) + '%"></div><div class="lab">' + esc(labels[i]) + '</div></div>';
    }).join('') + '</div>';
    box.innerHTML += '<div class="macro-legend" style="margin-top:8px"><span>📊 柱高 = 运动时长（分钟），悬停查看详情</span></div>';
  }

  /* ================= 原理与数据 ================= */
  var REFS = [
    { t: '《中国居民膳食指南（2022）》', d: '中国营养学会，人民卫生出版社 —— 每日宏量营养素、食物多样、少盐少油的核心依据。' },
    { t: '《中国食物成分表（标准版 第6版）》', d: '北京大学医学出版社 —— 常见菜品热量与三大营养素数值来源。' },
    { t: '《国家学生体质健康标准（2014年修订）》', d: '教育部 —— 体测急救站评分表与耐力/力量项目标准的依据。' },
    { t: '《运动营养学》', d: '人民体育出版社 —— 增肌/减脂期蛋白质摄入、练后补充窗口等建议依据。' },
    { t: 'Compendium of Physical Activities (2011)', d: 'Ainsworth 等 —— MET 代谢当量与运动热量计算依据。' },
    { t: 'Mifflin-St Jeor 公式', d: '基础代谢率(BMR)估算的常用公式。' },
  ];
  var SOURCES = [
    { t: '食堂菜单/价格', d: '来自《中山大学食堂菜单价格明细表》(647 道菜，覆盖广州南/北/东、珠海、深圳五校区)。无标价菜品按「自选/称重·参考价」估算，可由用户/开发者后台手动更新。' },
    { t: '菜品营养数据', d: '优先匹配本地营养库（参考《中国食物成分表》）；未收录菜品按分类常识估算并标注「估算值」；配置后端后可由大模型进一步估算。' },
    { t: '运动热量', d: '基于 MET × 3.5 × 体重 / 200 × 分钟 计算，强度参考 MET 区间。' },
    { t: '数据来源说明', d: '食堂原始数据标注了出处（如「中大饮食公众号」「松涛园实测」「食在中大」等），可在数据表中追溯。' },
  ];

  function renderScience() {
    $('refList').innerHTML = REFS.map(function (r) { return '<li><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></li>'; }).join('');
    $('dataSourceList').innerHTML = SOURCES.map(function (r) { return '<div class="callout green" style="margin-bottom:8px"><b>' + esc(r.t) + '</b><br>' + esc(r.d) + '</div>'; }).join('');
    var st = API.getState();
    $('devConfigNote').innerHTML = '当前模式：<b>' + esc(st.backendReason) + '</b>。<br>' +
      '① 在 <code>backend/.env</code> 或 Vercel 环境变量中填 <code>GLM_API_KEY</code>（智谱 GLM-4-Flash，免费）；<br>' +
      '② 把 <code>frontend/js/api.js</code> 顶部的 <code>API_BASE</code> 改成你的后端地址；<br>' +
      '③ 未填写 Key 时自动使用本地规则引擎，无需联网、无需付费，答辩现场最稳妥。';
  }

  /* ================= 智能教练 ================= */
  function initCoach() {
    appendMsg('ai', '你好！我是练完吃啥的智能健身教练 🤖\n运动训练、食堂饮食搭配、减脂增肌、体测提分都能问我。');
    function send() {
      var inp = $('coachInput');
      var q = inp.value.trim();
      if (!q) return;
      appendMsg('user', q);
      inp.value = '';
      var typing = appendMsg('ai', '…');
      API.callAgent({ type: 'coach', question: q }).then(function (res) {
        typing.textContent = res.text;
      });
    }
    $('btnCoachSend').addEventListener('click', send);
    $('coachInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  }
  function appendMsg(role, text) {
    var box = $('coachChat');
    var d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
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

  function parseTime(s) {
    var m = /^(\d+)[:：分](\d{1,2})/.exec((s || '').trim());
    if (!m) return null;
    return (+m[1]) * 60 + (+m[2]);
  }
  // 分数插值（run: 数值越小越好；count: 越大越好）
  function scoreFromTable(val, table, lowerBetter) {
    var points = Object.keys(table).map(Number).sort(function (a, b) { return b - a; });
    if (lowerBetter ? val <= table[100] : val >= table[100]) return 100;
    if (lowerBetter ? val >= table[10] : val <= table[10]) return 10;
    for (var i = 0; i < points.length - 1; i++) {
      var hi = points[i], lo = points[i + 1];
      var hiV = table[hi], loV = table[lo];
      if (lowerBetter ? (val >= hiV && val <= loV) : (val <= hiV && val >= loV)) {
        var ratio = (val - hiV) / (loV - hiV);
        return Math.round(hi + (lo - hi) * ratio);
      }
    }
    return 10;
  }

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
    var gender = $('ftGender').value;
    var daysLeft = +$('ftDaysLeft').value || 12;
    var daysPerWeek = +$('ftDaysPerWeek').value || 5;
    var injury = $('ftInjury').value.trim();
    var runSec = parseTime($('ftRunScore').value);
    var count = gender === 'male' ? (+$('ftPullup').value || 0) : (+$('ftSitup').value || 0);
    if (runSec == null) { toast('请正确填写成绩，格式如 4:35'); return; }

    var table = FT[gender];
    var runScore = scoreFromTable(runSec, table.run, true);
    var strengthScore = scoreFromTable(count, gender === 'male' ? table.pullup : table.situp, false);

    // 提分性价比：估算各项目“单位努力”的提分
    var runGain = (function () {
      // 快 10 秒能加多少分
      var s1 = scoreFromTable(runSec, table.run, true);
      var s2 = scoreFromTable(Math.max(1, runSec - 10), table.run, true);
      return Math.max(0, s2 - s1);
    })();
    var strengthGain = (function () {
      var s1 = scoreFromTable(count, gender === 'male' ? table.pullup : table.situp, false);
      var s2 = scoreFromTable(count + 2, gender === 'male' ? table.pullup : table.situp, false);
      return Math.max(0, s2 - s1);
    })();
    var focusRun = runGain >= strengthGain;

    var weakness = runScore < 60 ? '耐力跑' : (strengthScore < 60 ? (gender === 'male' ? '引体向上' : '仰卧起坐') : '无短板，保持即可');
    var runItem = gender === 'male' ? '1000米' : '800米';
    var strengthItem = gender === 'male' ? '引体向上' : '仰卧起坐';

    // 生成 7 天计划
    var plan = buildFtPlan({ gender: gender, daysLeft: daysLeft, daysPerWeek: daysPerWeek, injury: injury, focusRun: focusRun, runItem: runItem, strengthItem: strengthItem });

    // 目标配速（成绩提升 5%）
    var targetSec = Math.round(runSec * 0.95);
    var per200 = Math.round(targetSec / (gender === 'male' ? 5 : 4)); // 1000m=5×200m, 800m=4×200m

    var box = $('ftResult');
    var html = '<div class="card"><h2><span class="icon">📋</span> 提分诊断</h2>';
    html += '<div class="kpi-grid">' +
      '<div class="kpi"><div class="v">' + runScore + '</div><div class="k">' + runItem + '得分</div></div>' +
      '<div class="kpi"><div class="v">' + strengthScore + '</div><div class="k">' + strengthItem + '得分</div></div>' +
      '<div class="kpi"><div class="v">' + Math.max(runScore, strengthScore) + '</div><div class="k">当前最高分</div></div>' +
      '<div class="kpi"><div class="v">' + daysLeft + '天</div><div class="k">剩余时间</div></div></div>';

    html += '<div class="callout green">🎯 <b>先练这项：' + (focusRun ? runItem : strengthItem) + '</b><br>';
    if (focusRun) html += '当前 ' + runItem + ' ' + $('ftRunScore').value + '（约 ' + runScore + ' 分）。提升 10 秒约 +' + runGain + ' 分，而 ' + strengthItem + ' +2 个约 +' + strengthGain + ' 分——' + (runGain >= strengthGain ? '先攻耐力跑性价比更高' : '注意：力量单项反而更划算，见下') + '。';
    else html += '当前 ' + strengthItem + ' ' + count + ' 个（约 ' + strengthScore + ' 分）。+2 个约 +' + strengthGain + ' 分，比 ' + runItem + ' 提 10 秒(+' + runGain + ' 分)更划算——优先练' + strengthItem + '。';
    html += '</div>';
    if (injury) html += '<div class="callout">⚠️ 检测到伤病/限制「' + esc(injury) + '」：训练已自动降载/换项，动作见下方计划。疼痛持续或 >3/10 建议就医，不要硬练。</div>';

    // 7 天计划
    html += '<h3>🗓️ 未来 ' + daysLeft + ' 天计划（每天 15–25 分钟）</h3><div class="dish-list">';
    plan.forEach(function (d) {
      html += '<div class="dish-item" style="cursor:default"><span style="min-width:54px;font-weight:700">D' + d.day + '</span><span class="name">' + esc(d.focus) + '</span><span class="est">' + esc(d.detail) + '</span></div>';
    });
    html += '</div>';

    // 今日训练（带计时器）
    var today = plan[0];
    html += '<h3 style="margin-top:14px">🏋️ 今日训练（' + esc(today.focus) + '）</h3>';
    html += '<div id="ftToday"></div>';

    // 配速器
    html += '<h3 style="margin-top:14px">⏱️ 配速器（目标 ' + fmtSec(targetSec) + '，每 200 米 ' + fmtSec(per200) + '）</h3>';
    html += '<div id="ftPacer"></div>';

    // 打卡调载
    html += '<h3 style="margin-top:14px">📝 今日打卡与调载</h3>';
    html += '<div class="seg" style="margin-bottom:8px">' +
      '<button class="pill" onclick="window.__ftCheckin(\'done\')">✅ 完成</button>' +
      '<button class="pill" onclick="window.__ftCheckin(\'tired\')">😮‍💨 太累</button>' +
      '<button class="pill" onclick="window.__ftCheckin(\'pain\')">🩹 疼痛</button>' +
      '<button class="pill" onclick="window.__ftCheckin(\'busy\')">⏰ 没时间</button></div>';
    html += '<div id="ftCheckinMsg"></div>';
    html += '</div>';
    box.innerHTML = html;

    renderFtToday(today, injury);
    renderPacer(per200, targetSec);
    window.__ftData = { gender: gender, injury: injury, today: today, plan: plan };
  }

  function fmtSec(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + String(r).padStart(2, '0'); }

  function buildFtPlan(o) {
    var plan = [];
    var daysLeft = o.daysLeft, daysPerWeek = o.daysPerWeek;
    var runDays = [], strDays = [];
    // 分配训练日：耐力跑与力量交替，考前 3 天减量
    for (var i = 1; i <= daysLeft; i++) {
      var rest = i % (Math.floor(7 / Math.max(1, daysPerWeek)) + 1) === 0;
      var taper = i > daysLeft - 3; // 考前3天减量
      if (taper) {
        plan.push({ day: i, focus: '减量恢复', detail: '轻松慢跑 10 分钟 + 拉伸，保持状态' });
      } else if (i % 2 === 1) {
        plan.push({ day: i, focus: o.runItem + ' 间歇', detail: (o.focusRun ? '' : '轻量') + ' 400m×4 组，组间走 200m' });
      } else {
        plan.push({ day: i, focus: o.strengthItem + ' 专项', detail: o.strengthItem + '退让/辅助训练 3 组' });
      }
    }
    return plan;
  }

  function renderFtToday(today, injury) {
    var box = $('ftToday');
    var acts;
    if (today.focus.indexOf('减量') >= 0) {
      acts = [{ name: '轻松慢跑', sec: 600 }, { name: '全身拉伸', sec: 300 }];
    } else if (today.focus.indexOf('间歇') >= 0 || today.focus.indexOf('米') >= 0) {
      acts = injury && /膝|腿/.test(injury)
        ? [{ name: '快走热身', sec: 300 }, { name: '臀桥(替代深蹲)', sec: 180 }, { name: '死虫式', sec: 180 }]
        : [{ name: '快走+慢跑热身', sec: 300 }, { name: '400m×4 间歇', sec: 480 }, { name: '拉伸放松', sec: 300 }];
    } else {
      acts = [{ name: '专项动作 3 组(退让/辅助)', sec: 600 }, { name: '拉伸放松', sec: 300 }];
    }
    var html = acts.map(function (a, i) {
      return '<div class="dish-item" style="cursor:default"><span>' + esc(a.name) + '</span><span class="est">' + Math.round(a.sec / 60) + ' 分钟</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="window.__startTimer(' + a.sec + ', ' + i + ', \'' + esc(a.name) + '\')">▶ 计时</button></div>';
    }).join('');
    html += '<div class="timer-big" id="ftTimer" style="margin-top:10px">—</div>';
    box.innerHTML = html;
    window.__timerInt = null;
  }

  window.__startTimer = function (sec, idx, name) {
    var el = $('ftTimer');
    var left = sec;
    clearInterval(window.__timerInt);
    el.textContent = fmtSec(left);
    window.__timerInt = setInterval(function () {
      left--;
      el.textContent = fmtSec(Math.max(0, left));
      if (left <= 0) { clearInterval(window.__timerInt); beep(3); el.textContent = '完成！🎉'; }
    }, 1000);
    beep(1);
  };

  function renderPacer(per200, targetSec) {
    var box = $('ftPacer');
    box.innerHTML = '<div class="pacer-big" id="pacerClock">' + fmtSec(per200) + '</div>' +
      '<div class="grid3" style="margin-top:8px">' +
      '<button class="btn btn-primary btn-sm" onclick="window.__startPacer(' + per200 + ')">▶ 开始报时</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="window.__stopPacer()">⏹ 停止</button>' +
      '<div style="display:flex;align-items:center;justify-content:center"><span class="muted">每 200 米响铃</span></div></div>' +
      '<p class="hint">目标成绩 ' + fmtSec(targetSec) + '。不依赖 GPS，操场/跑步机都能用。</p>';
  }
  window.__pacerInt = null;
  window.__startPacer = function (per200) {
    var el = $('pacerClock');
    var left = per200;
    clearInterval(window.__pacerInt);
    el.textContent = fmtSec(left);
    beep(1);
    window.__pacerInt = setInterval(function () {
      left--;
      el.textContent = fmtSec(Math.max(0, left));
      if (left <= 0) { left = per200; beep(2); }
    }, 1000);
  };
  window.__stopPacer = function () { clearInterval(window.__pacerInt); $('pacerClock').textContent = '—'; };

  window.__ftCheckin = function (type) {
    var box = $('ftCheckinMsg');
    var msg = {
      done: '✅ 打卡成功！今天按计划完成，明天继续保持节奏，记得多喝水和睡够。',
      tired: '😮‍💨 已降载：今天训练强度减半（时长砍 1/2），明天恢复正常。疲劳是信号，休息也是训练的一部分。',
      pain: '🩹 已换项：疼痛部位相关动作替换为臀桥/死虫等无冲击动作。若疼痛评分 >3/10 或持续，请停止训练并就医。',
      busy: '⏰ 已压缩：今天只做 8 分钟核心微训练（平板 3 组×40 秒），明天补上耐力。',
    }[type];
    box.innerHTML = '<div class="callout green">' + msg + '</div>';
  };

  /* ================= 声音（Web Audio） ================= */
  function beep(times) {
    try {
      var ctx = window.__audioCtx || (window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      for (var i = 0; i < times; i++) {
        (function (i) {
          setTimeout(function () {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880; g.gain.value = 0.3;
            o.start(); o.stop(ctx.currentTime + 0.12);
          }, i * 180);
        })(i);
      }
    } catch (e) { /* 无音频环境时静默 */ }
  }

  /* ================= 初始化 ================= */
  async function init() {
    initTabs();
    initDrawer();
    initGoal();
    buildExerciseSelect();
    initCanteen();
    initConstraints();
    initGenerate();
    initRecords();
    initCoach();
    initFitness();
    renderSelectedDishes();
    refreshExerciseResult();

    // 后端状态检测
    $('backendStatusText').textContent = '检测中…';
    var online = await API.checkBackend();
    var st = $('backendStatus');
    st.classList.toggle('off', !online);
    $('backendStatusText').textContent = online ? '已连接 Agent' : '本地引擎(免费)';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
