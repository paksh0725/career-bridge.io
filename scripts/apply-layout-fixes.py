# -*- coding: utf-8 -*-
"""Apply 수정지시.md layout fixes across portal HTML."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
FRAG = Path(__file__).resolve().parent / "layout-fragments"

FORMULA_RE = re.compile(
    r'\n  <section class="wt-formula" aria-label="수식 입력줄">.*?</section>',
    re.DOTALL,
)

BANNER_RE = re.compile(
    r'<section class="bottom-ad-showcase"[^>]*>.*?</section>\s*'
    r'<section class="role-hero [^"]*"[^>]*>.*?</section>\s*'
    r'<div class="wt-section-layout wt-stack-layout wt-portal-dashboard">.*?</div>\s*</div>\s*</div>',
    re.DOTALL,
)

FILTER_PATCH = """    <div class="filter-box wt-search-filter">
      <div class="filter-head-row">
        <div class="filter-title">검색 필터</div>
        <button type="button" class="wt-filter-toggle" onclick="this.closest('.filter-box').classList.toggle('wt-filter-open');this.textContent=this.closest('.filter-box').classList.contains('wt-filter-open')?'상세 필터 접기':'상세 필터 펼치기'">상세 필터 펼치기</button>
      </div>
      <div class="wt-filter-main">
        <div class="fg"><label>국적</label><select><option>전체 국적</option><option>중국</option><option>베트남</option><option>몽골</option><option>우즈베키스탄</option><option>인도</option></select></div>
        <div class="fg"><label>전공</label><select><option>전체 전공</option><option>경영학</option><option>컴퓨터공학</option><option>국제통상</option><option>화학공학</option><option>경제학</option></select></div>
        <div class="fg"><label>한국어 수준</label><select><option>전체</option><option>TOPIK 3급 이상</option><option>TOPIK 4급 이상</option><option>TOPIK 5급 이상</option><option>TOPIK 6급</option></select></div>
        <button class="search-btn" onclick="doSearch()">검색하기</button>
      </div>
      <div class="wt-filter-advanced">
      <div class="filter-grid">"""


def remove_formula(text):
    return FORMULA_RE.sub("", text)


def replace_dashboard(path, fragment_name):
    frag = (FRAG / fragment_name).read_text(encoding="utf-8")
    text = path.read_text(encoding="utf-8")
    new_text, n = BANNER_RE.subn(frag + "\n        ", text, count=1)
    if n:
        path.write_text(new_text, encoding="utf-8")
        print("dashboard", path.name)
        return True
    print("SKIP dashboard", path.name)
    return False


def patch_search_filter(text):
    if "wt-filter-toggle" in text:
        return text, False
    old = """    <div class="filter-box">
      <div class="filter-title">검색 필터</div>
      <div class="filter-grid">"""
    if old not in text:
        old2 = """    <div class="filter-box">
      <div class="filter-title">조회 필터</div>
      <div class="filter-grid">"""
        if old2 in text:
            patch = FILTER_PATCH.replace("검색 필터", "조회 필터").replace("doSearch()", "doSearch()")
            return text.replace(old2, patch.replace("검색하기", "조회하기"), 1), True
        return text, False
    # close advanced wrapper before stats-bar
    text = text.replace(old, FILTER_PATCH, 1)
    text = text.replace(
        """      </div>
    </div>
    <div class="stats-bar">""",
        """      </div>
      </div>
    </div>
    <div class="stats-bar">""",
        1,
    )
    return text, True


def fix_go_to_poll(text, community_page):
    text = re.sub(
        r"function goToPoll\(\)\s*\{[^}]*\}",
        f"function goToPoll(){{ window.location.href='{community_page}'; }}",
        text,
    )
    return text


def patch_admin_stats(text):
    old = """        <div class="stats-bar">
          <div class="stat-card"><div class="num">1,284</div><div class="lbl">전체 회원</div></div>
          <div class="stat-card"><div class="num">23</div><div class="lbl">인증 승인 대기</div></div>
          <div class="stat-card"><div class="num">3,920</div><div class="lbl">일 평균 방문자</div></div>
          <div class="stat-card"><div class="num">7</div><div class="lbl">신고 처리 대기</div></div>
          <div class="stat-card"><div class="num">1,042</div><div class="lbl">협력 기관</div></div>
        </div>"""
    new = """        <div class="stats-bar wt-mock-kpi-list">
          <div class="wt-mock-kpi-item"><strong>처리 대기</strong><em>23건</em></div>
          <div class="wt-mock-kpi-item"><strong>인증 SLA</strong><em>98.2%</em></div>
          <div class="wt-mock-kpi-item"><strong>평균 처리</strong><em>4.8h</em></div>
          <div class="wt-mock-kpi-item"><strong>보안 이벤트</strong><em>3건</em></div>
          <div class="wt-mock-kpi-item"><strong>OCR 실패율</strong><em>2.1%</em></div>
          <div class="wt-mock-kpi-item"><strong>민감정보 접근</strong><em>412건</em></div>
          <div class="wt-mock-kpi-item"><strong>문서 다운로드</strong><em>1,284건</em></div>
        </div>"""
    if old in text:
        return text.replace(old, new, 1), True
    return text, False


def remove_portal_menu_from_admin(text):
    """Remove duplicate portal menu block at bottom of admin dashboard."""
    marker = '  <div class="wt-section-layout wt-stack-layout wt-portal-dashboard">'
    idx = text.find(marker)
    if idx == -1:
        return text, False
    # only remove if after admDashboardSplit closing
    split_end = text.find("</div>\n    </div>\n  <div class=\"wt-section-layout wt-stack-layout wt-portal-dashboard\">")
    if split_end == -1:
        return text, False
    end = text.find("        </div>\n      </div>\n    </section>", idx)
    if end == -1:
        return text, False
    new_text = text[:idx] + text[end:]
    return new_text, True


def audit_translation_links(folder, expected_suffix):
    fixed = 0
    for p in folder.glob("*.html"):
        text = p.read_text(encoding="utf-8")
        orig = text
        # fix wrong role translation links
        for wrong in ["../student/", "../admin/", "../company/", "../institution/"]:
            if wrong in text and expected_suffix not in wrong:
                pass  # manual only
        if orig != text:
            p.write_text(text, encoding="utf-8")
            fixed += 1
    return fixed


def main():
    portals = [
        ROOT / "company",
        ROOT / "institution",
        ROOT / "admin",
    ]
    for folder in portals:
        for html in folder.glob("*.html"):
            text = html.read_text(encoding="utf-8")
            new_text = remove_formula(text)
            if new_text != text:
                html.write_text(new_text, encoding="utf-8")
                print("formula", html.name)

    replace_dashboard(ROOT / "company" / "company.html", "company-dashboard.html")
    replace_dashboard(ROOT / "institution" / "institution.html", "inst-dashboard.html")

    for path in [ROOT / "company" / "company-search.html", ROOT / "institution" / "inst-students.html"]:
        text = path.read_text(encoding="utf-8")
        text, ok = patch_search_filter(text)
        if ok:
            path.write_text(text, encoding="utf-8")
            print("filter", path.name)

    admin_path = ROOT / "admin" / "admin.html"
    text = admin_path.read_text(encoding="utf-8")
    text, ok = patch_admin_stats(text)
    text, ok2 = remove_portal_menu_from_admin(text)
    text = fix_go_to_poll(text, "admin-content.html")
    admin_path.write_text(text, encoding="utf-8")
    if ok:
        print("admin stats")
    if ok2:
        print("admin menu trim")

    for path, comm in [
        (ROOT / "company" / "company.html", "company-community.html"),
        (ROOT / "institution" / "institution.html", "inst-community.html"),
    ]:
        text = path.read_text(encoding="utf-8")
        text = fix_go_to_poll(text, comm)
        text = text.replace('id="coStatusTab">인재 검색', 'id="coStatusTab">대시보드')
        path.write_text(text, encoding="utf-8")

    print("done")


if __name__ == "__main__":
    main()
