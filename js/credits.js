/* ============================================================
 * credits.js —— 积分雷达（「练」的部分）
 * 列表 / 筛选 / 搜索 / 排序 / 详情 / 意向 / 讨论 / 评价 / AI 摘要
 * 数据：data/credits.js；用户行为存 localStorage（无账号体系）
 * ============================================================ */
(function () {
  'use strict';

  var LS = { intents: 'sf_credit_intents', comments: 'sf_credit_comments', reviews: 'sf_credit_reviews', progress: 'sf_credit_progress' };
  var state = { q: '', category: '全部', status: '全部', currentId: null, star: 0 };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function realStatus(a) {
    if (a.status === '已结束') return '已结束';
    if (a.period_end && a.period_end < today()) return '已结束';
    return a.status;
  }
  function matches(a, q) {
    if (!q) return true;
    var hay = [a.title, a.location, a.category, a.credit_condition, a.description].join(' ');
    return q.split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) >= 0; });
  }
  function filtered() {
    var list = CREDIT_ACTIVITIES.filter(function (a) {
      if (state.category !== '全部' && a.category !== state.category) return false;
      if (state.status !== '全部' && realStatus(a) !== state.status) return false;
      return matches(a, state.q);
    });
    list.sort(function (x, y) {
      var sx = realStatus(x) === '已结束' ? 1 : 0, sy = realStatus(y) === '已结束' ? 1 : 0;
      if (sx !== sy) return sx - sy;
      var ex = x.period_end || '', ey = y.period_end || '';
      return sx === 1 ? (ey < ex ? -1 : ey > ex ? 1 : 0) : (ex < ey ? -1 : ex > ey ? 1 : 0);
    });
    return list;
  }
  function badge(st) {
    var cls = st === '报名中' ? 'ok' : st === '即将截止' ? 'hot' : 'done';
    return '<span class="stamp ' + cls + '"><i></i>' + st + '</span>';
  }

  var CATS = ['全部', '参赛即得', '打卡累积', '课程训练', '服务组织', '院系日常', '社团活动', '民间赛事', '民间活动'];

  function renderList() {
    var box = $('creditsBody');
    if (!box) return;
    var progress = load(LS.progress, 0);
    var blocks = '';
    for (var i = 1; i <= 10; i++) blocks += '<span class="pg-block' + (i <= progress ? ' on' : '') + '"></span>';

    box.innerHTML =
      '<div class="card paper-hero">' +
        '<div class="hero-top"><div><div class="eyebrow">CREDIT RADAR · 广州南校园</div>' +
        '<h2 class="hero-title">这学期，把一个个拿回来。</h2></div><span class="season">2026 秋</span></div>' +
        '<div class="progress-card"><div class="pg-head"><b>本学期积分进度 ' + progress + '/10</b><span class="stamp ghost">非官方认定</span></div>' +
        '<div class="pg-row">' + blocks + '</div>' +
        '<div class="pg-foot"><span>仅作个人记录 · 随时可以更新</span><button class="btn btn-sm btn-soft" id="btnCreditProgress">更新进度</button></div></div>' +
      '</div>' +
      '<div class="toolbar">' +
        '<div class="search-wrap"><input type="search" id="creditSearch" placeholder="搜活动：路跑 / 英东 / 逸仙杯" value="' + esc(state.q) + '" />' +
        '<button class="search-clear' + (state.q ? '' : ' hide') + '" id="btnCreditClear" aria-label="清除">×</button></div>' +
        '<div class="chips-scroll" id="creditCats">' + CATS.map(function (c) {
          return '<button class="chip-btn' + (state.category === c ? ' on' : '') + '" data-cat="' + c + '">' + c + '</button>';
        }).join('') + '</div>' +
        '<div class="seg" id="creditStatusSeg">' + ['全部', '报名中', '即将截止', '已结束'].map(function (s) {
          return '<button class="pill' + (state.status === s ? ' active' : '') + '" data-status="' + s + '">' + s + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div id="creditListWrap"></div>';

    var search = $('creditSearch');
    search.oninput = function () {
      state.q = this.value.trim();
      $('btnCreditClear').classList.toggle('hide', !state.q);
      renderCards();
    };
    $('btnCreditClear').onclick = function () { state.q = ''; $('creditSearch').value = ''; renderCards(); this.classList.add('hide'); };
    $('btnCreditProgress').onclick = function () {
      var n = window.prompt('本学期已获体育积分（0–10）：', String(progress));
      if (n == null) return;
      save(LS.progress, Math.max(0, Math.min(10, parseInt(n, 10) || 0)));
      renderList();
    };
    $('creditCats').querySelectorAll('[data-cat]').forEach(function (b) {
      b.onclick = function () {
        state.category = b.dataset.cat;
        $('creditCats').querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderCards();
      };
    });
    $('creditStatusSeg').querySelectorAll('[data-status]').forEach(function (b) {
      b.onclick = function () {
        state.status = b.dataset.status;
        $('creditStatusSeg').querySelectorAll('[data-status]').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderCards();
      };
    });
    renderCards();
  }

  function renderCards() {
    var wrap = $('creditListWrap');
    if (!wrap) return;
    var list = filtered();
    var html = '<div class="count-line"><b>' + list.length + '</b> / ' + CREDIT_ACTIVITIES.length + ' 个机会 · 按即将截止排序</div>';
    if (!list.length) {
      html += '<div class="empty"><div class="emoji">🎯</div><p>这个筛选下还没有活动</p>' +
        '<button class="btn btn-soft btn-sm" id="btnCreditReset">重置筛选</button></div>';
    } else {
      html += '<div class="credit-list">' + list.map(function (a) {
        var st = realStatus(a);
        return '<article class="credit-card" data-id="' + a.id + '">' +
          '<div class="cc-top">' + badge(st) + (a.source === 'community' ? '<span class="src-tag">社团/民间</span>' : '') +
          '<span class="credit-arm">' + esc(a.credit_value) + '</span></div>' +
          '<h3>' + esc(a.title) + '</h3>' +
          '<p class="cc-cond">获取条件：' + esc(a.credit_condition) + '</p>' +
          '<p class="cc-meta">' + esc(a.period_label) + ' · ' + esc(a.location) + '</p></article>';
      }).join('') + '</div>';
    }
    wrap.innerHTML = html;
    var reset = $('btnCreditReset');
    if (reset) reset.onclick = function () { state.q = ''; state.category = '全部'; state.status = '全部'; renderList(); };
    wrap.querySelectorAll('.credit-card').forEach(function (c) {
      c.onclick = function () { openDetail(+c.dataset.id); };
    });
  }

  /* ---------- 详情 ---------- */
  function getActivity(id) { return CREDIT_ACTIVITIES.filter(function (a) { return a.id === id; })[0]; }
  function intentsOf(id) { return load(LS.intents, []).filter(function (x) { return x.activity_id === id; }); }
  function commentsOf(id) { return load(LS.comments, []).filter(function (x) { return x.activity_id === id; }); }
  function reviewsOf(id) { return load(LS.reviews, []).filter(function (x) { return x.activity_id === id; }); }
  var INTENT_CN = { want_to_go: '我想去', find_buddy: '找搭子', need_team: '组队缺人' };

  function openDetail(id) {
    var box = $('creditsBody');
    var a = getActivity(id);
    if (!box || !a) return;
    state.currentId = id;
    state.star = 0;
    var st = realStatus(a);
    var intents = intentsOf(a.id), comments = commentsOf(a.id), reviews = reviewsOf(a.id);
    var avg = reviews.length ? (reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length) : 0;

    var html = '<button class="btn btn-ghost btn-sm back-btn" id="btnCreditBack">← 返回雷达</button>';
    html += '<article class="card detail-card">' +
      '<div class="cc-top">' + badge(st) + (a.source === 'community' ? '<span class="src-tag">社团/民间</span>' : '') +
      '<span class="credit-arm big">' + esc(a.credit_value) + '</span></div>' +
      '<h2 class="detail-title">' + esc(a.title) + '</h2>' +
      (a.source === 'community' ? '<div class="warning-dash">来源：学生社团 / 民间组织，非官方积分活动，不计入学校体育积分</div>' : '') +
      '<p class="detail-desc">' + esc(a.description) + '</p>' +
      '<div class="info-grid">' +
      info('时间窗口', a.period_label + (a.period_end ? '（截止 ' + a.period_end + '）' : '')) +
      info('地点', a.location) + info('校区', a.campus) + info('分类', a.category) +
      info('周期', a.is_recurring ? '常年重复' : '一次性') + '</div>' +
      '<div class="credit-box"><div class="cb-val">' + esc(a.credit_value) + '</div>' +
      '<div class="cb-cond">' + esc(a.credit_condition) + '</div>' +
      '<div class="cb-hint">示例分值，请以官方通知为准</div></div>' +
      '<a class="btn btn-primary btn-block" href="' + esc(a.registration_url) + '" target="_blank" rel="noopener">前往报名入口</a>' +
      '</article>';

    var aiOnline = !!(window.API && API.getState && API.getState().agentOnline);
    html += '<div class="card ai-card"><div class="ai-head"><b>AI 一句话摘要</b><span class="ai-tag" id="aiTag">系统整理</span></div>' +
      '<div id="aiSummary" class="ai-body">' + renderSummaryText(a) + '</div>' +
      '<div class="ai-actions"><button class="btn btn-soft btn-sm" id="btnAiSummary">' +
      (aiOnline ? '让 AI 重新概括' : '用本地规则重新整理') + '</button></div></div>';

    html += '<div class="card"><h2>一起去？</h2><div class="intent-row">' +
      Object.keys(INTENT_CN).map(function (k) {
        var on = intents.some(function (x) { return x.type === k && x.mine; });
        return '<button class="intent-btn' + (on ? ' on' : '') + '" data-intent="' + k + '">' + INTENT_CN[k] + '</button>';
      }).join('') + '</div><div class="intent-list">' +
      (intents.length ? intents.map(function (x) { return '<span class="anon">' + esc(x.alias) + ' · ' + INTENT_CN[x.type] + '</span>'; }).join('')
        : '<p class="muted">还没有人标记，你可以是第一个</p>') + '</div></div>';

    html += '<div class="card"><h2>活动讨论</h2>' +
      (st === '已结束' ? '<p class="muted">活动已结束，讨论区只读</p>'
        : '<div class="chat-input"><input type="text" id="commentInput" maxlength="500" placeholder="说点什么，1–500 字" /><button class="btn btn-primary btn-sm" id="btnAddComment">发布</button></div>') +
      '<div class="comment-list">' + (comments.length ? comments.slice().reverse().map(function (c) {
        return '<div class="comment"><div class="cm-head"><b>' + esc(c.name) + '</b><span>' + esc(c.at) + '</span></div><p>' + esc(c.content) + '</p></div>';
      }).join('') : '<p class="muted">还没有讨论，来开个头</p>') + '</div></div>';

    html += '<div class="card"><h2>运动攻略 · 评价 <span class="muted">' +
      (reviews.length ? avg.toFixed(1) + ' 分 · ' + reviews.length + ' 条' : '暂无评价') + '</span></h2>' +
      '<div class="stars" id="starRow">' + [1, 2, 3, 4, 5].map(function (n) { return '<button class="star" data-star="' + n + '">★</button>'; }).join('') + '</div>' +
      '<div class="chat-input"><input type="text" id="reviewInput" maxlength="500" placeholder="写点攻略或体验（2–500 字）" /><button class="btn btn-primary btn-sm" id="btnAddReview">提交</button></div>' +
      '<div class="comment-list">' + (reviews.length ? reviews.slice().reverse().map(function (r) {
        return '<div class="comment"><div class="cm-head"><b>' + esc(r.name) + '</b><span class="stars-inline">' + '★'.repeat(r.rating) + '</span></div><p>' + esc(r.content) + '</p></div>';
      }).join('') : '') + '</div></div>';

    box.innerHTML = html;
    if (state._lastId !== a.id) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    state._lastId = a.id;

    $('btnCreditBack').onclick = function () { state.currentId = null; renderList(); };

    box.querySelectorAll('[data-intent]').forEach(function (b) {
      b.onclick = function () {
        if (st === '已结束') { alert('该活动已结束，仅可查看'); return; }
        var types = load(LS.intents, []);
        var idx = types.findIndex(function (x) { return x.activity_id === a.id && x.type === b.dataset.intent && x.mine; });
        if (idx >= 0) types.splice(idx, 1); else types.push({ activity_id: a.id, type: b.dataset.intent, mine: true, alias: '我' });
        save(LS.intents, types); openDetail(a.id);
      };
    });

    var addC = $('btnAddComment');
    if (addC) addC.onclick = function () {
      var v = ($('commentInput').value || '').trim();
      if (v.length < 1) { alert('至少写 1 个字'); return; }
      var arr = load(LS.comments, []);
      arr.push({ activity_id: a.id, name: '匿名同学', content: v.slice(0, 500), at: new Date().toLocaleString('zh-CN') });
      save(LS.comments, arr); openDetail(a.id);
    };

    box.querySelectorAll('.star').forEach(function (s) {
      s.onclick = function () {
        state.star = +s.dataset.star;
        box.querySelectorAll('.star').forEach(function (x) { x.classList.toggle('on', +x.dataset.star <= state.star); });
      };
    });
    var addR = $('btnAddReview');
    if (addR) addR.onclick = function () {
      var v = ($('reviewInput').value || '').trim();
      if (!state.star) { alert('先点星星打个分'); return; }
      if (v.length < 2) { alert('至少写 2 个字'); return; }
      var arr = load(LS.reviews, []).filter(function (x) { return x.activity_id !== a.id || !x.mine; });
      arr.push({ activity_id: a.id, mine: true, name: '我', rating: state.star, content: v.slice(0, 500) });
      save(LS.reviews, arr); openDetail(a.id);
    };

    $('btnAiSummary').onclick = function () {
      var out = $('aiSummary');
      out.innerHTML = '<span class="muted">正在概括…</span>';
      var fallback = renderSummaryText(a);
      var done = function (text, byModel) {
        out.innerHTML = text;
        var tag = $('aiTag');
        if (tag) { tag.textContent = byModel ? 'AI 生成' : '系统整理'; tag.className = 'ai-tag' + (byModel ? ' model' : ''); }
      };
      var online = window.API && API.getState && API.getState().backendOnline;
      if (online) {
        API.callAgent({ type: 'coach', question: '请用一句话（60 字内）概括这个校园体育活动，不要编造分值、时间、地点：' + a.title + '，' + a.description })
          .then(function (res) {
            var t = (res && res.text || '').trim();
            if (t && t.length > 4) done('<p>' + esc(t.slice(0, 120)) + '</p><div class="ai-note">AI 概括，分值/时间以官方通知为准</div>', true);
            else done(fallback, false);
          })
          .catch(function () { done(fallback, false); });
      } else {
        setTimeout(function () { done(fallback, false); }, 260);
      }
    };
  }

  function info(k, v) { return '<div class="info-cell"><div class="ik">' + esc(k) + '</div><div class="iv">' + esc(v) + '</div></div>'; }

  function renderSummaryText(a) {
    var suit = (a.suitable || []).map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('');
    var notSuit = (a.not_suitable || []).map(function (s) { return '<span class="tag bad">' + esc(s) + '</span>'; }).join('');
    return '<p class="ai-line">' + esc(a.description.slice(0, 60)) + '</p>' +
      '<div class="tag-row"><span class="tag-label">适合</span>' + suit + '</div>' +
      '<div class="tag-row"><span class="tag-label">不适合</span>' + notSuit + '</div>' +
      '<div class="ai-note">分值提醒：' + esc(a.credit_value) + '｜' + esc(a.credit_condition) + '。示例分值，请以官方通知为准。量力而行，身体不适立即停止并就医。</div>';
  }

  window.CreditsUI = {
    init: function () {
      if (!document.getElementById('creditsBody')) return;
      if (!load(LS.intents, null)) save(LS.intents, [
        { activity_id: 1, type: 'want_to_go', mine: false, alias: '松涛·青柠' },
        { activity_id: 1, type: 'find_buddy', mine: false, alias: '英东·夜跑' },
        { activity_id: 3, type: 'want_to_go', mine: false, alias: '北门·阿树' },
        { activity_id: 8, type: 'need_team', mine: false, alias: '榕园·小满' }
      ]);
      if (!load(LS.comments, null)) save(LS.comments, [
        { activity_id: 1, name: '匿名同学', content: '去年路线经过怀士堂，记得穿运动鞋。', at: '昨天 21:03' },
        { activity_id: 13, name: '匿名同学', content: '每晚九点英东，慢跑 3km，欢迎搭伴。', at: '前天 22:10' }
      ]);
      if (!load(LS.reviews, null)) save(LS.reviews, [
        { activity_id: 3, mine: false, name: '匿名同学', rating: 5, content: '沿逸仙大道那段路灯亮、路面平，适合放开了跑；孙文中路那段人多要减速。' }
      ]);
      renderList();
    },
    render: renderList,
    open: openDetail
  };
})();
