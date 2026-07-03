# -*- coding: utf-8 -*-
"""Split combined portal tabs into separate HTML pages (institution + company)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

INST_NAV = """      <div class="wt-tree">
        <div class="wt-tree-item{da}" onclick="window.location.href='institution.html'">▣ 대시보드</div>
        <div class="wt-tree-item{sa}" onclick="window.location.href='inst-students.html'">　├ 학생 조회</div>
        <div class="wt-tree-item{ia}" onclick="window.location.href='inst-insight.html'">　├ 지원 현황 분석</div>
        <div class="wt-tree-item{ca}" onclick="window.location.href='inst-community.html'">　├ 커뮤니티</div>
        <div class="wt-tree-item" onclick="window.location.href='inst-messages.html'">　├ 메시지 관리</div>
        <div class="wt-tree-item" onclick="window.location.href='inst-translation.html'">　└ 번역 서비스</div>
      </div>"""

COMP_NAV = """      <div class="wt-tree">
        <div class="wt-tree-item{da}" onclick="window.location.href='company.html'">▣ 대시보드</div>
        <div class="wt-tree-item{sa}" onclick="window.location.href='company-search.html'">　├ 인재 검색</div>
        <div class="wt-tree-item{ia}" onclick="window.location.href='company-insight.html'">　├ 인사이트 분석</div>
        <div class="wt-tree-item{ca}" onclick="window.location.href='company-community.html'">　├ 커뮤니티</div>
        <div class="wt-tree-item" onclick="window.location.href='company-messages.html'">　├ 메시지 관리</div>
        <div class="wt-tree-item" onclick="window.location.href='company-translation.html'">　└ 번역 서비스</div>
      </div>"""

PORTAL_MENU_INST = """
    <div class="wt-portal-menu" aria-label="업무 메뉴">
      <a class="wt-portal-link" href="inst-students.html"><strong>학생 조회</strong><span>국적·전공·TOPIK 조건으로 지원 대상 검색</span></a>
      <a class="wt-portal-link" href="inst-insight.html"><strong>지원 현황 분석</strong><span>국적·전공·TOPIK 추이 차트</span></a>
      <a class="wt-portal-link" href="inst-community.html"><strong>커뮤니티</strong><span>취업정보·Q&amp;A·투표 관리</span></a>
      <a class="wt-portal-link" href="inst-messages.html"><strong>메시지 관리</strong><span>학생 안내·상담 메시지</span></a>
      <a class="wt-portal-link" href="inst-translation.html"><strong>번역 서비스</strong><span>다국어 안내 문서 번역</span></a>
    </div>"""

PORTAL_MENU_COMP = """
    <div class="wt-portal-menu" aria-label="업무 메뉴">
      <a class="wt-portal-link" href="company-search.html"><strong>인재 검색</strong><span>조건별 유학생·인재 검색</span></a>
      <a class="wt-portal-link" href="company-insight.html"><strong>인사이트 분석</strong><span>채용·인재 Pool 분석</span></a>
      <a class="wt-portal-link" href="company-community.html"><strong>커뮤니티</strong><span>채용 Q&amp;A·투표</span></a>
      <a class="wt-portal-link" href="company-messages.html"><strong>메시지 관리</strong><span>지원자 커뮤니케이션</span></a>
      <a class="wt-portal-link" href="company-translation.html"><strong>번역 서비스</strong><span>채용 공고 다국어 번역</span></a>
    </div>"""

INNER_END = "\n        </div>\n      </div>\n    </section>\n  </section>\n  <footer class=\"wt-statusbar\">"


def nav(active: str, portal: str) -> str:
    keys = {"da": "", "sa": "", "ia": "", "ca": ""}
    keys[active] = " active"
    tpl = INST_NAV if portal == "inst" else COMP_NAV
    return tpl.format(**keys)


def extract_block(text: str, start_marker: str, end_marker: str) -> str:
    i = text.find(start_marker)
    if i < 0:
        raise ValueError(f"Marker not found: {start_marker!r}")
    j = text.find(end_marker, i)
    if j < 0:
        raise ValueError(f"End marker not found: {end_marker!r}")
    return text[i:j].strip()


def strip_tab_panel(html: str) -> str:
    html = re.sub(r'^<div class="tab-panel[^"]*" id="panel-[^"]*">\s*', "", html, count=1)
    return html.strip()


def replace_tree(content: str, new_tree: str) -> str:
    return re.sub(
        r'<div class="wt-tree">.*?</div>\s*<form class="wt-quick-form"',
        new_tree + "\n      <form class=\"wt-quick-form\"",
        content,
        count=1,
        flags=re.DOTALL,
    )


def replace_doc_inner(content: str, inner: str) -> str:
    token = '<div class="wt-doc-inner">'
    start = content.find(token)
    if start < 0:
        raise ValueError("wt-doc-inner not found")
    content_start = content.find(">", start) + 1
    end = content.find(INNER_END, content_start)
    if end < 0:
        raise ValueError("wt-doc-inner end not found")
    return content[:content_start] + "\n" + inner.strip() + content[end:]


def patch_meta(content: str, title: str, formula: str, status: str, portal: str) -> str:
    content = re.sub(
        r'(<div class="wt-document-title" id="pageTitle">)[^<]*(</div>)',
        rf"\1{title}\2",
        content,
    )
    content = re.sub(
        r'(<input type="text" id="wtFormulaInput" value=")[^"]*(")',
        rf"\1{formula}\2",
        content,
    )
    status_id = "instStatusTab" if portal == "inst" else "compStatusTab"
    content = re.sub(
        rf'(<span id="{status_id}">)[^<]*(</span>)',
        rf"\1{status}\2",
        content,
    )
    content = content.replace("if(initTab==='community')switchTab('community');", "")
    comm_file = "inst-community.html" if portal == "inst" else "company-community.html"
    students_file = "inst-students.html" if portal == "inst" else "company-search.html"
    content = content.replace(
        "function goToPoll(){ switchTab('community'); openPoll(0); }",
        f"function goToPoll(){{ window.location.href='{comm_file}'; }}",
    )
    content = content.replace(
        "onclick=\"switchTab('search')\">학생 조회하기",
        f"onclick=\"window.location.href='{students_file}'\">학생 조회하기",
    )
    content = content.replace(
        "onclick=\"switchTab('search')\">인재 검색하기",
        f"onclick=\"window.location.href='{students_file}'\">인재 검색하기",
    )
    return content


def split_portal(src: Path, portal: str):
    text = src.read_text(encoding="utf-8")

    bottom_ad = extract_block(
        text,
        '<section class="bottom-ad-showcase"',
        '</section>\n\n  <section class="role-hero',
    )
    role_hero = extract_block(
        text,
        '<section class="role-hero',
        '</section>\n  <!-- SEARCH -->',
    )

    search = strip_tab_panel(extract_block(text, "<!-- SEARCH -->", "<!-- INSIGHT -->"))
    insight = strip_tab_panel(extract_block(text, "<!-- INSIGHT -->", 'id="panel-community">'))
    community = strip_tab_panel(extract_block(text, 'id="panel-community">', INNER_END))

    menu = PORTAL_MENU_INST if portal == "inst" else PORTAL_MENU_COMP
    dash_inner = f"""{bottom_ad}
  {role_hero}
  <div class="wt-section-layout wt-stack-layout wt-portal-dashboard">
    <div class="adm-sheet-scroll wt-sheet-scroll">
      <div class="section-lead"><h2>업무 메뉴</h2><p>항목별로 페이지가 분리되어 있습니다. 아래에서 이동하세요.</p></div>
      {menu}
    </div>
  </div>"""

    if portal == "inst":
        pages = [
            ("institution.html", "da", "대시보드", "=기관포털.대시보드()", "대시보드", dash_inner),
            ("inst-students.html", "sa", "학생 조회", "=기관포털.학생조회()", "학생 조회", search),
            ("inst-insight.html", "ia", "지원 현황 분석", "=기관포털.지원현황()", "지원 현황 분석", insight),
            ("inst-community.html", "ca", "커뮤니티", "=기관포털.커뮤니티()", "커뮤니티", community),
        ]
    else:
        pages = [
            ("company.html", "da", "대시보드", "=기업포털.대시보드()", "대시보드", dash_inner),
            ("company-search.html", "sa", "인재 검색", "=기업포털.인재검색()", "인재 검색", search),
            ("company-insight.html", "ia", "인사이트 분석", "=기업포털.인사이트()", "인사이트 분석", insight),
            ("company-community.html", "ca", "커뮤니티", "=기업포털.커뮤니티()", "커뮤니티", community),
        ]

    for filename, nav_key, title, formula, status, inner in pages:
        out = text
        out = replace_tree(out, nav(nav_key, portal))
        out = replace_doc_inner(out, inner)
        out = patch_meta(out, title, formula, status, portal)
        (src.parent / filename).write_text(out, encoding="utf-8")
        print(f"Wrote {filename}")


def main():
    split_portal(ROOT / "institution" / "institution.html", "inst")
    split_portal(ROOT / "company" / "company.html", "comp")
    print("Done.")


if __name__ == "__main__":
    main()
