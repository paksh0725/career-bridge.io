/**
 * Career Bridge — 정적 다국어 (KO/EN/ZH)
 * work-tool-i18n-dict.js 의 CB_I18N_DICT 사용
 */
(function initCareerBridgeI18n() {
  if (window.__careerBridgeLanguagePatch) return;
  window.__careerBridgeLanguagePatch = true;

  var currentDemoLang = 'ko';
  var applyingLang = false;
  var preservedSelector =
    'script, style, noscript, svg, path, textarea, .brand-cta-name, .wt-titlebar-lang, .lang-sw';
  var originalDocumentTitle = document.title;

  var dict = window.CB_I18N_DICT || { en: {}, zh: {} };

  var enFallback = [
    [/안녕하세요\.?/g, 'Hello.'],
    [/감사합니다\.?/g, 'Thank you.'],
    [/승인/g, 'Approve'],
    [/처리/g, 'Process'],
    [/보내기/g, 'Export'],
    [/미리보기/g, 'Preview'],
    [/대시보드/g, 'Dashboard'],
    [/목업/g, 'mock'],
    [/추이/g, 'trend'],
    [/계약/g, 'contract'],
    [/과금/g, 'billing'],
    [/보안/g, 'security'],
    [/인증/g, 'verification'],
    [/마케팅/g, 'marketing'],
    [/매칭/g, 'matching'],
    [/품질/g, 'quality'],
    [/성과/g, 'performance'],
    [/리포트/g, 'report'],
    [/통계/g, 'statistics'],
    [/배너/g, 'banner'],
    [/파트너/g, 'partner'],
    [/권한/g, 'permission'],
    [/회원/g, 'member'],
    [/콘텐츠/g, 'content'],
    [/시스템/g, 'system'],
    [/운영/g, 'operations'],
    [/경영/g, 'business'],
    [/유료/g, 'paid'],
    [/전환율/g, 'conversion rate'],
    [/이탈률/g, 'churn rate'],
    [/활성/g, 'active'],
    [/기관/g, 'institution'],
    [/기업/g, 'company'],
    [/유학생/g, 'international student'],
    [/담당자/g, 'manager'],
    [/인재/g, 'talent'],
    [/채용/g, 'recruitment'],
    [/면접/g, 'interview'],
    [/후보/g, 'candidate'],
    [/검색/g, 'search'],
    [/조회/g, 'lookup'],
    [/관리/g, 'management'],
    [/메시지/g, 'message'],
    [/번역/g, 'translation'],
    [/문서/g, 'document'],
    [/프로필/g, 'profile'],
    [/자동저장/g, 'autosave'],
    [/준비/g, 'Ready'],
    [/저장/g, 'save'],
    [/발송/g, 'send'],
    [/승인처리/g, 'Approve'],
    [/로그아웃/g, 'Log out'],
    [/로그인/g, 'Log in'],
    [/명/g, ''],
    [/건/g, ''],
    [/월/g, ''],
    [/년/g, ''],
    [/일/g, ''],
  ];

  var zhFallback = [
    [/안녕하세요\.?/g, '您好。'],
    [/감사합니다\.?/g, '谢谢。'],
    [/승인/g, '批准'],
    [/처리/g, '处理'],
    [/보내기/g, '导出'],
    [/미리보기/g, '预览'],
    [/대시보드/g, '仪表板'],
    [/목업/g, '模拟'],
    [/추이/g, '趋势'],
    [/계약/g, '合同'],
    [/과금/g, '计费'],
    [/보안/g, '安全'],
    [/인증/g, '认证'],
    [/마케팅/g, '营销'],
    [/매칭/g, '匹配'],
    [/품질/g, '质量'],
    [/성과/g, '绩效'],
    [/리포트/g, '报告'],
    [/통계/g, '统计'],
    [/배너/g, '横幅'],
    [/파트너/g, '合作伙伴'],
    [/권한/g, '权限'],
    [/회원/g, '会员'],
    [/콘텐츠/g, '内容'],
    [/시스템/g, '系统'],
    [/운영/g, '运营'],
    [/경영/g, '经营'],
    [/유료/g, '付费'],
    [/전환율/g, '转化率'],
    [/이탈률/g, '流失率'],
    [/활성/g, '活跃'],
    [/기관/g, '机构'],
    [/기업/g, '企业'],
    [/유학생/g, '留学生'],
    [/담당자/g, '负责人'],
    [/인재/g, '人才'],
    [/채용/g, '招聘'],
    [/면접/g, '面试'],
    [/후보/g, '候选人'],
    [/검색/g, '搜索'],
    [/조회/g, '查询'],
    [/관리/g, '管理'],
    [/메시지/g, '消息'],
    [/번역/g, '翻译'],
    [/문서/g, '文件'],
    [/프로필/g, '资料'],
    [/자동저장/g, '自动保存'],
    [/준비/g, '就绪'],
    [/저장/g, '保存'],
    [/발송/g, '发送'],
    [/승인처리/g, '批准处理'],
    [/로그아웃/g, '退出登录'],
    [/로그인/g, '登录'],
    [/명/g, '人'],
    [/건/g, '件'],
    [/월/g, '月'],
    [/년/g, '年'],
    [/일/g, '日'],
  ];

  function hasHangul(value) {
    return /[가-힣]/.test(value || '');
  }

  function fallbackTranslate(value, lang) {
    var maps = lang === 'zh' ? zhFallback : enFallback;
    var next = value;
    maps.forEach(function (pair) {
      next = next.replace(pair[0], pair[1]);
    });
    return next;
  }

  function translateTextValue(value, lang) {
    if (!value) return value;
    if (lang === 'ko') return value;
    var table = dict[lang] || {};
    var leading = (value.match(/^\s*/) || [''])[0];
    var trailing = (value.match(/\s*$/) || [''])[0];
    var core = value.trim();
    if (!core) return value;
    if (table[core]) {
      var direct = table[core];
      if (lang !== 'ko' && hasHangul(direct)) direct = fallbackTranslate(direct, lang);
      return leading + direct + trailing;
    }
    var next = core;
    Object.keys(table)
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .forEach(function (key) {
        if (next.indexOf(key) >= 0) next = next.split(key).join(table[key]);
      });
    if (hasHangul(next)) next = fallbackTranslate(next, lang);
    return leading + next + trailing;
  }

  function shouldSkip(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    if (!el) return true;
    if (el.closest && el.closest(preservedSelector)) return true;
    return false;
  }

  function translateTextNodes(lang) {
    if (!document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.__cbKoText) node.__cbKoText = node.nodeValue;
      node.nodeValue = lang === 'ko' ? node.__cbKoText : translateTextValue(node.__cbKoText, lang);
    });
  }

  function translateAttributes(lang) {
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      if (!el.__cbKoPlaceholder) el.__cbKoPlaceholder = el.getAttribute('placeholder') || '';
      el.setAttribute(
        'placeholder',
        lang === 'ko' ? el.__cbKoPlaceholder : translateTextValue(el.__cbKoPlaceholder, lang)
      );
    });
    document.querySelectorAll('input, textarea').forEach(function (el) {
      var type = (el.getAttribute('type') || '').toLowerCase();
      if (['password', 'email', 'month', 'date', 'number', 'file'].indexOf(type) >= 0) return;
      if (!el.__cbKoValue) el.__cbKoValue = el.value || '';
      if (!el.__cbKoValue || !hasHangul(el.__cbKoValue)) return;
      el.value = lang === 'ko' ? el.__cbKoValue : translateTextValue(el.__cbKoValue, lang);
      if (el.tagName === 'TEXTAREA') el.textContent = el.value;
    });
    document.querySelectorAll('[title], [aria-label]').forEach(function (el) {
      ['title', 'aria-label'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var key = '__cbKo' + attr;
        if (!el[key]) el[key] = el.getAttribute(attr) || '';
        el.setAttribute(attr, lang === 'ko' ? el[key] : translateTextValue(el[key], lang));
      });
    });
    document.querySelectorAll('option').forEach(function (el) {
      if (!el.__cbKoText) el.__cbKoText = el.textContent;
      if (hasHangul(el.__cbKoText)) {
        el.textContent = lang === 'ko' ? el.__cbKoText : translateTextValue(el.__cbKoText, lang);
      }
    });
  }

  function updateLangButtons(lang) {
    document.querySelectorAll('.lang-sw span, .wt-titlebar-lang span').forEach(function (btn) {
      var raw = (btn.getAttribute('data-lang') || btn.__cbLangKey || btn.textContent || '')
        .trim()
        .toLowerCase();
      var btnLang = raw === 'en' ? 'en' : raw === 'zh' ? 'zh' : 'ko';
      btn.__cbLangKey = btnLang;
      btn.textContent = btnLang.toUpperCase();
      btn.classList.toggle('active', btnLang === lang);
    });
  }

  function notify(lang) {
    var msg =
      lang === 'ko'
        ? '한국어 화면으로 전환되었습니다.'
        : lang === 'en'
          ? 'English screen applied.'
          : '已切换为中文界面。';
    if (typeof window.demoToast === 'function') window.demoToast(msg);
    else if (typeof window.toast === 'function') window.toast(msg);
  }

  function applyLang(lang) {
    currentDemoLang = lang || 'ko';
    applyingLang = true;
    document.documentElement.lang =
      currentDemoLang === 'zh' ? 'zh' : currentDemoLang === 'en' ? 'en' : 'ko';
    document.title =
      currentDemoLang === 'ko' ? originalDocumentTitle : translateTextValue(originalDocumentTitle, currentDemoLang);
    translateTextNodes(currentDemoLang);
    translateAttributes(currentDemoLang);
    updateLangButtons(currentDemoLang);
    setTimeout(function () {
      applyingLang = false;
    }, 120);
    notify(currentDemoLang);
  }

  window.setDemoLang = applyLang;
  window.applyLang = applyLang;
  window.setLang = function (el, lang) {
    if (typeof lang === 'string') applyLang(lang);
    else if (el && el.getAttribute && el.getAttribute('data-lang')) applyLang(el.getAttribute('data-lang'));
    else if (typeof el === 'string') applyLang(el);
    else applyLang('ko');
  };
  window.translateTextValue = translateTextValue;

  document.addEventListener(
    'click',
    function (event) {
      var btn =
        event.target.closest &&
        event.target.closest('.lang-sw span, .wt-titlebar-lang span');
      if (!btn) return;
      var raw = (btn.getAttribute('data-lang') || btn.textContent || '').trim().toLowerCase();
      var lang = raw === 'en' ? 'en' : raw === 'zh' ? 'zh' : 'ko';
      event.preventDefault();
      event.stopImmediatePropagation();
      applyLang(lang);
    },
    true
  );

  var params = new URLSearchParams(location.search);
  var initial = params.get('lang');
  if (initial === 'en' || initial === 'zh') {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', function () {
        applyLang(initial);
      });
    else setTimeout(function () {
      applyLang(initial);
    }, 0);
  }

  var observerTimer;
  var observer = new MutationObserver(function () {
    if (applyingLang || currentDemoLang === 'ko') return;
    clearTimeout(observerTimer);
    observerTimer = setTimeout(function () {
      applyLang(currentDemoLang);
    }, 80);
  });
  function startObserver() {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver);
  else startObserver();
})();
