(function initWtSectionSplits() {
  var HANDLE = 12;
  var MIN_TOP = 96;
  var MIN_BOTTOM = 96;
  var KEY_PREFIX = 'wtSplitTop:';
  var dragging = null;

  function isAdminLayout(layout) {
    return (
      layout.classList.contains('adm-section-layout') ||
      !!layout.querySelector(':scope > .adm-dash-summary, :scope > .adm-sheet-zone')
    );
  }

  function applyTop(layout, key, px) {
    var rect = layout.getBoundingClientRect();
    var maxTop = Math.max(MIN_TOP, rect.height - MIN_BOTTOM - HANDLE);
    var top = Math.min(maxTop, Math.max(MIN_TOP, px));
    layout.style.gridTemplateRows =
      top + 'px ' + HANDLE + 'px minmax(' + MIN_BOTTOM + 'px, 1fr)';
    try {
      localStorage.setItem(key, String(top));
    } catch (e) {}
  }

  function createHandle() {
    var handle = document.createElement('div');
    handle.className = 'wt-split-handle adm-split-handle';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'horizontal');
    handle.setAttribute('aria-label', '요약과 목록 영역 높이 조절');
    handle.title = '드래그하여 영역 크기 조절 · 더블클릭으로 초기화';
    return handle;
  }

  /** stack(요약+시트) → split + 드래그 핸들 자동 삽입 */
  function upgradeStackLayouts() {
    var stacks = document.querySelectorAll('.wt-stack-layout, .adm-stack-layout');
    for (var i = 0; i < stacks.length; i++) {
      var layout = stacks[i];
      if (layout.classList.contains('wt-unified-sheet')) continue;
      if (layout.id === 'panel-search') continue;
      if (layout.querySelector('.wt-split-handle, .adm-split-handle')) continue;
      /* 목업 차트·KPI 페이지는 stack + 내부 스크롤 유지 (split 변환 시 admin grid 규칙 누락으로 잘림) */
      if (
        layout.querySelector(
          ':scope > .wt-sheet-zone > .wt-mock-sheet-stack, :scope > .wt-sheet-zone > .wt-sheet-scroll.wt-mock-sheet-stack, :scope > .adm-sheet-zone > .wt-mock-sheet-stack, :scope > .adm-sheet-zone > .adm-sheet-scroll.wt-mock-sheet-stack'
        )
      ) {
        continue;
      }

      var admin =
        isAdminLayout(layout) &&
        !layout.classList.contains('wt-section-layout');
      var top = layout.querySelector(
        admin
          ? ':scope > .adm-dash-summary, :scope > .adm-split-top'
          : ':scope > .wt-panel-summary, :scope > .wt-split-top'
      );
      var bottom = layout.querySelector(
        admin
          ? ':scope > .adm-sheet-zone, :scope > .adm-split-bottom, :scope > .adm-split-bottom-wrap'
          : ':scope > .wt-sheet-zone, :scope > .wt-split-bottom, :scope > .wt-split-bottom-wrap'
      );
      if (!top || !bottom) continue;
      if (!(top.compareDocumentPosition(bottom) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;

      top.classList.add(admin ? 'adm-split-top' : 'wt-split-top');

      var tail = [];
      var node = bottom;
      while (node) {
        tail.push(node);
        node = node.nextElementSibling;
      }

      var wrap = document.createElement('div');
      wrap.className = admin ? 'adm-split-bottom-wrap' : 'wt-split-bottom-wrap';
      layout.insertBefore(wrap, bottom);
      for (var t = 0; t < tail.length; t++) wrap.appendChild(tail[t]);

      var first = wrap.firstElementChild;
      if (first) {
        first.classList.add(admin ? 'adm-split-bottom' : 'wt-split-bottom');
      }

      var handle = createHandle();
      layout.insertBefore(handle, wrap);

      layout.classList.remove('wt-stack-layout', 'adm-stack-layout');
      layout.classList.add(admin ? 'adm-split-layout' : 'wt-split-layout');
      if (!layout.id) layout.id = 'wtSplitAuto' + i;
    }
  }

  function initLayout(layout, index) {
    var handle = layout.querySelector('.wt-split-handle, .adm-split-handle');
    if (!handle) return;

    if (!layout.id) layout.id = 'wtSplitIdx' + index;

    var key = KEY_PREFIX + layout.id;
    var saved = parseInt(localStorage.getItem(key) || '0', 10);
    if (saved > 0) applyTop(layout, key, saved);

    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      dragging = { layout: layout, key: key };
      e.preventDefault();
      document.body.classList.add('wt-split-dragging', 'adm-split-dragging');
    });

    handle.addEventListener(
      'touchstart',
      function (e) {
        dragging = { layout: layout, key: key };
        e.preventDefault();
        document.body.classList.add('wt-split-dragging', 'adm-split-dragging');
      },
      { passive: false }
    );

    handle.addEventListener('dblclick', function () {
      layout.style.removeProperty('grid-template-rows');
      try {
        localStorage.removeItem(key);
      } catch (e2) {}
    });
  }

  upgradeStackLayouts();

  var layouts = document.querySelectorAll('.wt-split-layout, .adm-split-layout');
  for (var i = 0; i < layouts.length; i++) initLayout(layouts[i], i);

  function onMove(clientY) {
    if (!dragging) return;
    var rect = dragging.layout.getBoundingClientRect();
    applyTop(dragging.layout, dragging.key, clientY - rect.top);
  }

  function stopDrag() {
    if (!dragging) return;
    dragging = null;
    document.body.classList.remove('wt-split-dragging', 'adm-split-dragging');
  }

  window.addEventListener('mousemove', function (e) {
    onMove(e.clientY);
  });
  window.addEventListener(
    'touchmove',
    function (e) {
      if (dragging && e.touches[0]) onMove(e.touches[0].clientY);
    },
    { passive: false }
  );
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchcancel', stopDrag);
})();

