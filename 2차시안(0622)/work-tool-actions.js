(function initWorkToolActions() {
  if (window.__wtActionsInit) return;
  window.__wtActionsInit = true;

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function toast(message) {
    var el = document.getElementById('demoToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demoToast';
      el.className = 'demo-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__demoToastTimer);
    window.__demoToastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2200);
  }
  window.demoToast = window.demoToast || toast;

  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('show');
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }
  window.openModal = window.openModal || openModal;
  window.closeModal = window.closeModal || closeModal;

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  }

  function getActiveThreadIndex() {
    var active = document.querySelector('.msg-item.active');
    if (active && active.dataset.threadIndex != null) return Number(active.dataset.threadIndex);
    var items = document.querySelectorAll('.msg-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i].classList.contains('active')) return i;
    }
    return 0;
  }

  function getActiveThread() {
    if (typeof chats === 'undefined') return null;
    return chats[getActiveThreadIndex()] || chats[0];
  }

  var APPLICANT_PROFILES = {
    '왕샤오밍': {
      nation: '중국',
      school: '경희대학교',
      major: '경영학과 4학년',
      topik: '5급',
      visa: 'D-2 (학생)',
      match: '92',
      docs: '이력서 · 자기소개서 · TOPIK 성적',
      interest: '글로벌 마케팅 · 무역',
      timeline: ['06-18 채용 문의 접수', '06-20 1차 연락 발송', '06-21 화상 면접 일정 제안', '06-22 지원자 일정 확인'],
    },
    '응웬티란': {
      nation: '베트남',
      school: '연세대학교',
      major: '컴퓨터공학 3학년',
      topik: '4급',
      visa: 'D-2 (학생)',
      match: '84',
      docs: '이력서 · 포트폴리오',
      interest: '백엔드 개발 · 데이터',
      timeline: ['06-19 채용 공고 문의', '06-20 담당자 1차 회신'],
    },
    '딜노자': {
      nation: '우즈베키스탄',
      school: '한양대학교',
      major: '경제학 4학년',
      topik: '5급',
      visa: 'D-2 (학생)',
      match: '79',
      docs: '이력서 · 자기소개서(첨부)',
      interest: '금융 · 재무 분석',
      timeline: ['06-17 자기소개서 요청', '06-18 서류 첨부 완료'],
    },
    '천지아이': {
      nation: '중국',
      school: '고려대학교',
      major: '미디어학과 3학년',
      topik: '4급',
      visa: 'D-2 (학생)',
      match: '76',
      docs: '이력서',
      interest: '콘텐츠 · 미디어 인턴',
      timeline: ['06-15 인턴십 지원 의향 문의'],
    },
    '박준혁': {
      nation: '한국',
      school: '경희대학교',
      major: '국제학과',
      topik: '6급(모국어)',
      visa: '-',
      match: '88',
      docs: '상담 기록 · 지원서',
      interest: '취업지원 프로그램',
      timeline: ['06-20 상담 예약 요청', '06-21 프로그램 안내 발송'],
    },
    '김민수': {
      nation: '베트남',
      school: '연세대학교',
      major: '경영학과',
      topik: '5급',
      visa: 'D-2',
      match: '81',
      docs: '이력서 · 성적증명',
      interest: '국내 기업 취업',
      timeline: ['06-19 기관 안내 수신', '06-20 서류 보완 요청'],
    },
  };

  function profileForThread(thread) {
    if (!thread) return null;
    var name = thread.name || '';
    var keys = Object.keys(APPLICANT_PROFILES);
    for (var i = 0; i < keys.length; i++) {
      if (name.indexOf(keys[i]) >= 0) return APPLICANT_PROFILES[keys[i]];
    }
    return {
      nation: (thread.sub || '').split('·')[2] || '-',
      school: (thread.sub || '').split('·')[1] || '-',
      major: '-',
      topik: '-',
      visa: '-',
      match: '-',
      docs: '등록 문서 없음',
      interest: '-',
      timeline: ['최근 메시지 기준 상담 진행 중'],
    };
  }

  function ensureApplicantModal() {
    if (document.getElementById('wtApplicantDetailModal')) return;
    var wrap = document.createElement('div');
    wrap.className = 'modal-overlay';
    wrap.id = 'wtApplicantDetailModal';
    wrap.innerHTML =
      '<div class="modal wt-detail-modal">' +
      '<div class="modal-head-blue"><div><h3 id="wtDetailTitle">지원자 상세</h3><p id="wtDetailSub">프로필 · 문서 · 처리 이력</p></div>' +
      '<button type="button" class="close-btn" onclick="closeModal(\'wtApplicantDetailModal\')"><svg viewBox="0 0 24 24"><path fill="#fff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>' +
      '<div class="modal-body" id="wtDetailBody"></div>' +
      '<div class="modal-foot"><button type="button" class="btn-cancel" onclick="closeModal(\'wtApplicantDetailModal\')">닫기</button>' +
      '<button type="button" class="btn-confirm" id="wtDetailMsgBtn">메시지 보내기</button></div></div>';
    document.body.appendChild(wrap);
  }

  function showApplicantDetail(thread) {
    ensureApplicantModal();
    var p = profileForThread(thread);
    document.getElementById('wtDetailTitle').textContent = thread.name;
    document.getElementById('wtDetailSub').textContent = thread.sub || '';
    document.getElementById('wtDetailBody').innerHTML =
      '<div class="wt-detail-grid">' +
      '<div class="wt-detail-kv"><span>국적</span><strong>' +
      p.nation +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>학교</span><strong>' +
      p.school +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>전공</span><strong>' +
      p.major +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>TOPIK</span><strong>' +
      p.topik +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>비자</span><strong>' +
      p.visa +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>Match</span><strong>' +
      p.match +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>관심 분야</span><strong>' +
      p.interest +
      '</strong></div>' +
      '<div class="wt-detail-kv"><span>공개 문서</span><strong>' +
      p.docs +
      '</strong></div></div>' +
      '<h4 class="wt-detail-section">처리 타임라인</h4><ul class="wt-detail-timeline">' +
      p.timeline.map(function (t) {
        return '<li>' + t + '</li>';
      }).join('') +
      '</ul>' +
      '<h4 class="wt-detail-section">최근 대화</h4><div class="wt-detail-msgs">' +
      (thread.msgs || [])
        .map(function (m) {
          return '<p><em>' + (m.from === 'me' ? '담당자' : '지원자') + '</em> ' + stripHtml(m.text) + '</p>';
        })
        .join('') +
      '</div>';
    var msgBtn = document.getElementById('wtDetailMsgBtn');
    if (msgBtn) {
      msgBtn.onclick = function () {
        closeModal('wtApplicantDetailModal');
        var input = document.getElementById('chatInput');
        if (input) {
          input.focus();
          toast(thread.name.split('(')[0].trim() + ' 님에게 메시지를 입력하세요.');
        }
      };
    }
    openModal('wtApplicantDetailModal');
  }

  function ensureComposeModal() {
    if (document.getElementById('wtComposeModal')) return;
    var wrap = document.createElement('div');
    wrap.className = 'modal-overlay';
    wrap.id = 'wtComposeModal';
    wrap.innerHTML =
      '<div class="modal"><div class="modal-head"><div><h3>새 메시지 작성</h3><p>지원자 또는 협력 기관에 메시지를 발송합니다.</p></div>' +
      '<button type="button" class="close-btn-dark" onclick="closeModal(\'wtComposeModal\')"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>' +
      '<div class="modal-body"><div class="fg"><label>받는 사람</label><input id="wtComposeTo" placeholder="이름 또는 이메일"></div>' +
      '<div class="fg"><label>제목</label><input id="wtComposeSubject" placeholder="메시지 제목"></div>' +
      '<div class="fg"><label>내용</label><textarea id="wtComposeBody" rows="5" placeholder="메시지 내용을 입력하세요"></textarea></div></div>' +
      '<div class="modal-foot"><button type="button" class="btn-cancel" onclick="closeModal(\'wtComposeModal\')">취소</button>' +
      '<button type="button" class="btn-confirm" id="wtComposeSendBtn">발송하기</button></div></div>';
    document.body.appendChild(wrap);
    document.getElementById('wtComposeSendBtn').addEventListener('click', function () {
      var to = (document.getElementById('wtComposeTo').value || '').trim();
      var subj = (document.getElementById('wtComposeSubject').value || '').trim();
      var body = (document.getElementById('wtComposeBody').value || '').trim();
      if (!to || !body) {
        toast('받는 사람과 내용을 입력해주세요.');
        return;
      }
      closeModal('wtComposeModal');
      toast((subj ? '「' + subj + '」' : '메시지') + '를 ' + to + ' 님에게 발송했습니다.');
    });
  }

  function ensurePreviewOverlay() {
    if (document.getElementById('wtPreviewOverlay')) return;
    var el = document.createElement('div');
    el.className = 'wt-preview-overlay';
    el.id = 'wtPreviewOverlay';
    el.innerHTML =
      '<div class="wt-preview-sheet" role="dialog" aria-label="미리보기">' +
      '<header class="wt-preview-head"><strong id="wtPreviewTitle">미리보기</strong>' +
      '<button type="button" class="wt-preview-close" id="wtPreviewClose">닫기</button></header>' +
      '<div class="wt-preview-body" id="wtPreviewBody"></div>' +
      '<footer class="wt-preview-foot"><button type="button" class="wt-action-btn" id="wtPreviewPrint">인쇄</button>' +
      '<button type="button" class="wt-tool-btn" id="wtPreviewDismiss">확인</button></footer></div>';
    document.body.appendChild(el);
    document.getElementById('wtPreviewClose').onclick = closePreview;
    document.getElementById('wtPreviewDismiss').onclick = closePreview;
    document.getElementById('wtPreviewPrint').onclick = function () {
      window.print();
    };
    el.addEventListener('click', function (e) {
      if (e.target === el) closePreview();
    });
  }

  function openPreview(title, html) {
    ensurePreviewOverlay();
    document.getElementById('wtPreviewTitle').textContent = title;
    document.getElementById('wtPreviewBody').innerHTML = html;
    document.getElementById('wtPreviewOverlay').classList.add('show');
  }
  function closePreview() {
    var el = document.getElementById('wtPreviewOverlay');
    if (el) el.classList.remove('show');
  }

  function exportTableCsv() {
    var table = document.querySelector(
      '.adm-table-wrap table, .wt-sheet-scroll table, .sheet-wrap table, table.sheet, table.data-grid'
    );
    if (!table) return null;
    var rows = table.querySelectorAll('tr');
    var lines = [];
    rows.forEach(function (tr) {
      var cells = tr.querySelectorAll('th, td');
      var row = [];
      cells.forEach(function (cell) {
        row.push('"' + stripHtml(cell.innerHTML).replace(/"/g, '""') + '"');
      });
      if (row.length) lines.push(row.join(','));
    });
    return lines.join('\n');
  }

  function isMessagePage() {
    return page.indexOf('messages.html') >= 0 || !!document.querySelector('.wt-msg-workspace');
  }

  window.wtAddOrg = window.wtAddOrg || function () {
    toast('협력 기관 등록은 관리자 콘솔에서 처리됩니다.');
  };

  window.wtApprove = function () {
    if (isMessagePage() && typeof chats !== 'undefined') {
      var thread = getActiveThread();
      if (!thread) {
        toast('대화를 선택해주세요.');
        return;
      }
      var statusEl = document.getElementById('ctxStatus');
      if (statusEl) statusEl.textContent = '승인 완료';
      var state = document.getElementById('ctxState');
      if (state) state.value = '면접 확정';
      var activeItem = document.querySelector('.msg-item.active');
      if (activeItem) {
        activeItem.classList.remove('unread');
        var dot = activeItem.querySelector('.unread-dot');
        if (dot) dot.remove();
      }
      toast(thread.name.split('(')[0].trim() + ' 님 건을 승인 처리했습니다.');
      return;
    }
    if (typeof selectedCards !== 'undefined' && selectedCards && selectedCards.size > 0) {
      toast(selectedCards.size + '건을 승인 처리했습니다.');
      return;
    }
    if (typeof openDrawer === 'function' && document.querySelector('.adm-row:not(.resolved)')) {
      toast('첫 번째 대기 항목을 승인 처리했습니다.');
      return;
    }
    toast('항목을 선택한 뒤 승인처리를 진행하세요.');
  };

  window.wtExport = function () {
    if (isMessagePage() && typeof chats !== 'undefined') {
      var thread = getActiveThread();
      if (!thread) {
        toast('보낼 대화를 선택해주세요.');
        return;
      }
      var lines = ['대화 상대: ' + thread.name, '요약: ' + (thread.sub || ''), '---'];
      (thread.msgs || []).forEach(function (m) {
        lines.push((m.from === 'me' ? '[담당자]' : '[지원자]') + ' ' + stripHtml(m.text));
      });
      var fname = 'message-' + thread.avatar + '-' + new Date().toISOString().slice(0, 10) + '.txt';
      downloadText(fname, lines.join('\n'));
      toast('대화 내역 파일을 내려받았습니다. (' + fname + ')');
      return;
    }
    var csv = exportTableCsv();
    if (csv) {
      var name = page.replace('.html', '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
      downloadText(name, '\uFEFF' + csv);
      toast('표 데이터를 CSV 파일로 내려받았습니다.');
      return;
    }
    toast('보낼 데이터가 없습니다. 목록이나 대화를 먼저 열어주세요.');
  };

  window.wtPreview = function () {
    if (isMessagePage() && typeof chats !== 'undefined') {
      var thread = getActiveThread();
      if (!thread) {
        toast('미리볼 대화를 선택해주세요.');
        return;
      }
      var html =
        '<h3>' +
        thread.name +
        '</h3><p class="wt-preview-meta">' +
        (thread.sub || '') +
        '</p><hr>' +
        (thread.msgs || [])
          .map(function (m) {
            return '<p><strong>' + (m.from === 'me' ? '담당자' : '지원자') + '</strong><br>' + stripHtml(m.text) + '</p>';
          })
          .join('');
      openPreview('메시지 인쇄 미리보기 — ' + thread.name.split('(')[0].trim(), html);
      return;
    }
    var table = document.querySelector('.adm-table-wrap, .wt-sheet-scroll, .sheet-wrap');
    if (table) {
      openPreview('목록 미리보기', table.innerHTML);
      toast('현재 화면 미리보기를 열었습니다.');
      return;
    }
    toast('미리볼 내용이 없습니다.');
  };

  window.wtViewDetail = function () {
    if (isMessagePage() && typeof chats !== 'undefined') {
      var thread = getActiveThread();
      if (!thread) {
        toast('상세를 볼 대화를 선택해주세요.');
        return;
      }
      showApplicantDetail(thread);
      var panel = document.querySelector('.context-panel');
      if (panel) {
        panel.classList.add('wt-detail-focus');
        setTimeout(function () {
          panel.classList.remove('wt-detail-focus');
        }, 1200);
      }
      if (typeof updateContextPanel === 'function') updateContextPanel(getActiveThreadIndex());
      return;
    }
    if (typeof openDetailModal === 'function') {
      var idx = 0;
      if (typeof selectedCards !== 'undefined' && selectedCards && selectedCards.size > 0) {
        idx = Array.from(selectedCards)[0];
      }
      openDetailModal(idx);
      return;
    }
    if (typeof openDrawer === 'function') {
      var row = document.querySelector('.adm-row, .adm-table tbody tr');
      if (row && row.onclick) row.click();
      else toast('상세를 열 항목이 없습니다.');
      return;
    }
    var firstRow = document.querySelector('.adm-table tbody tr, table.sheet tbody tr, table.data-grid tbody tr');
    if (firstRow) {
      firstRow.click();
      toast('첫 번째 항목 상세를 열었습니다.');
      return;
    }
    toast('자세히 볼 항목을 선택해주세요.');
  };

  function filterInbox(query) {
    var q = (query || '').trim().toLowerCase();
    document.querySelectorAll('.msg-item').forEach(function (item) {
      var text = (item.textContent || '').toLowerCase();
      item.style.display = !q || text.indexOf(q) >= 0 ? '' : 'none';
    });
  }

  function bindMessageInteractions() {
    if (!document.querySelector('.msg-layout')) return;

    document.querySelectorAll('.compose-btn').forEach(function (btn) {
      if (btn.dataset.wtBound) return;
      btn.dataset.wtBound = '1';
      btn.addEventListener('click', function () {
        ensureComposeModal();
        var thread = getActiveThread();
        if (thread) document.getElementById('wtComposeTo').value = thread.name.split('(')[0].trim();
        openModal('wtComposeModal');
      });
    });

    document.querySelectorAll('.chat-action').forEach(function (btn) {
      if (btn.dataset.wtBound) return;
      btn.dataset.wtBound = '1';
      var label = (btn.textContent || '').trim();
      btn.addEventListener('click', function () {
        if (label.indexOf('프로필') >= 0) {
          wtViewDetail();
        } else if (label.indexOf('고정') >= 0) {
          btn.classList.toggle('active');
          toast(btn.classList.contains('active') ? '대화를 상단에 고정했습니다.' : '고정을 해제했습니다.');
        }
      });
    });

    document.querySelectorAll('.context-actions .grid-btn').forEach(function (btn) {
      if (btn.dataset.wtBound) return;
      btn.dataset.wtBound = '1';
      var label = (btn.textContent || '').trim();
      btn.addEventListener('click', function () {
        if (label.indexOf('번역') >= 0) {
          document.querySelectorAll('.msg-translate-btn').forEach(function (b) {
            b.click();
          });
          toast('대화 메시지 번역을 토글했습니다.');
        } else if (label.indexOf('프로필') >= 0) {
          wtViewDetail();
        }
      });
    });

    var searchInput = document.querySelector('.inbox-search input');
    if (searchInput && !searchInput.dataset.wtBound) {
      searchInput.dataset.wtBound = '1';
      searchInput.addEventListener('input', function () {
        filterInbox(searchInput.value);
      });
    }

    var ctxState = document.getElementById('ctxState');
    if (ctxState && !ctxState.dataset.wtBound) {
      ctxState.dataset.wtBound = '1';
      ctxState.addEventListener('change', function () {
        var statusEl = document.getElementById('ctxStatus');
        if (statusEl) statusEl.textContent = ctxState.value;
        toast('처리 상태를 「' + ctxState.value + '」(으)로 변경했습니다.');
      });
    }

    var ctxMemo = document.getElementById('ctxMemo');
    if (ctxMemo && !ctxMemo.dataset.wtBound) {
      ctxMemo.dataset.wtBound = '1';
      ctxMemo.addEventListener('blur', function () {
        if ((ctxMemo.value || '').trim()) toast('담당자 메모를 저장했습니다.');
      });
    }

    var origSend = window.sendMsg;
    if (typeof origSend === 'function' && !origSend.__wtWrapped) {
      window.sendMsg = function () {
        var input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) {
          toast('보낼 메시지를 입력해주세요.');
          return;
        }
        var text = input.value.trim();
        var idx = getActiveThreadIndex();
        if (typeof chats !== 'undefined' && chats[idx]) {
          if (!chats[idx].msgs) chats[idx].msgs = [];
          chats[idx].msgs.push({ from: 'me', text: text });
        }
        origSend();
        toast('메시지를 발송했습니다.');
      };
      window.sendMsg.__wtWrapped = true;
    }

    document.querySelectorAll('.msg-item').forEach(function (item, idx) {
      item.dataset.threadIndex = String(idx);
    });
  }

  function bindTableRowClicks() {
    document.querySelectorAll('.adm-table tbody tr, table.sheet tbody tr, table.data-grid tbody tr').forEach(function (row) {
      if (row.dataset.wtRowBound) return;
      row.dataset.wtRowBound = '1';
      row.style.cursor = 'pointer';
      row.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select, label')) return;
        document.querySelectorAll('.wt-row-selected').forEach(function (r) {
          r.classList.remove('wt-row-selected');
        });
        row.classList.add('wt-row-selected');
      });
    });
  }

  function init() {
    bindMessageInteractions();
    bindTableRowClicks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var observer = new MutationObserver(function () {
    bindMessageInteractions();
    bindTableRowClicks();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
