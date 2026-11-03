/* ============================================================
 * venues.js —— 场馆与人流
 * 判定优先级：① 近 2 小时实时上报 → ② 历史规律（校区+场馆+星期+小时）→ ③ 默认中等
 * 历史数据来自《中山大学场馆拥挤度规律表》，无实时数据时按它给模拟状态
 * ============================================================ */
(function () {
  'use strict';
  var LS_REPORTS = 'sf_venue_reports';
  var LEVEL_CN = { busy: '人多', normal: '适中', free: '人少', closed: '闭馆', unavailable: '不可用' };
  var state = { campus: '广州南校园', q: '', highlight: null };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function toMin(s) { var m = /^(\d{1,2}):(\d{2})$/.exec(s); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function inWin(cur, win) {
    var p = String(win).split('-'); if (p.length !== 2) return false;
    var a = toMin(p[0]), b = toMin(p[1]); if (a == null || b == null) return false;
    return a <= b ? (cur >= a && cur <= b) : (cur >= a || cur <= b);
  }
  function inAny(cur, wins) { return (wins || []).some(function (w) { return inWin(cur, w); }); }

  /* ---------- 核心：拥挤度判定 ---------- */
  function reportsFor(id) {
    var all = load(LS_REPORTS, {});
    var arr = all[id] || [];
    var cut = Date.now() - 2 * 3600 * 1000;
    return arr.filter(function (r) { return r.t >= cut; });
  }

  function crowdOf(v, now) {
    now = now || new Date();
    var cur = now.getHours() * 60 + now.getMinutes();
    var wd = now.getDay();

    /* ① 实时上报（近 2 小时） */
    var rs = reportsFor(v.id);
    if (rs.length) {
      var n = rs.length, busy = 0, free = 0;
      rs.forEach(function (r) { if (r.level === 'busy') busy++; if (r.level === 'free') free++; });
      if (busy / n > 0.6) return { level: 'busy', why: '近 2 小时有 ' + n + ' 条上报，' + Math.round(busy / n * 100) + '% 说人多', source: 'report' };
      if (free / n > 0.6) return { level: 'free', why: '近 2 小时有 ' + n + ' 条上报，' + Math.round(free / n * 100) + '% 说人少', source: 'report' };
      return { level: 'normal', why: '近 2 小时有 ' + n + ' 条上报，人流适中', source: 'report' };
    }

    /* ② 历史规律 */
    if ((v.closedDays || []).indexOf(wd) >= 0) return { level: 'closed', why: '按历史规律，今天闭馆', source: 'history' };
    if (v.teachingBlock && wd >= 1 && wd <= 5 && inAny(cur, v.teachingBlock)) return { level: 'unavailable', why: '教学时段占用，建议改期或换场地', source: 'history' };
    if (inAny(cur, v.peak)) return { level: 'busy', why: '按历史规律，这个时段通常是高峰', source: 'history' };
    if (inAny(cur, v.mid)) return { level: 'normal', why: '按历史规律，这个时段人流中等', source: 'history' };
    if (inAny(cur, v.free)) return { level: 'free', why: '按历史规律，这个时段通常空闲', source: 'history' };

    for (var i = 0; i < CROWD_RULES.length; i++) {
      var r = CROWD_RULES[i];
      if (r.test(now.getHours(), now.getMinutes(), wd, v)) return { level: r.level, why: '按历史规律：' + r.why, source: 'history' };
    }

    /* ③ 默认 */
    return { level: 'normal', why: '暂无数据，欢迎上报', source: 'default' };
  }

  function levelClass(l) { return l === 'busy' ? 'busy' : l === 'free' ? 'free' : l === 'normal' ? 'normal' : 'closed'; }

  function historyHint(v) {
    var peakLen = (v.peak || []).length, midLen = (v.mid || []).length;
    if ((v.closedDays || []).length) return '往年经验：有固定闭馆日';
    if (peakLen >= 2) return '往年经验：通常比较挤（模拟数据，仅供参考）';
    if (peakLen === 1) return '往年经验：偶尔会挤（模拟数据，仅供参考）';
    if (midLen) return '往年经验：人流一般（模拟数据，仅供参考）';
    return '往年经验：一般不挤（模拟数据，仅供参考）';
  }

  /* ---------- 渲染 ---------- */
  function visible() {
    var base = CAMPUS_VENUES.filter(function (v) { return state.q ? true : v.campus === state.campus; });
    if (!state.q) return base;
    var q = state.q;
    return base.filter(function (v) { return (v.name + v.type + v.note + v.campus).indexOf(q) >= 0; });
  }

  function render() {
    var box = $('venueBody');
    if (!box) return;
    var list = visible();
    var q = state.q;

    var html = '<div class="card venue-head">' +
      '<h2 class="hero-title sm">先看一眼，再决定去哪练。</h2>' +
      '<p class="hint">去之前看一眼，到了点一下「人多 / 适中 / 人少」——数据只存本机，不上传。</p>' +
      '<div class="search-wrap"><input type="search" id="venueSearch" placeholder="全校区搜场馆：游泳 / 羽毛球 / 田径场" value="' + esc(q) + '" />' +
      '<button class="search-clear' + (q ? '' : ' hide') + '" id="btnVenueClear">×</button></div>' +
      (q ? '<div class="search-mode">当前为全校区搜索，共 ' + list.length + ' 个结果</div>' : '') +
      '<div class="chips-scroll" id="campusChips">' + CAMPUS_LIST.map(function (c) {
        return '<button class="chip-btn' + (!q && state.campus === c ? ' on' : '') + '" data-campus="' + c + '">' + c.replace('校区', '').replace('广州', '') + '</button>';
      }).join('') + '</div>' +
      '</div>';

    /* 地图 */
    html += '<div class="card map-card"><div class="map-label">' + esc(q ? '全校区' : state.campus) + ' · 示意图</div>' +
      svgMap(list, q ? null : state.campus) +
      '<div class="map-note">示意图 · 非精确比例，仅表示场馆相对位置 · 共 ' + list.length + ' 个场馆</div></div>';

    html += '<div class="venue-list">' + list.map(function (v) {
      var c = crowdOf(v);
      var cls = levelClass(c.level);
      var reports = reportsFor(v.id);
      var alt = '';
      if (c.level === 'busy' || c.level === 'unavailable' || c.level === 'closed') {
        var better = CAMPUS_VENUES.filter(function (x) {
          return x.campus === v.campus && x.id !== v.id && x.type === v.type && ['free', 'normal'].indexOf(crowdOf(x).level) >= 0;
        })[0];
        if (better) alt = '<div class="agent-tip">🤖 ' + esc(v.name) + '现在' + LEVEL_CN[c.level] + '，建议改去 <b>' + esc(better.name) + '</b>。</div>';
      }
      return '<article class="venue-card' + (state.highlight === v.id ? ' hl' : '') + '" data-vid="' + v.id + '">' +
        '<div class="vc-head"><h3>' + esc(v.name) + '</h3><span class="crowd-badge ' + cls + '"><i></i>' + LEVEL_CN[c.level] + '</span></div>' +
        '<p class="vc-type">' + esc(v.type) + ' · ' + esc(v.hours) + '</p>' +
        '<p class="vc-note">' + esc(v.note) + '</p>' +
        '<p class="vc-why">' + esc(c.why) + (c.source === 'history' ? '（历史规律，模拟数据）' : c.source === 'default' ? '' : '') + '</p>' +
        '<p class="vc-hist">' + historyHint(v) + '</p>' +
        alt +
        '<div class="vc-foot"><span class="muted">' + (reports.length ? reports.length + ' 条近 2 小时上报' : '暂无实时上报') + '</span>' +
        '<div class="report-row">' +
        '<button class="rep" data-rep="busy" data-vid="' + v.id + '">人多</button>' +
        '<button class="rep" data-rep="normal" data-vid="' + v.id + '">适中</button>' +
        '<button class="rep" data-rep="free" data-vid="' + v.id + '">人少</button>' +
        '</div></div></article>';
    }).join('') + '</div>';

    box.innerHTML = html;

    $('venueSearch').oninput = function () {
      state.q = this.value.trim();
      $('btnVenueClear').classList.toggle('hide', !state.q);
      render();
      var s = $('venueSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    };
    $('btnVenueClear').onclick = function () { state.q = ''; render(); };

    box.querySelectorAll('[data-campus]').forEach(function (b) {
      b.onclick = function () { state.campus = b.dataset.campus; state.q = ''; render(); };
    });
    box.querySelectorAll('.venue-card').forEach(function (c) {
      c.onclick = function (e) {
        if (e.target.closest('.rep')) return;
        state.highlight = c.dataset.vid;
        box.querySelectorAll('.venue-card').forEach(function (x) { x.classList.toggle('hl', x === c); });
      };
    });
    box.querySelectorAll('[data-rep]').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var all = load(LS_REPORTS, {});
        (all[b.dataset.vid] = all[b.dataset.vid] || []).push({ level: b.dataset.rep, t: Date.now() });
        save(LS_REPORTS, all);
        render();
      };
    });
    box.querySelectorAll('.map-dot').forEach(function (d) {
      d.onclick = function () {
        state.highlight = d.dataset.vid;
        var card = box.querySelector('.venue-card[data-vid="' + d.dataset.vid + '"]');
        box.querySelectorAll('.venue-card').forEach(function (x) { x.classList.toggle('hl', x === card); });
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
  }

  function svgMap(list, campus) {
    var dots = list.map(function (v) {
      var c = crowdOf(v);
      return '<g class="map-dot" data-vid="' + v.id + '" transform="translate(' + v.x + ',' + v.y + ')">' +
        '<circle r="5.2" class="dot-ring ' + levelClass(c.level) + '"></circle>' +
        '<circle r="2.1" class="dot-core"></circle>' +
        '<text x="0" y="-7" class="dot-label">' + esc(v.name.length > 7 ? v.name.slice(0, 7) : v.name) + '</text></g>';
    }).join('');
    return '<svg viewBox="0 0 100 100" class="campus-map" role="img" aria-label="校区示意图">' +
      '<rect width="100" height="100" fill="#fbf4e4"/>' +
      '<path d="M8 30 H92 M8 66 H92 M30 8 V92 M68 8 V92" stroke="#e6d9c2" stroke-width="2.6" fill="none"/>' +
      '<rect x="34" y="34" width="16" height="12" fill="#efe5d1" stroke="#d9cbb2" stroke-width=".8"/>' +
      '<rect x="54" y="36" width="12" height="10" fill="#efe5d1" stroke="#d9cbb2" stroke-width=".8"/>' +
      '<path d="M0 86 Q30 80 60 86 T100 84 L100 100 L0 100 Z" fill="#dfe9dd"/>' +
      '<text x="4" y="8" class="map-name">' + esc(campus || '全校区') + '</text>' +
      dots + '</svg>';
  }

  window.VenuesUI = {
    init: function () { if (document.getElementById('venueBody')) render(); },
    render: render,
    crowdOf: crowdOf
  };
})();
