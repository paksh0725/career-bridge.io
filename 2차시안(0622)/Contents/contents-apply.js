/**
 * CB_CONTENTS → DOM 자동 반영 (차트·KPI·사이드바)
 * 로드 순서: contents-bundle.js → contents-apply.js → work-tool-charts.js
 */
(function applyCareerBridgeContents() {
  var C = window.CB_CONTENTS;
  if (!C) return;

  function applyChart(chart) {
    if (!chart || !chart.ariaLabel) return;
    var el = document.querySelector('.line-chart-host[aria-label="' + chart.ariaLabel + '"]');
    if (!el) return;
    el.setAttribute('data-labels', JSON.stringify(chart.labels || []));
    el.setAttribute('data-series', JSON.stringify(chart.series || []));
    if (chart.suffix) el.setAttribute('data-suffix', chart.suffix);
    el.classList.remove('line-chart-ready');
    el.innerHTML = '';
  }

  function applyChartsForPage(pageKey) {
    var portal = pageKey.split('/')[0];
    var pageCharts = (C.charts[portal] || {})[pageKey];
    if (!pageCharts) return;
    Object.keys(pageCharts).forEach(function (k) {
      applyChart(pageCharts[k]);
    });
  }

  function applyKpis(pageKey) {
    var block = (C.kpis.pages || {})[pageKey];
    if (!block || !block.kpis) return;
    document.querySelectorAll('.wt-mock-kpi-item').forEach(function (el, i) {
      var kpi = block.kpis[i];
      if (!kpi) return;
      var strong = el.querySelector('strong');
      var em = el.querySelector('em');
      if (strong) strong.textContent = kpi.label;
      if (em) em.textContent = kpi.value;
    });
    document.querySelectorAll('.stat-card').forEach(function (el, i) {
      var kpi = block.kpis[i];
      if (!kpi) return;
      var num = el.querySelector('.num');
      var lbl = el.querySelector('.lbl');
      if (num) num.textContent = kpi.value;
      if (lbl) lbl.textContent = kpi.label;
    });
  }

  function applySidebar(pageKey) {
    var block = (C.kpis.pages || {})[pageKey];
    if (!block || !block.sidebar) return;
    var mgrId = block.sidebar.managerId;
    var admins = C.users.admins || [];
    var managers = C.users.managers || [];
    var person = admins.find(function (a) { return a.id === mgrId; }) ||
      managers.find(function (m) { return m.id === mgrId; });
    if (!person) return;
    var nameInput = document.querySelector('.wt-panel-summary input[readonly], aside input[value*="관리자"], aside input[value*="과장"], aside input[value*="담당자"]');
    var memoArea = document.querySelector('.wt-panel-summary textarea[readonly], aside textarea[readonly]');
    if (nameInput && person.nameFull) nameInput.value = person.nameFull;
    if (memoArea && (block.sidebar.memo || person.memo)) memoArea.value = block.sidebar.memo || person.memo;
  }

  function studentsForJs() {
    return (C.users.students || []).map(function (s) {
      return {
        name: s.name,
        nameKo: s.nameKo,
        school: s.school,
        major: s.major,
        nation: s.nation,
        topik: s.topik,
        tags: s.tags,
        init: s.init,
        matchScore: s.matchScore,
        plan: s.jobReady,
        doc: s.documents && s.documents.every(function (d) { return d.status !== '미등록'; }) ? '문서 완료' : '문서 미완료',
        support: s.tags.indexOf('취업 준비') >= 0 ? '상담 예정' : '관리 중',
      };
    });
  }

  function detectPageKey() {
    var path = (location.pathname || '').replace(/\\/g, '/');
    var parts = path.split('/');
    var file = parts[parts.length - 1] || 'index.html';
    var folder = parts[parts.length - 2] || '';
    if (['admin', 'company', 'institution', 'student'].indexOf(folder) >= 0) {
      return folder + '/' + file;
    }
    return file;
  }


  function installCommunityData() {
    var all = (C.shared && C.shared['community-posts']) || [];
    if (!all.length || !document.getElementById('commList')) return;
    var posts = all.filter(function (p) { return p.cat !== 'poll'; });
    var polls = all.filter(function (p) { return p.cat === 'poll'; });
    var pageSize = 14;
    var currentPage = 1;
    window.COMM_POSTS = posts;
    window.COMM_POLLS = polls.map(function (p) {
      return Object.assign({}, p, { q: p.q || p.title, cnt: p.cnt || p.participants || 0, dday: p.dday || 5 });
    });
    function getFilter() {
      var active = document.querySelector('.comm-cat-btn.active');
      return active ? active.dataset.cat : 'all';
    }
    function filteredPosts(cat) {
      var f = cat || getFilter();
      var countryEl = document.getElementById('commCountry');
      var schoolEl = document.getElementById('commSchool');
      var country = countryEl ? countryEl.value : '';
      var school = schoolEl ? schoolEl.value : '';
      if (f === 'poll') return [];
      return posts.filter(function (p) {
        return (f === 'all' || p.cat === f) && (!country || p.country === country) && (!school || p.school === school);
      });
    }
    function pagerHtml(total, page) {
      var pages = Math.max(1, Math.ceil(total / pageSize));
      var html = '<div class="cb-comm-pager" style="display:flex;justify-content:center;gap:6px;margin-top:14px;flex-wrap:wrap;">';
      for (var i = 1; i <= pages; i++) {
        html += '<button type="button" class="mini-btn' + (i === page ? ' approve' : '') + '" onclick="CB_setCommunityPage(' + i + ')" style="min-width:32px;">' + i + '</button>';
      }
      html += '</div>';
      return html;
    }
    window.CB_setCommunityPage = function (page) { currentPage = page || 1; window.renderCommList(getFilter()); };
    window.renderCommList = function (cat) {
      var f = cat || getFilter();
      var listEl = document.getElementById('commList');
      var pollEl = document.getElementById('commPollList');
      if (!listEl || !pollEl) return;
      if (f === 'poll') {
        listEl.style.display = 'none';
        pollEl.style.display = 'block';
        window.renderPolls();
        return;
      }
      listEl.style.display = 'block';
      pollEl.style.display = 'none';
      var list = filteredPosts(f);
      var pages = Math.max(1, Math.ceil(list.length / pageSize));
      if (currentPage > pages) currentPage = pages;
      var start = (currentPage - 1) * pageSize;
      var pageList = list.slice(start, start + pageSize);
      if (listEl.className.indexOf('comm-table-wrap') >= 0 || document.querySelector('.comm-table')) {
        listEl.innerHTML = '<div class="comm-table-wrap"><table class="comm-table"><thead><tr><th>분류</th><th>제목</th><th>작성자/기관</th><th>조회</th><th>댓글</th></tr></thead><tbody>' + pageList.map(function (p, i) {
          var idx = posts.indexOf(p);
          return '<tr onclick="openPost && openPost(' + idx + ')"><td><span class="comm-post-tag ' + p.cat + '">' + p.tag + '</span></td><td class="tcell-strong">' + p.title + '</td><td>' + p.by + '</td><td>' + p.views + '</td><td>' + (p.comments || p.cmt || 0) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + pagerHtml(list.length, currentPage);
      } else {
        listEl.innerHTML = pageList.map(function (p) {
          var idx = posts.indexOf(p);
          return '<div class="comm-post" onclick="openPost && openPost(' + idx + ')"><div><span class="comm-post-tag ' + p.cat + '">' + p.tag + '</span><div class="comm-post-title">' + p.title + '</div><div class="comm-post-meta">' + p.by + ' · 조회 ' + p.views + ' · 댓글 ' + (p.comments || p.cmt || 0) + '</div><div style="font-size:11px;color:#6B8CAE;margin-top:4px;">' + (p.content || '') + '</div></div></div>';
        }).join('') + pagerHtml(list.length, currentPage);
      }
    };
    window.renderPolls = function () {
      var pollEl = document.getElementById('commPollList');
      if (!pollEl) return;
      pollEl.innerHTML = window.COMM_POLLS.map(function (p, i) {
        return '<div class="poll-card"><div class="poll-q" onclick="openPoll(' + i + ')">' + (p.q || p.title) + '</div><span class="poll-badge ' + (p.badge || 'poll') + '">' + (p.badgeLabel || '공식 투표') + '</span><span style="font-size:11px;color:#6B8CAE;">' + (p.org || p.by) + '</span><div class="poll-meta"><span>참여 ' + (p.cnt || p.participants || 0) + '명</span><span>D-' + (p.dday || 5) + '</span><button class="poll-vote-btn" onclick="openPoll(' + i + ')">투표하기</button></div></div>';
      }).join('');
    };
    window.openPost = function (i) {
      var p = posts[i];
      if (!p) return;
      var title = document.getElementById('postDetailTitle');
      var meta = document.getElementById('postDetailMeta');
      var content = document.getElementById('postDetailContent');
      if (title && meta && content) {
        title.textContent = p.title;
        meta.textContent = p.by + ' · 조회 ' + p.views;
        content.textContent = p.content || p.title;
        if (typeof openModal === 'function') openModal('postDetailModal');
      } else if (window.demoToast) window.demoToast(p.title + ' 상세 보기');
    };
    setTimeout(function () { window.renderCommList(getFilter()); }, 0);
  }

  function boot() {
    var pageKey = detectPageKey();
    applyChartsForPage(pageKey);
    applyKpis(pageKey);
    applySidebar(pageKey);
    installCommunityData();
    window.CB_STUDENTS = studentsForJs();
    if (typeof window.initLineCharts === 'function') window.initLineCharts();
  }

  window.CB_applyContents = boot;
  window.CB_getStudents = studentsForJs;
  window.CB_getStudent = function (id) {
    return (C.users.students || []).find(function (s) { return s.id === id; });
  };
  window.CB_getMessages = function () {
    return C.messages.threads || [];
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
