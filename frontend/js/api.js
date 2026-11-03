/* ============================================================
 * api.js —— 后端通信 + 本地规则引擎（免费/离线兜底）
 *
 * 架构说明：
 *  - 前端是纯静态页面（GitHub Pages 托管），无任何密钥。
 *  - 若后端(Express/Vercel)已部署且配置了 GLM_API_KEY，
 *    callAgent 会把请求转发给后端 → 后端调用 GLM-4-Flash。
 *  - 若后端不可达 / 未配置 Key，自动降级为本地规则引擎，
 *    保证答辩现场离线也能完整演示（一键即用）。
 * ============================================================ */
(function () {
  'use strict';

  // ★ 后端地址（已部署到 Vercel）。留空 = 永远使用本地引擎。
  //   注意：国内直连 *.vercel.app 可能被墙；前端有超时保护，连不上会自动降级本地引擎。
  var API_BASE = 'https://sports-fuel-agent-backend.vercel.app';

  var state = {
    backendOnline: false,
    backendReason: '本地引擎',
  };

  function setApiBase(url) { API_BASE = url; }

  function checkBackend() {
    return new Promise(function (resolve) {
      if (!API_BASE) { state.backendOnline = false; state.backendReason = '本地引擎'; resolve(false); return; }
      var t = setTimeout(function () { state.backendOnline = false; state.backendReason = '后端超时→本地引擎'; resolve(false); }, 3000);
      fetch(API_BASE + '/api/health', { signal: AbortSignal.timeout(3000) }).then(function (r) { return r.json(); }).then(function (j) {
        clearTimeout(t);
        state.backendOnline = !!(j && j.ok);
        state.backendReason = state.backendOnline ? (j.model || '已连接后端') : '本地引擎';
        resolve(state.backendOnline);
      }).catch(function () {
        clearTimeout(t);
        state.backendOnline = false;
        state.backendReason = '后端不可达→本地引擎';
        resolve(false);
      });
    });
  }

  // 填入即用：Agent Key 只存在本机浏览器 localStorage，随请求发给后端
  var KEY_STORE = 'sf_agent_key';
  function getAgentKey() {
    try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; }
  }
  function setAgentKey(k) {
    try { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE); } catch (e) {}
  }
  function hasAgentKey() { return !!getAgentKey(); }

  // 调用后端 Agent（失败自动回退本地）
  // payload: { type: 'meal'|'coach'|'adjust'|'budget'|'sport', ... }
  async function callAgent(payload) {
    // 注入用户在页面里粘贴的 Key（若已填）
    var k = getAgentKey();
    if (k) payload.agentKey = k;
    if (API_BASE) {
      try {
        var r = await fetch(API_BASE + '/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000),
        });
        var j = await r.json();
        if (j && j.ok && j.text) {
          return { text: j.text, engine: j.engine || 'GLM-4-Flash' };
        }
      } catch (e) { /* 网络失败/超时 → 本地 */ }
    }
    return localDispatch(payload);
  }

  // 本地兜底分发
  function localDispatch(payload) {
    var type = payload && payload.type;
    if (type === 'meal') return { text: '', engine: '本地引擎', local: generatePlanLocal(payload) };
    if (type === 'coach') return { text: localCoachAnswer(payload.question), engine: '本地引擎' };
    if (type === 'adjust') return { text: localAdjustAnswer(payload), engine: '本地引擎' };
    if (type === 'budget') return { text: localBudgetAnswer(payload), engine: '本地引擎' };
    if (type === 'sport') return { text: localSportAnswer(payload), engine: '本地引擎' };
    return { text: '（本地引擎）', engine: '本地引擎' };
  }

  /* ---------------- 本地配餐引擎 ---------------- */
  // 计算三大营养素供能比
  function macroRatio(t) {
    var p = t.protein * 4, c = t.carbs * 4, f = t.fat * 9;
    var sum = p + c + f || 1;
    return { protein: p / sum, carbs: c / sum, fat: f / sum };
  }

  // 单个菜品打标签（推荐/适量/少吃）
  function labelDish(goal, n) {
    var ratio = macroRatio(n);
    if (goal === '增肌') {
      if (ratio.protein >= 0.3 && ratio.fat <= 0.4) return 'good';
      if (ratio.fat >= 0.55 || (ratio.carbs >= 0.6 && ratio.protein < 0.15)) return 'bad';
      return 'warn';
    }
    if (goal === '减脂') {
      if (ratio.protein >= 0.25 && ratio.fat <= 0.32) return 'good';
      if (ratio.fat >= 0.45 || (ratio.carbs >= 0.62 && ratio.protein < 0.12)) return 'bad';
      return 'warn';
    }
    // 维持
    if (ratio.fat <= 0.35 && ratio.protein >= 0.15) return 'good';
    if (ratio.fat >= 0.5) return 'bad';
    return 'warn';
  }

  // 替代建议（关键词 → 更好选择）
  var ALT_RULES = [
    { kw: ['米饭', '白米饭'], sug: '把白米饭换成玉米/杂粮饭/紫薯，血糖更稳、饱腹感更强' },
    { kw: ['炒饭', '炒面', '炒粉'], sug: '炒饭炒面油多，换成汤面或白米饭+青菜' },
    { kw: ['红烧肉', '猪脚', '烧肉', '叉烧', '卤肉', '扣肉'], sug: '油脂偏高，换成清蒸鱼/白切鸡/卤蛋/豆腐' },
    { kw: ['炸', '锅包', '里脊', '糖醋'], sug: '油炸类换成清蒸/白灼/清炒做法' },
    { kw: ['奶茶', '糖水', '甜品', '双皮奶', '果汁'], sug: '含糖饮品换成无糖豆浆/黑咖啡/白水/水果' },
    { kw: ['麻辣烫', '麻辣香锅', '水煮'], sug: '选清汤底、少放酱料，多夹青菜和豆制品' },
    { kw: ['鸡公煲', '大盘鸡'], sug: '重油重辣，可去皮、撇油，搭配青菜' },
  ];
  function suggestAlternative(name) {
    for (var i = 0; i < ALT_RULES.length; i++) {
      var r = ALT_RULES[i];
      for (var j = 0; j < r.kw.length; j++) {
        if (name.indexOf(r.kw[j]) >= 0) return r.sug;
      }
    }
    return null;
  }

  // 生成 2 种搭配
  function generatePlanLocal(payload) {
    var goal = payload.goal || '维持';
    var dishes = payload.dishes || []; // [{name, nutrition, price, estPrice}]
    var budget = payload.budget; // null = 不限
    var targets = NUTRITION.targetMacros(goal, payload.weightKg || 60);
    var perMeal = { kcal: Math.round(targets.kcal / 3), protein: Math.round(targets.protein / 3), carbs: Math.round(targets.carbs / 3), fat: Math.round(targets.fat / 3) };

    // 给每个菜打分
    var scored = dishes.map(function (d) {
      var n = d.nutrition;
      var label = labelDish(goal, n);
      var p = d.price != null ? d.price : d.estPrice;
      var score = 0;
      if (label === 'good') score = 100;
      else if (label === 'warn') score = 50;
      else score = 10;
      // 增肌偏好多蛋白质；减脂偏好低脂
      var ratio = macroRatio(n);
      if (goal === '增肌') score += ratio.protein * 40;
      if (goal === '减脂') score += (1 - ratio.fat) * 30;
      return { name: d.name, nutrition: n, label: label, score: score, price: p, cat: n.cat || NUTRITION.inferCat(d.name) };
    });

    // 选组合：尽量凑齐 主食 + 蛋白 + 蔬菜，且在预算内
    function pickCombo(pool, budgetLimit, avoidCat) {
      var byCat = { 主食: [], 蛋白: [], 蔬菜: [], 其他: [] };
      pool.forEach(function (d) {
        var c = d.cat;
        var key = (c === '主食') ? '主食' : (c === '蛋白' || c === '烧腊' || c === '热菜' || c === '套餐') ? '蛋白' : (c === '蔬菜') ? '蔬菜' : '其他';
        byCat[key].push(d);
      });
      ['主食', '蛋白', '蔬菜', '其他'].forEach(function (k) { byCat[k].sort(function (a, b) { return b.score - a.score; }); });
      var picked = [];
      var used = {};
      function add(arr) {
        for (var i = 0; i < arr.length; i++) {
          if (used[arr[i].name]) continue;
          if (budgetLimit != null) {
            var sum = picked.reduce(function (s, x) { return s + (x.price || 0); }, 0);
            if (sum + (arr[i].price || 0) > budgetLimit + 0.5) continue;
          }
          if (picked.length >= 4) break;
          picked.push(arr[i]); used[arr[i].name] = true; break;
        }
      }
      if (avoidCat !== '主食') add(byCat['主食']);
      add(byCat['蛋白']);
      add(byCat['蔬菜']);
      if (picked.length < 3) add(byCat['其他']);
      return picked;
    }

    var combo1 = pickCombo(scored, budget, null);
    // 组合2：排除组合1的主食/主菜做备选
    var combo2 = pickCombo(scored.filter(function (d) { return combo1.every(function (c) { return c.name !== d.name; }); }), budget, null);

    function summarize(combo) {
      var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      combo.forEach(function (d) { totals.kcal += d.nutrition.kcal; totals.protein += d.nutrition.protein; totals.carbs += d.nutrition.carbs; totals.fat += d.nutrition.fat; });
      var ratio = macroRatio(totals);
      var price = combo.reduce(function (s, d) { return s + (d.price || 0); }, 0);
      var alts = combo.filter(function (d) { return d.label === 'bad' || d.label === 'warn'; })
        .map(function (d) { var s = suggestAlternative(d.name); return s ? { dish: d.name, suggestion: s } : null; })
        .filter(Boolean);
      return {
        dishes: combo.map(function (d) { return { name: d.name, label: d.label, kcal: d.nutrition.kcal, price: d.price }; }),
        totals: { kcal: Math.round(totals.kcal), protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fat: Math.round(totals.fat) },
        ratio: { protein: Math.round(ratio.protein * 100), carbs: Math.round(ratio.carbs * 100), fat: Math.round(ratio.fat * 100) },
        price: Math.round(price), alternatives: alts,
      };
    }

    var c1 = summarize(combo1.length ? combo1 : scored.slice(0, 3));
    var c2 = summarize(combo2.length ? combo2 : (scored[1] ? [scored[1], scored[2]] : []));
    return {
      combos: [c1, c2],
      perMealTarget: perMeal,
      goal: goal,
      summary: goal === '增肌' ? '增肌期优先补充蛋白质，主食别省，练后 30–60 分钟内进食吸收更好。'
        : goal === '减脂' ? '减脂期控油控糖、保证蛋白质，主食可选玉米/杂粮，吃饱不挨饿。'
        : '维持期均衡即可，主食+优质蛋白+蔬菜各占一份。',
    };
  }

  /* ---------------- 本地健身教练 ---------------- */
  function localCoachAnswer(q) {
    q = String(q || '');
    if (/减脂|减肥|瘦/.test(q)) return '减脂核心是“热量缺口+保蛋白”。建议：①主食减 1/3 或换玉米/杂粮；②每顿都有优质蛋白(鸡/鱼/蛋/豆腐)；③少油炸、少含糖饮料；④每周 3–5 次有氧+2 次力量。别饿肚子，容易反弹。\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
    if (/增肌|长肌肉|变壮/.test(q)) return '增肌三要素：练(渐进超负荷)、吃(热量盈余+蛋白质 1.6–2g/kg)、睡(7–8 小时)。练后 30–60 分钟内补充“碳水+蛋白”，比如鸡腿饭+青菜+鸡蛋，就很好。\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
    if (/腿酸|酸痛|肌肉酸/.test(q)) return '练后酸痛(延迟性肌肉酸痛 DOMS)很正常。缓解：①多喝水；②补充蛋白质(鸡胸/鸡蛋/牛奶)；③散步或轻松拉伸促进血液循环；④今晚睡好。持续超过 3–4 天或剧烈疼痛建议就医。\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
    if (/跑步|1000|800|体测|长跑/.test(q)) return '耐力跑提分技巧：①先练“节奏跑”和“间歇跑”(如 400m×4 组)；②跑姿放松、呼吸两步一吸两步一呼；③考前 3 天减量，考前 1 天只轻松慢跑或休息；④当天充分热身。\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
    if (/引体|俯卧撑|力量/.test(q)) return '引体向上从 0 到 1 的关键是“退让训练”(跳上去慢慢下放)和辅助练习(弹力带/澳洲引体/悬挂)。每天少量高频比一周一次大量更有效。\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
    return '我可以回答运动训练、食堂饮食搭配、体测提分、减脂增肌等问题。\n\n你可以这样问：\n• “练完腿很酸该吃什么？”\n• “怎么把 1000 米从 4 分半提到 4 分？”\n• “引体向上一个都做不了怎么办？”\n\n（以上为本地规则引擎回答，配置后端后可获得更个性化建议）';
  }

  function localAdjustAnswer(payload) {
    var eaten = payload.eatenKcal || 0, goal = payload.goal || '维持';
    var targets = NUTRITION.targetMacros(goal, payload.weightKg || 60);
    var left = targets.kcal - eaten;
    if (left > 300) return '这一餐热量偏低，未来 1–2 餐可“多吃”：加一份主食或鸡蛋/牛奶，把蛋白质补上（今日尚可再摄入约 ' + Math.round(left) + ' 千卡）。';
    if (left < -300) return '这一餐偏多，未来 1–2 餐建议“少吃”：下一顿主食减半、以青菜和蛋白为主，少碰油炸和含糖饮料（今日已超出约 ' + Math.round(-left) + ' 千卡）。';
    return '摄入和目标基本匹配，未来 1–2 餐正常均衡即可，注意多喝水、保持蛋白充足。';
  }

  function localBudgetAnswer(payload) {
    var budget = payload.budget || 1200;
    var past = payload.pastAvg || 0;
    var daily = Math.round(budget / 30);
    if (!past) return '设定月预算 ' + budget + ' 元 ≈ 每天 ' + daily + ' 元。建议：早餐 4–6 元、午/晚餐各 10–14 元，留出机动。多用自选窗口的素菜+一个荤菜最划算。';
    var diff = past - daily;
    if (diff > 0) return '你过去 30 天平均每天约 ' + Math.round(past) + ' 元，新预算每天约 ' + daily + ' 元，需每天省约 ' + Math.round(diff) + ' 元。建议：减少奶茶/宵夜频率，自选窗口一荤一素代替套餐，每周可省下 ' + Math.round(diff * 7) + ' 元。';
    return '你过去 30 天平均每天约 ' + Math.round(past) + ' 元，新预算每天约 ' + daily + ' 元，比较宽裕，可放心按均衡搭配吃。';
  }

  function localSportAnswer(payload) {
    var period = payload.period || 'week';
    var totalMin = payload.totalMin || 0, totalKcal = payload.totalKcal || 0;
    var days = period === 'week' ? 7 : (period === 'month' ? 30 : 12);
    var avgMin = totalMin / days;
    var label = period === 'week' ? '本周' : (period === 'month' ? '本月' : '今年');
    var advice = '';
    if (avgMin < 20) advice = '运动量偏少。建议先养成“每天 20 分钟”的小习惯，比如快走或跳绳，强度从低开始，贵在坚持。';
    else if (avgMin < 40) advice = '运动量中等，方向正确。建议加入每周 2 次力量训练，与有氧交替，减脂增肌更均衡。';
    else if (totalMin && totalMin / Math.max(1, payload.sessions) > 90) advice = '单次运动偏长，注意恢复。建议拆成多次短时高效训练，避免过度疲劳，保证睡眠。';
    else advice = '运动量不错！建议按“强度周期”安排：每周 1–2 次高强度、其余中低强度恢复，减少受伤风险。';
    return label + '累计运动 ' + totalMin + ' 分钟、消耗约 ' + totalKcal + ' 千卡，平均每天约 ' + Math.round(avgMin) + ' 分钟。\n\n' + advice;
  }

  window.API = {
    API_BASE: API_BASE,
    setApiBase: setApiBase,
    checkBackend: checkBackend,
    callAgent: callAgent,
    getState: function () { return state; },
    generatePlanLocal: generatePlanLocal,
    macroRatio: macroRatio,
    getAgentKey: getAgentKey,
    setAgentKey: setAgentKey,
    hasAgentKey: hasAgentKey,
    localAdjustAnswer: localAdjustAnswer,
    localBudgetAnswer: localBudgetAnswer,
    localSportAnswer: localSportAnswer,
    localCoachAnswer: localCoachAnswer,
  };
})();
