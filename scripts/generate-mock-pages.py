# -*- coding: utf-8 -*-
"""Generate mock pages from portal templates and update nav trees."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
MOCK = Path(__file__).resolve().parent / "mock-pages"

FOOTER_INST = """        </div>
      </div>
    </section>
  </section>
  <footer class="wt-statusbar">
    <span>준비</span>
    <span id="instStatusTab">{status}</span>
    <span>마지막 저장: 09:12</span>
  </footer>
</main>
{extra}
<script>
function wtApprove(){{window.demoToast&&window.demoToast('승인 처리했습니다.');}}
function wtAddOrg(){{window.demoToast&&window.demoToast('등록 폼을 엽니다.');}}
function wtExport(){{window.demoToast&&window.demoToast('내보내기를 시작합니다.');}}
function wtPreview(){{window.demoToast&&window.demoToast('미리보기를 엽니다.');}}
function wtViewDetail(){{window.demoToast&&window.demoToast('항목을 선택한 뒤 자세히 보기를 이용하세요.');}}
function openModal(id){{var el=document.getElementById(id);if(el)el.classList.add('show');}}
function closeModal(id){{var el=document.getElementById(id);if(el)el.classList.remove('show');}}
document.querySelectorAll('.modal-overlay').forEach(function(o){{o.addEventListener('click',function(e){{if(e.target===o)o.classList.remove('show');}});}});
</script>
</body></html>
"""

FOOTER_ADMIN = FOOTER_INST.replace('instStatusTab', 'admStatusSection')

INST_NAV = [
    ("institution.html", "▣ 대시보드"),
    ("inst-students.html", "　├ 학생 조회"),
    ("inst-care.html", "　├ 관리 큐"),
    ("inst-counsel.html", "　├ 상담 이력"),
    ("inst-ocr-review.html", "　├ OCR 검수"),
    ("inst-report.html", "　├ 성과 리포트"),
    ("inst-insight.html", "　├ 지원 현황 분석"),
    ("inst-community.html", "　├ 커뮤니티"),
    ("inst-messages.html", "　├ 메시지 관리"),
    ("inst-translation.html", "　└ 번역 서비스"),
]

COMP_NAV = [
    ("company.html", "▣ 대시보드"),
    ("company-search.html", "　├ 인재 검색"),
    ("company-talent.html", "　├ AI 추천·비교"),
    ("company-recruit.html", "　├ 채용·면접"),
    ("company-report.html", "　├ 채용 성과"),
    ("company-insight.html", "　├ 인사이트 분석"),
    ("company-community.html", "　├ 커뮤니티"),
    ("company-messages.html", "　├ 메시지 관리"),
    ("company-translation.html", "　└ 번역 서비스"),
]

ADMIN_NAV = [
    ("admin.html", "▣ 대시보드"),
    ("admin-kpi.html", "　├ 경영 KPI"),
    ("admin-sla.html", "　├ 운영 SLA"),
    ("admin-marketing.html", "　├ 마케팅 퍼널"),
    ("admin-matching.html", "　├ 매칭 성과"),
    ("admin-ocr-quality.html", "　├ AI/OCR 품질"),
    ("admin-billing.html", "　├ 계약 · 과금"),
    ("admin-security.html", "　├ 보안 · 인증"),
    ("admin-members.html", "　├ 회원 관리"),
    ("admin-content.html", "　├ 콘텐츠 관리"),
    ("admin-partners.html", "　├ 파트너 · 협력"),
    ("admin-stats.html", "　├ 통계 · 리포트"),
    ("admin-banners.html", "　├ 배너 · 홍보"),
    ("admin-system.html", "　├ 시스템 · 권한"),
    ("admin-orgperm.html", "　├ 기관 · 기업 권한"),
    ("admin-translation.html", "　└ 번역 서비스"),
]

INST_PAGES = {
    "inst-care.html": ("관리 큐", "=기관포털.관리큐()", "관리 큐", "inst-care.html"),
    "inst-counsel.html": ("상담 이력", "=기관포털.상담이력()", "상담 이력", "inst-counsel.html"),
    "inst-ocr-review.html": ("OCR 검수", "=기관포털.OCR검수()", "OCR 검수", "inst-ocr-review.html"),
    "inst-report.html": ("성과 리포트", "=기관포털.성과리포트()", "성과 리포트", "inst-report.html"),
}

COMP_PAGES = {
    "company-talent.html": ("AI 추천·비교", "=기업포털.AI추천()", "AI 추천·비교", "company-talent.html"),
    "company-recruit.html": ("채용·면접", "=기업포털.채용관리()", "채용·면접", "company-recruit.html"),
    "company-report.html": ("채용 성과", "=기업포털.채용성과()", "채용 성과", "company-report.html"),
}

ADMIN_PAGES = {
    "admin-kpi.html": ("경영 KPI", "=관리자.경영KPI()", "경영 KPI", "admin-kpi.html"),
    "admin-sla.html": ("운영 SLA", "=관리자.운영SLA()", "운영 SLA", "admin-sla.html"),
    "admin-marketing.html": ("마케팅 퍼널", "=관리자.마케팅()", "마케팅 퍼널", "admin-marketing.html"),
    "admin-matching.html": ("매칭 성과", "=관리자.매칭성과()", "매칭 성과", "admin-matching.html"),
    "admin-ocr-quality.html": ("AI/OCR 품질", "=관리자.OCR품질()", "AI/OCR 품질", "admin-ocr-quality.html"),
    "admin-billing.html": ("계약 · 과금", "=관리자.계약과금()", "계약 · 과금", "admin-billing.html"),
}


def build_tree(nav, active):
    lines = ["      <div class=\"wt-tree\">"]
    for href, label in nav:
        cls = "wt-tree-item active" if href == active else "wt-tree-item"
        lines.append(f"        <div class=\"{cls}\" onclick=\"window.location.href='{href}'\">{label}</div>")
    lines.append("      </div>")
    return "\n".join(lines)


def patch_tree(html, nav, active):
    pattern = r"      <div class=\"wt-tree\">.*?</div>\n      <form"
    replacement = build_tree(nav, active) + "\n      <form"
    return re.sub(pattern, replacement, html, count=1, flags=re.DOTALL)


def extract_prefix(template_text):
    idx = template_text.find("<div class=\"wt-doc-inner\">")
    if idx == -1:
        raise ValueError("wt-doc-inner not found")
    prefix = template_text[: idx + len("<div class=\"wt-doc-inner\">\n")]
    prefix = re.sub(
        r'\n  <section class="wt-formula" aria-label="수식 입력줄">.*?</section>',
        "",
        prefix,
        count=1,
        flags=re.DOTALL,
    )
    return prefix


def patch_page_meta(prefix, title, formula, doc_title, role):
    prefix = re.sub(r"<title>.*?</title>", f"<title>Career Bridge - {title}</title>", prefix, count=1)
    prefix = re.sub(
        r'id="wtFormulaInput" value="[^"]*"',
        f'id="wtFormulaInput" value="{formula}"',
        prefix,
        count=1,
    )
    if role == "admin":
        prefix = re.sub(
            r'id="pageTitleText">[^<]*<',
            f'id="pageTitleText">{doc_title}<',
            prefix,
            count=1,
        )
        prefix = re.sub(
            r'id="admStatusSection">[^<]*<',
            f'id="admStatusSection">{doc_title}<',
            prefix,
            count=1,
        )
    elif role == "company":
        prefix = re.sub(
            r'id="pageTitle">[^<]*<',
            f'id="pageTitle">{doc_title}<',
            prefix,
            count=1,
        )
        prefix = re.sub(
            r'id="coStatusTab">[^<]*<',
            f'id="coStatusTab">{doc_title}<',
            prefix,
            count=1,
        )
    else:
        prefix = re.sub(
            r'id="pageTitle">[^<]*<',
            f'id="pageTitle">{doc_title}<',
            prefix,
            count=1,
        )
        prefix = re.sub(
            r'id="instStatusTab">[^<]*<',
            f'id="instStatusTab">{doc_title}<',
            prefix,
            count=1,
        )
    return prefix


def generate_page(template_path, out_path, meta, nav, fragment_name, role, extra=""):
    title, formula, doc_title, active = meta
    fragment = (MOCK / fragment_name).read_text(encoding="utf-8")
    prefix = extract_prefix(template_path.read_text(encoding="utf-8"))
    prefix = patch_page_meta(prefix, title, formula, doc_title, role)
    prefix = patch_tree(prefix, nav, active)
    footer_tpl = FOOTER_ADMIN if role == "admin" else FOOTER_INST
    if role == "company":
        footer_tpl = footer_tpl.replace("instStatusTab", "coStatusTab")
    body = prefix + fragment + footer_tpl.format(status=doc_title, extra=extra)
    out_path.write_text(body, encoding="utf-8")
    print("wrote", out_path.name)


def update_all_trees(folder, nav):
    for p in folder.glob("*.html"):
        active = p.name
        if active not in [n[0] for n in nav]:
            continue
        text = p.read_text(encoding="utf-8")
        new_text = patch_tree(text, nav, active)
        if new_text != text:
            p.write_text(new_text, encoding="utf-8")
            print("nav", p.name)


def patch_portal_menu(html, links_html):
    marker = '    <div class="wt-portal-menu"'
    if links_html.strip() in html:
        return html
    return html.replace(
        marker,
        links_html + "\n    " + marker,
        1,
    )


INST_MENU_LINKS = """
    <div class="wt-portal-menu-extra" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
      <a class="wt-portal-link" href="inst-care.html"><strong>관리 큐</strong><span>비자·문서·상담 우선순위 학생</span></a>
      <a class="wt-portal-link" href="inst-counsel.html"><strong>상담 이력</strong><span>취업·비자·생활 상담 기록</span></a>
      <a class="wt-portal-link" href="inst-ocr-review.html"><strong>OCR 검수</strong><span>문서 추출·신뢰도·승인 처리</span></a>
      <a class="wt-portal-link" href="inst-report.html"><strong>성과 리포트</strong><span>상담·문서·프로그램 지표</span></a>
    </div>"""

COMP_MENU_LINKS = """
    <div class="wt-portal-menu-extra" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
      <a class="wt-portal-link" href="company-talent.html"><strong>AI 추천·비교</strong><span>Match Score · 후보자 비교표</span></a>
      <a class="wt-portal-link" href="company-recruit.html"><strong>채용·면접</strong><span>공고 · 면접 · 메시지 템플릿</span></a>
      <a class="wt-portal-link" href="company-report.html"><strong>채용 성과</strong><span>전환율 · Time-to-Hire 지표</span></a>
    </div>"""

ADMIN_MENU_LINKS = """
    <div class="wt-portal-menu-extra" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
      <a class="wt-portal-link" href="admin-kpi.html"><strong>경영 KPI</strong><span>MRR · LTV/CAC · 계약 수</span></a>
      <a class="wt-portal-link" href="admin-sla.html"><strong>운영 SLA</strong><span>처리 대기 · OCR 실패율</span></a>
      <a class="wt-portal-link" href="admin-marketing.html"><strong>마케팅 퍼널</strong><span>가입 전환 · UTM 채널</span></a>
      <a class="wt-portal-link" href="admin-matching.html"><strong>매칭 성과</strong><span>채용 전환 · Match Score</span></a>
      <a class="wt-portal-link" href="admin-ocr-quality.html"><strong>AI/OCR 품질</strong><span>인식률 · 검수 큐</span></a>
      <a class="wt-portal-link" href="admin-billing.html"><strong>계약 · 과금</strong><span>기관/기업 과금 · MRR</span></a>
    </div>"""


def main():
    inst_tpl = ROOT / "institution" / "inst-students.html"
    comp_tpl = ROOT / "company" / "company-search.html"
    admin_tpl = ROOT / "admin" / "admin-members.html"

    ocr_extra = """
