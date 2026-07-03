# -*- coding: utf-8 -*-
"""Split admin console sections into separate HTML pages."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ADMIN = ROOT / "admin"
SRC = ADMIN / "admin.html"

INNER_END = "\n        </div>\n      </div>\n    </section>\n  </section>\n\n  <footer class=\"wt-statusbar\">"

ADMIN_NAV = """      <div class="wt-tree">
        <div class="wt-tree-sec">운영 현황</div>
        <div class="wt-tree-item{da}" onclick="window.location.href='admin.html'">▣ 대시보드</div>
        <div class="wt-tree-sec">심사 · 관리</div>
        <div class="wt-tree-item{sec}" onclick="window.location.href='admin-security.html'">　├ 보안 · 인증 관리</div>
        <div class="wt-tree-item{mem}" onclick="window.location.href='admin-members.html'">　├ 회원 관리</div>
        <div class="wt-tree-item{cnt}" onclick="window.location.href='admin-content.html'">　└ 콘텐츠 관리</div>
        <div class="wt-tree-sec">성장 · 운영</div>
        <div class="wt-tree-item{prt}" onclick="window.location.href='admin-partners.html'">　├ 파트너 · 협력기관</div>
        <div class="wt-tree-item{sta}" onclick="window.location.href='admin-stats.html'">　├ 통계 · 리포트</div>
        <div class="wt-tree-item{ban}" onclick="window.location.href='admin-banners.html'">　└ 배너 · 홍보</div>
        <div class="wt-tree-sec">시스템</div>
        <div class="wt-tree-item{sys}" onclick="window.location.href='admin-system.html'">　├ 시스템 · 권한</div>
        <div class="wt-tree-item{org}" onclick="window.location.href='admin-orgperm.html'">　├ 기관 · 기업 권한</div>
        <div class="wt-tree-item" onclick="window.location.href='admin-translation.html'">　└ 번역 서비스</div>
      </div>"""

PORTAL_MENU = """
    <div class="wt-portal-menu" aria-label="관리 메뉴">
      <a class="wt-portal-link" href="admin-security.html"><strong>보안 · 인증 관리</strong><span>DID · SBT 승인 · 화이트리스트 · 보안 로그</span></a>
      <a class="wt-portal-link" href="admin-members.html"><strong>회원 관리</strong><span>가입 · 방문 · 탈퇴 집계 및 회원 현황</span></a>
      <a class="wt-portal-link" href="admin-content.html"><strong>콘텐츠 관리</strong><span>신고글 · 게시글 · 채용공고 승인</span></a>
      <a class="wt-portal-link" href="admin-partners.html"><strong>파트너 · 협력기관</strong><span>기관 · 기업 파트너 등록 현황</span></a>
      <a class="wt-portal-link" href="admin-stats.html"><strong>통계 · 리포트</strong><span>플랫폼 KPI · 리포트 다운로드</span></a>
      <a class="wt-portal-link" href="admin-banners.html"><strong>배너 · 홍보</strong><span>메인 · 포털 배너 운영</span></a>
      <a class="wt-portal-link" href="admin-system.html"><strong>시스템 · 권한</strong><span>역할 · RBAC · 감사 로그</span></a>
      <a class="wt-portal-link" href="admin-orgperm.html"><strong>기관 · 기업 권한</strong><span>포털별 기능 권한 매트릭스</span></a>
      <a class="wt-portal-link" href="admin-translation.html"><strong>번역 서비스</strong><span>플랫폼 공지 다국어 번역</span></a>
    </div>"""

SECTION_MARKERS = [
    ("dashboard", "<!-- ============ 1. DASHBOARD ============ -->", "<!-- ============ 2. SECURITY / AUTH ============ -->"),
    ("security", "<!-- ============ 2. SECURITY / AUTH ============ -->", "<!-- ============ 3. MEMBERS ============ -->"),
    ("members", "<!-- ============ 3. MEMBERS ============ -->", "<!-- ============ 4. CONTENT ============ -->"),
    ("content", "<!-- ============ 4. CONTENT ============ -->", "<!-- ============ 5. PARTNERS ============ -->"),
    ("partners", "<!-- ============ 5. PARTNERS ============ -->", "<!-- ============ 6. STATS ============ -->"),
    ("stats", "<!-- ============ 6. STATS ============ -->", "<!-- ============ 7. BANNERS ============ -->"),
    ("banners", "<!-- ============ 7. BANNERS ============ -->", "<!-- ============ 8. SYSTEM / RBAC ============ -->"),
    ("system", "<!-- ============ 8. SYSTEM / RBAC ============ -->", "<!-- ============ 8b. ORG PERMISSIONS (drill-in) ============ -->"),
    ("orgperm", "<!-- ============ 8b. ORG PERMISSIONS (drill-in) ============ -->", INNER_END),
]

PAGES = [
    ("dashboard", "admin.html", "da", "운영 대시보드", "=관리자콘솔.대시보드()"),
    ("security", "admin-security.html", "sec", "보안 · 인증 관리", "=관리자콘솔.보안인증()"),
    ("members", "admin-members.html", "mem", "회원 관리", "=관리자콘솔.회원관리()"),
    ("content", "admin-content.html", "cnt", "콘텐츠 관리", "=관리자콘솔.콘텐츠()"),
    ("partners", "admin-partners.html", "prt", "파트너 · 협력기관 관리", "=관리자콘솔.파트너()"),
    ("stats", "admin-stats.html", "sta", "통계 · 리포트", "=관리자콘솔.통계()"),
    ("banners", "admin-banners.html", "ban", "배너 · 홍보 관리", "=관리자콘솔.배너()"),
    ("system", "admin-system.html", "sys", "시스템 · 권한 관리", "=관리자콘솔.시스템권한()"),
    ("orgperm", "admin-orgperm.html", "org", "기업 · 기관 권한 관리", "=관리자콘솔.기관권한()"),
]

SECTION_HREF = {
    "dashboard": "admin.html",
    "security": "admin-security.html",
    "members": "admin-members.html",
    "content": "admin-content.html",
    "partners": "admin-partners.html",
    "stats": "admin-stats.html",
    "banners": "admin-banners.html",
    "system": "admin-system.html",
    "orgperm": "admin-orgperm.html",
}


def nav(active_key: str) -> str:
    keys = {k: "" for k in ["da", "sec", "mem", "cnt", "prt", "sta", "ban", "sys", "org"]}
    keys[active_key] = " active"
    return ADMIN_NAV.format(**keys)


def extract_block(text: str, start: str, end: str) -> str:
    i = text.find(start)
    if i < 0:
        raise ValueError(f"Start not found: {start}")
    j = text.find(end, i)
    if j < 0:
        raise ValueError(f"End not found: {end}")
    return text[i:j].strip()


def strip_section_panel(html: str) -> str:
    html = re.sub(r"<!-- ============ [^=]+ ============ -->\s*", "", html, count=1)
    html = re.sub(r'<div class="section-panel[^"]*" id="sec-[^"]*">\s*', "", html, count=1)
    html = re.sub(r"\n  </div>\s*$", "", html.rstrip())
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


def patch_meta(content: str, page_key: str, title: str, formula: str) -> str:
    content = re.sub(
        r'(<div class="wt-document-title" id="pageTitleText">)[^<]*(</div>)',
        rf"\1{title}\2",
        content,
    )
    content = re.sub(
        r'(<input type="text" id="wtFormulaInput" value=")[^"]*(")',
        rf"\1{formula}\2",
        content,
    )
    content = re.sub(
        r'(<span id="admStatusSection">)[^<]*(</span>)',
        rf"\1{title}\2",
        content,
    )
    for key, href in SECTION_HREF.items():
        content = content.replace(
            f"switchSection('{key}')",
            f"window.location.href='{href}'",
        )
    content = content.replace(
        "const active=document.querySelector('.section-panel.active');\n  const key=(active&&active.id)?active.id.replace('sec-',''):'dashboard';",
        f"const key=window.__ADM_PAGE||'dashboard';",
    )
    inject = f"<script>window.__ADM_PAGE='{page_key}';</script>\n</body>"
    content = content.replace("</body>", inject)
    return content


def main():
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")

    text = SRC.read_text(encoding="utf-8")
    sections = {}
    for key, start, end in SECTION_MARKERS:
        raw = extract_block(text, start, end)
        sections[key] = strip_section_panel(raw)

    dash_inner = sections["dashboard"] + f"""
  <div class="wt-section-layout wt-stack-layout wt-portal-dashboard">
    <div class="adm-sheet-scroll wt-sheet-scroll">
      <div class="section-lead"><h2>관리 메뉴</h2><p>항목별로 페이지가 분리되어 있습니다. 아래에서 이동하세요.</p></div>
      {PORTAL_MENU}
    </div>
  </div>"""

    for page_key, filename, nav_key, title, formula in PAGES:
        inner = dash_inner if page_key == "dashboard" else sections[page_key]
        out = text
        out = replace_tree(out, nav(nav_key))
        out = replace_doc_inner(out, inner)
        out = patch_meta(out, page_key, title, formula)
        (ADMIN / filename).write_text(out, encoding="utf-8")
        print(f"Wrote {filename}")

    print("Done.")


if __name__ == "__main__":
    main()
