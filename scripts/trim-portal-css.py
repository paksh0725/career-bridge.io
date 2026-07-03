# -*- coding: utf-8 -*-
"""Trim dead inline CSS and link portal-components.css (수정지시 11단계)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
FOLDERS = [ROOT / "admin", ROOT / "company", ROOT / "institution"]

PORTAL_LINK = '<link rel="stylesheet" href="../portal-components.css">'

# Blocks to strip from inline <style> (dead layout / landing / banner)
STRIP_PATTERNS = [
    re.compile(r"/\* Reference-inspired clean light blue theme \*/.*?(?=/\* (?:Large screen|Demo interaction|Responsive layout|work-tool|portal-|\.adm-|\.drawer|@keyframes))", re.DOTALL),
    re.compile(r"\.bottom-ad-showcase[\s\S]*?(?=\.modal-overlay|\.modal-head|/\* Reference|/\* Large|\.adm-list|\.drawer-wrap|</style>)", re.DOTALL),
    re.compile(r"\.role-hero[\s\S]*?\.pipe-step\.active[\s\S]*?\}\s*", re.DOTALL),
    re.compile(r"\.support-board[\s\S]*?\.support-item[\s\S]*?\}\s*", re.DOTALL),
    re.compile(r"/\* Large screen layout guard \*/[\s\S]*?@media \(min-width: 1600px\)[\s\S]*?\}\s*", re.DOTALL),
    re.compile(r"^\.sidebar \{[\s\S]*?^\.content \{[^}]+\}\s*", re.MULTILINE),
    re.compile(r"^\.topbar \{[\s\S]*?^\.ndot \{[^}]+\}\s*", re.MULTILINE),
    re.compile(r"^nav \{ flex:1[\s\S]*?^\.sb-logout:hover[\s\S]*?\}\s*", re.MULTILINE),
    re.compile(r"/\* Responsive layout refinement \*/[\s\S]*?@media \(max-width: 480px\)[\s\S]*?\}\s*", re.DOTALL),
    re.compile(r"background:\s*linear-gradient\([^)]+\)", re.IGNORECASE),
]

WRONG_TRANSLATION = [
    ("company/", "inst-translation.html"),
    ("company/", "admin-translation.html"),
    ("company/", "student-translation.html"),
    ("institution/", "company-translation.html"),
    ("institution/", "admin-translation.html"),
    ("admin/", "company-translation.html"),
    ("admin/", "inst-translation.html"),
]


def trim_style(css: str) -> str:
    for pat in STRIP_PATTERNS:
        if "linear-gradient" in pat.pattern:
            css = pat.sub("background:#4f7fc8", css)
        else:
            css = pat.sub("", css)
    # flatten double blank lines
    css = re.sub(r"\n{3,}", "\n\n", css)
    return css.strip()


def process_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text

    m = re.search(r"<style>(.*?)</style>", text, re.DOTALL)
    if m:
        trimmed = trim_style(m.group(1))
        header = "/* 공통: work-tool.css + portal-components.css · 레거시 블록 정리 */\n"
        if len(trimmed) < 80:
            new_style = f"<style>\n{header}</style>"
        else:
            new_style = f"<style>\n{header}{trimmed}\n</style>"
        text = text[: m.start()] + new_style + text[m.end() :]

    if PORTAL_LINK not in text and "work-tool.css" in text:
        text = text.replace(
            '<link rel="stylesheet" href="../work-tool.css">',
            '<link rel="stylesheet" href="../work-tool.css">\n' + PORTAL_LINK,
            1,
        )

    folder_key = None
    for f in FOLDERS:
        if path.parent == f:
            folder_key = f.name + "/"
            break
    if folder_key:
        for fk, wrong in WRONG_TRANSLATION:
            if fk == folder_key and wrong in text:
                correct = {
                    "company/": "company-translation.html",
                    "institution/": "inst-translation.html",
                    "admin/": "admin-translation.html",
                }[fk]
                text = text.replace(wrong, correct)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    n = 0
    for folder in FOLDERS:
        for html in sorted(folder.glob("*.html")):
            if process_html(html):
                print("trim", html.name)
                n += 1
    print("done", n, "files")


if __name__ == "__main__":
    main()