<div class="modal-overlay" id="ocrModal"><div class="modal">
  <div class="modal-head"><div><h3>OCR 검수 상세</h3><p>추출 결과 확인 · 승인/반려 목업</p></div><button class="close-btn" onclick="closeModal('ocrModal')">&times;</button></div>
  <div class="modal-body"><p style="font-size:12px;">신뢰도 91.4% · 수동 확인 2건 · 위변조 의심 없음</p></div>
  <div class="modal-foot"><button class="btn-cancel" onclick="closeModal('ocrModal')">닫기</button><button class="btn-confirm" onclick="closeModal('ocrModal');window.demoToast&&window.demoToast('승인 처리 (목업)')">승인</button></div>
</div></div>"""

    for fname, meta in INST_PAGES.items():
        extra = ocr_extra if "ocr" in fname else ""
        generate_page(inst_tpl, ROOT / "institution" / fname, meta, INST_NAV, fname, "institution", extra)

    for fname, meta in COMP_PAGES.items():
        generate_page(comp_tpl, ROOT / "company" / fname, meta, COMP_NAV, fname, "company", "")

    for fname, meta in ADMIN_PAGES.items():
        generate_page(admin_tpl, ROOT / "admin" / fname, meta, ADMIN_NAV, fname, "admin", "")

    update_all_trees(ROOT / "institution", INST_NAV)
    update_all_trees(ROOT / "company", COMP_NAV)
    update_all_trees(ROOT / "admin", ADMIN_NAV)

    for dash, links in [
        (ROOT / "institution" / "institution.html", INST_MENU_LINKS),
        (ROOT / "company" / "company.html", COMP_MENU_LINKS),
        (ROOT / "admin" / "admin.html", ADMIN_MENU_LINKS),
    ]:
        text = dash.read_text(encoding="utf-8")
        new_text = patch_portal_menu(text, links)
        if new_text != text:
            dash.write_text(new_text, encoding="utf-8")
            print("menu", dash.name)


if __name__ == "__main__":
    main()
