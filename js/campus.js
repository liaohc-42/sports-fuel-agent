/* ============================================================
 * campus.js —— 约运动 / 装备 / 我的（本地演示版）
 * 说明：无账号体系，数据仅存本机 localStorage；标注为「本地演示版」。
 * ============================================================ */
(function () {
  'use strict';
  var LS = { posts: 'sf_pickup_posts', replies: 'sf_pickup_replies', gear: 'sf_gear_items' };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ago(t) { var s = Math.floor((Date.now() - t) / 60000); return s < 60 ? s + ' 分钟前' : s < 1440 ? Math.floor(s / 60) + ' 小时前' : Math.floor(s / 1440) + ' 天前'; }

  var SEED_POSTS = [
    { id: 1, type: 'pickup', sport: '羽毛球', title: '今晚 9 点体育馆打羽毛球，缺 1 个男单', detail: '水平中等，打两小时，场地已订', place: '新体育馆', meetAt: '今晚 21:00', need: 1, at: Date.now() - 36e5 },
    { id: 2, type: 'pickup', sport: '骑行', title: '周末想去大学城绿道骑车，求组队', detail: '往返约 30km，配速休闲，有头盔', place: '北门集合', meetAt: '周六 15:00', need: 3, at: Date.now() - 9e6 },
    { id: 3, type: 'mentor', sport: '羽毛球', title: '求大佬带我入门羽毛球，纯零基础', detail: '想学握拍和高远球，可以请奶茶', place: '新体育馆', meetAt: '周三晚', need: 1, at: Date.now() - 17e6 },
    { id: 4, type: 'pickup', sport: '跑步', title: '体测 800 米怎么跑不喘？', detail: '想找人带着练配速，目标 3\'50"', place: '英东田径场', meetAt: '每晚 21:30', need: 2, at: Date.now() - 26e6 },
    { id: 5, type: 'mentor', sport: '篮球', title: '想学三步上篮，有一起练的吗', detail: '零基础，能坚持每周两次', place: '篮球场群', meetAt: '周日下午', need: 2, at: Date.now() - 40e6 }
  ];
  var SEED_REPLIES = [
    { post_id: 1, name: '匿名同学', content: '我可以，男单中等水平，微信不方便的话就在这里约。', at: Date.now() - 18e5 },
    { post_id: 3, name: '匿名同学', content: '周三晚上我有空，可以教你握拍。', at: Date.now() - 72e5 },
    { post_id: 4, name: '匿名同学', content: '800 米关键是前 200 别冲，跟着我的配速跑。', at: Date.now() - 90e5 }
  ];
  var SEED_GEAR = [
    { id: 1, title: '计数跳绳，九成新', gear_type: '跳绳', mode: 'sell', price: 15, detail: '用了一个月，计数器正常', at: Date.now() - 36e5 },
    { id: 2, title: '瑜伽垫免费送', gear_type: '瑜伽垫', mode: 'free', price: null, detail: '毕业师兄留下的，自取', at: Date.now() - 72e5 },
    { id: 3, title: '羽毛球拍出借（两支）', gear_type: '球拍', mode: 'lend', price: null, detail: '借一周，押学生证', at: Date.now() - 108e5 },
    { id: 4, title: '7 号篮球', gear_type: '球类', mode: 'sell', price: 35, detail: '打了半年，气足', at: Date.now() - 144e5 }
  ];

  var pickupState = { type: '全部', sport: '全部' };
  var gearState = { mode: '全部', type: '全部', q: '' };

  function ensureSeed() {
    if (!load(LS.posts, null)) save(LS.posts, SEED_POSTS);
    if (!load(LS.replies, null)) save(LS.replies, SEED_REPLIES);
    if (!load(LS.gear, null)) save(LS.gear, SEED_GEAR);
  }

  function renderPickup() {
    var box = $('pickupBody'); if (!box) return;
    var posts = load(LS.posts, []);
    var replies = load(LS.replies, []);
    var sports = ['全部'].concat(posts.map(function (p) { return p.sport; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var list = posts.filter(function (p) {
      if (pickupState.type !== '全部' && p.type !== pickupState.type) return false;
      if (pickupState.sport !== '全部' && p.sport !== pickupState.sport) return false;
      return true;
    });

    var html = '<div class="card paper-hero"><div class="eyebrow">PICKUP · 约运动</div>' +
      '<h2 class="hero-title sm">官方打卡之外的运动，都在这里。</h2>' +
      '<p class="hint">约球、约跑、约骑行；不会玩？发个「求带」。</p>' +
      '<div class="notice-pill">本地演示版 · 数据仅存本机，不含真实账号</div></div>';

    html += '<div class="toolbar"><div class="seg">' +
      ['全部', '约战组队', '求带入门'].map(function (t) {
        var v = t === '全部' ? '全部' : t === '约战组队' ? 'pickup' : 'mentor';
        return '<button class="pill' + (pickupState.type === v ? ' active' : '') + '" data-ptype="' + v + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="chips-scroll">' + sports.map(function (s) {
        return '<button class="chip-btn' + (pickupState.sport === s ? ' on' : '') + '" data-psport="' + s + '">' + s + '</button>';
      }).join('') + '</div></div>';

    html += '<details class="card post-panel"><summary><span>发个帖：约战 / 求带</span><i class="chev">▼</i></summary>' +
      '<div class="pp-body"><div class="grid2">' +
      '<div><label class="fld">类型</label><select id="ppType"><option value="pickup">约战组队</option><option value="mentor">求带入门</option></select></div>' +
      '<div><label class="fld">运动项目</label><input type="text" id="ppSport" placeholder="羽毛球 / 跑步" /></div></div>' +
      '<label class="fld">标题（2–60 字）</label><input type="text" id="ppTitle" maxlength="60" placeholder="今晚 9 点体育馆打羽毛球，缺 1 人" />' +
      '<label class="fld">详情</label><input type="text" id="ppDetail" placeholder="水平 / 时长 / 是否订场" />' +
      '<div class="grid2"><div><label class="fld">地点</label><input type="text" id="ppPlace" placeholder="新体育馆" /></div>' +
      '<div><label class="fld">时间</label><input type="text" id="ppMeet" placeholder="今晚 21:00" /></div></div>' +
      '<label class="fld">还缺几人</label><input type="number" id="ppNeed" value="1" min="1" max="20" />' +
      '<button class="btn btn-primary btn-block" id="btnPublishPost" style="margin-top:11px">发布</button></div></details>';

    html += '<div class="post-list">' + list.map(function (p) {
      var rs = replies.filter(function (r) { return r.post_id === p.id; });
      return '<article class="post-card">' +
        '<div class="pc-top"><span class="mini-badge ' + (p.type === 'mentor' ? 'warn' : 'ok') + '">' + (p.type === 'mentor' ? '求带入门' : '约战组队') + '</span>' +
        '<span class="sport-tag">' + esc(p.sport) + '</span><span class="muted">' + ago(p.at) + '</span></div>' +
        '<h3>' + esc(p.title) + '</h3><p class="pc-detail">' + esc(p.detail) + '</p>' +
        '<p class="pc-meta">' + esc(p.place) + ' · ' + esc(p.meetAt) + ' · 还缺 ' + p.need + ' 人</p>' +
        '<details class="reply-panel"><summary><span>' + rs.length + ' 条响应 · 我来响应</span><i class="chev">▼</i></summary>' +
        '<div class="reply-body">' + rs.map(function (r) {
          return '<div class="reply"><b>' + esc(r.name) + '</b><p>' + esc(r.content) + '</p></div>';
        }).join('') +
        '<div class="chat-input"><input type="text" data-reply-input="' + p.id + '" placeholder="写一句响应（1–300 字）" maxlength="300" />' +
        '<button class="btn btn-soft btn-sm" data-reply-send="' + p.id + '">发送</button></div></div></details></article>';
    }).join('') + '</div>';

    box.innerHTML = html;

    box.querySelectorAll('[data-ptype]').forEach(function (b) { b.onclick = function () { pickupState.type = b.dataset.ptype; renderPickup(); }; });
    box.querySelectorAll('[data-psport]').forEach(function (b) { b.onclick = function () { pickupState.sport = b.dataset.psport; renderPickup(); }; });
    var pub = $('btnPublishPost');
    if (pub) pub.onclick = function () {
      var title = ($('ppTitle').value || '').trim();
      if (title.length < 2) { alert('标题至少 2 个字'); return; }
      var arr = load(LS.posts, []);
      arr.unshift({
        id: Date.now(), type: $('ppType').value, sport: ($('ppSport').value || '其他').trim(),
        title: title.slice(0, 60), detail: ($('ppDetail').value || '').trim(),
        place: ($('ppPlace').value || '待定').trim(), meetAt: ($('ppMeet').value || '待定').trim(),
        need: +$('ppNeed').value || 1, at: Date.now()
      });
      save(LS.posts, arr); renderPickup();
    };
    box.querySelectorAll('[data-reply-send]').forEach(function (b) {
      b.onclick = function () {
        var id = +b.dataset.replySend;
        var input = box.querySelector('[data-reply-input="' + id + '"]');
        var v = (input.value || '').trim();
        if (!v) { alert('写点什么再发送'); return; }
        var arr = load(LS.replies, []);
        arr.push({ post_id: id, name: '匿名同学', content: v.slice(0, 300), at: Date.now() });
        save(LS.replies, arr); renderPickup();
      };
    });
  }

  function renderGear() {
    var box = $('gearBody'); if (!box) return;
    var items = load(LS.gear, []);
    var types = ['全部'].concat(items.map(function (g) { return g.gear_type; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var list = items.filter(function (g) {
      if (gearState.mode !== '全部' && g.mode !== gearState.mode) return false;
      if (gearState.type !== '全部' && g.gear_type !== gearState.type) return false;
      if (gearState.q && (g.title + g.detail).indexOf(gearState.q) < 0) return false;
      return true;
    });
    var MODE = { sell: '出', lend: '借', free: '送' };

    var html = '<div class="card paper-hero"><div class="eyebrow">GEAR · 装备流转</div>' +
      '<h2 class="hero-title sm">闲置的装备，去该去的地方。</h2>' +
      '<p class="hint">当面交接、先验货后付款，平台不代收钱款。</p>' +
      '<div class="notice-pill">本地演示版 · 数据仅存本机</div></div>';

    html += '<div class="toolbar"><div class="seg">' +
      ['全部', '出', '借', '送'].map(function (t) {
        var v = t === '全部' ? '全部' : t === '出' ? 'sell' : t === '借' ? 'lend' : 'free';
        return '<button class="pill' + (gearState.mode === v ? ' active' : '') + '" data-gmode="' + v + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="chips-scroll">' + types.map(function (t) {
        return '<button class="chip-btn' + (gearState.type === t ? ' on' : '') + '" data-gtype="' + t + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="search-wrap"><input type="search" id="gearSearch" placeholder="搜装备：跳绳 / 球拍" value="' + esc(gearState.q) + '" /></div></div>';

    html += '<details class="card post-panel"><summary><span>发布装备</span><i class="chev">▼</i></summary><div class="pp-body">' +
      '<label class="fld">标题</label><input type="text" id="gTitle" placeholder="计数跳绳，九成新" />' +
      '<div class="grid2"><div><label class="fld">类型</label><input type="text" id="gType" placeholder="跳绳" /></div>' +
      '<div><label class="fld">方式</label><select id="gMode"><option value="sell">出</option><option value="lend">借</option><option value="free">送</option></select></div></div>' +
      '<label class="fld">价格（仅「出」需要）</label><input type="number" id="gPrice" placeholder="15" />' +
      '<label class="fld">描述</label><input type="text" id="gDetail" placeholder="成色 / 取货地点" />' +
      '<button class="btn btn-primary btn-block" id="btnPublishGear" style="margin-top:11px">发布</button></div></details>';

    html += '<div class="gear-list">' + list.map(function (g) {
      return '<article class="gear-card"><div class="gc-top"><span class="mini-badge ' + (g.mode === 'free' ? 'ok' : 'warn') + '">' + MODE[g.mode] + '</span>' +
        '<span class="sport-tag">' + esc(g.gear_type) + '</span><span class="muted">' + ago(g.at) + '</span></div>' +
        '<h3>' + esc(g.title) + '</h3>' +
        (g.price != null ? '<div class="price">¥' + g.price + '</div>' : '') +
        '<p class="pc-detail">' + esc(g.detail) + '</p></article>';
    }).join('') + '</div>';

    box.innerHTML = html;
    box.querySelectorAll('[data-gmode]').forEach(function (b) { b.onclick = function () { gearState.mode = b.dataset.gmode; renderGear(); }; });
    box.querySelectorAll('[data-gtype]').forEach(function (b) { b.onclick = function () { gearState.type = b.dataset.gtype; renderGear(); }; });
    var s = $('gearSearch');
    if (s) {
      var composing = false;
      s.addEventListener('compositionstart', function () { composing = true; });
      s.addEventListener('compositionend', function () { composing = false; gearState.q = s.value.trim(); renderGear(); });
      s.oninput = function () { if (composing) return; gearState.q = s.value.trim(); renderGear(); };
    }
    var pub = $('btnPublishGear');
    if (pub) pub.onclick = function () {
      var title = ($('gTitle').value || '').trim();
      if (title.length < 2) { alert('标题至少 2 个字'); return; }
      var arr = load(LS.gear, []);
      arr.unshift({
        id: Date.now(), title: title, gear_type: ($('gType').value || '其他').trim(),
        mode: $('gMode').value, price: $('gMode').value === 'sell' ? (+$('gPrice').value || 0) : null,
        detail: ($('gDetail').value || '').trim(), at: Date.now()
      });
      save(LS.gear, arr); renderGear();
    };
  }

  function renderMe() {
    var box = $('meBody'); if (!box) return;
    var prof = load('sf_profile', { gender: 'male', age: 19, height: 175, weight: 65, goal: '维持' });
    var progress = load('sf_credit_progress', 0);
    box.innerHTML = '<div class="card paper-hero"><div class="eyebrow">ME · 我的</div>' +
      '<h2 class="hero-title sm">你的校园运动档案。</h2>' +
      '<p class="hint">档案与记录仅保存在本机浏览器，不上传服务器。</p></div>' +
      '<div class="card"><h2>身体档案</h2><div class="me-grid">' +
      '<div class="me-cell"><span>身高</span><b>' + prof.height + ' cm</b></div>' +
      '<div class="me-cell"><span>体重</span><b>' + prof.weight + ' kg</b></div>' +
      '<div class="me-cell"><span>目标</span><b>' + esc(prof.goal) + '</b></div>' +
      '<div class="me-cell"><span>本学期积分</span><b>' + progress + ' / 10</b></div></div>' +
      '<button class="btn btn-soft btn-sm" id="btnOpenProfile" style="margin-top:10px">编辑档案</button></div>' +
      '<div class="card"><h2>更多</h2>' +
      '<div class="branch-row">' +
      '<button class="branch-btn" data-go="pickup"><b>约运动</b><span>约球 / 求带 · 本地演示版</span></button>' +
      '<button class="branch-btn" data-go="gear"><b>装备流转</b><span>出 / 借 / 送 · 本地演示版</span></button>' +
      '<button class="branch-btn" data-go="science"><b>原理与数据</b><span>文献 / 数据来源 / 大模型接入</span></button>' +
      '</div></div>';
    var op = $('btnOpenProfile'); if (op) op.onclick = function () { var d = $('drawer'), m = $('drawerMask'); if (d && m) { d.classList.add('open'); m.classList.add('open'); } };
    box.querySelectorAll('[data-go]').forEach(function (b) {
      b.onclick = function () { var t = b.dataset.go; if (window.AppTabs) AppTabs.show(t); };
    });
  }

  window.CampusUI = {
    init: function () {
      ensureSeed();
      if ($('pickupBody')) renderPickup();
      if ($('gearBody')) renderGear();
      if ($('meBody')) renderMe();
    },
    renderPickup: renderPickup,
    renderGear: renderGear,
    renderMe: renderMe
  };
})();