(function initWtMsgColSplits() {
  var HANDLE = 8;
  var MIN_INBOX = 220;
  var MIN_CHAT = 240;
  var MIN_CTX = 200;
  var KEY_PREFIX = 'wtMsgCols:';
  var dragging = null;

  function createColHandle(which) {
    var handle = document.createElement('div');
    handle.className = 'wt-col-handle';
    handle.dataset.wtCol = which;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute(
      'aria-label',
      which === 'inbox' ? '메시지함과 대화 영역 너비 조절' : '대화와 업무 패널 너비 조절'
    );
    handle.title = '드래그하여 열 너비 조절 · 더블클릭으로 초기화';
    return handle;
  }

  function readSaved(key, fallback) {
    var saved = parseInt(localStorage.getItem(key) || '0', 10);
    return saved > 0 ? saved : fallback;
  }

  function applyCols(ws, state) {
    var ctxVisible =
      state.ctxW > 0 &&
      ws.querySelector('.context-panel') &&
      getComputedStyle(ws.querySelector('.context-panel')).display !== 'none';

    if (ctxVisible) {
      ws.style.gridTemplateColumns =
        'var(--wt-left-w) ' +
        state.inboxW +
        'px ' +
        HANDLE +
        'px minmax(' +
        MIN_CHAT +
        'px, 1fr) ' +
        HANDLE +
        'px ' +
        state.ctxW +
        'px';
    } else {
      ws.style.gridTemplateColumns =
        'var(--wt-left-w) ' +
        state.inboxW +
        'px ' +
        HANDLE +
        'px minmax(' +
        MIN_CHAT +
        'px, 1fr)';
    }
  }

  function upgradeWorkspace(ws, index) {
    if (ws.dataset.msgColsInit === '1') return;
    var inbox = ws.querySelector('.inbox');
    var chat = ws.querySelector('.chat-area');
    var ctx = ws.querySelector('.context-panel');
    if (!inbox || !chat) return;

    ws.dataset.msgColsInit = '1';
    if (!ws.id) ws.id = 'wtMsgWorkspace' + index;

    if (!ws.querySelector('.wt-col-handle')) {
      chat.parentNode.insertBefore(createColHandle('inbox'), chat);
      if (ctx) ctx.parentNode.insertBefore(createColHandle('ctx'), ctx);
    }

    var key = KEY_PREFIX + ws.id;
    var state = {
      key: key,
      inboxW: readSaved(key + ':inbox', 280),
      ctxW: readSaved(key + ':ctx', 260),
    };
    ws.__wtMsgCols = state;
    applyCols(ws, state);

    ws.querySelectorAll('.wt-col-handle').forEach(function (handle) {
      var which = handle.dataset.wtCol;

      handle.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        dragging = { ws: ws, which: which };
        e.preventDefault();
        document.body.classList.add('wt-col-dragging');
      });

      handle.addEventListener(
        'touchstart',
        function (e) {
          dragging = { ws: ws, which: which };
          e.preventDefault();
          document.body.classList.add('wt-col-dragging');
        },
        { passive: false }
      );

      handle.addEventListener('dblclick', function () {
        ws.style.removeProperty('grid-template-columns');
        try {
          localStorage.removeItem(key + ':inbox');
          localStorage.removeItem(key + ':ctx');
        } catch (e2) {}
        state.inboxW = 280;
        state.ctxW = 260;
        applyCols(ws, state);
      });
    });
  }

  var workspaces = document.querySelectorAll('.wt-msg-workspace');
  for (var i = 0; i < workspaces.length; i++) upgradeWorkspace(workspaces[i], i);

  function onMove(clientX) {
    if (!dragging) return;
    var ws = dragging.ws;
    var state = ws.__wtMsgCols;
    if (!state) return;

    var rect = ws.getBoundingClientRect();
    var leftW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--wt-left-w')) || 250;
    var relX = clientX - rect.left - leftW;

    if (dragging.which === 'inbox') {
      var maxInbox = Math.max(MIN_INBOX, rect.width - leftW - state.ctxW - MIN_CHAT - HANDLE * 2 - 20);
      state.inboxW = Math.min(maxInbox, Math.max(MIN_INBOX, relX));
      try {
        localStorage.setItem(state.key + ':inbox', String(state.inboxW));
      } catch (e) {}
    } else if (dragging.which === 'ctx') {
      var ctxW = rect.right - clientX;
      var maxCtx = Math.max(MIN_CTX, rect.width - leftW - state.inboxW - MIN_CHAT - HANDLE * 2 - 20);
      state.ctxW = Math.min(maxCtx, Math.max(MIN_CTX, ctxW));
      try {
        localStorage.setItem(state.key + ':ctx', String(state.ctxW));
      } catch (e2) {}
    }

    applyCols(ws, state);
  }

  function stopDrag() {
    if (!dragging) return;
    dragging = null;
    document.body.classList.remove('wt-col-dragging');
  }

  window.addEventListener('mousemove', function (e) {
    onMove(e.clientX);
  });
  window.addEventListener(
    'touchmove',
    function (e) {
      if (dragging && e.touches[0]) onMove(e.touches[0].clientX);
    },
    { passive: false }
  );
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchcancel', stopDrag);
})();
