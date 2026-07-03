#!/usr/bin/env python3
"""Wrap wt-mock content (after wt-panel-summary) in wt-sheet-zone for internal scroll."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPEN = (
    '\n    <div class="wt-sheet-zone">\n'
    '    <div class="wt-sheet-scroll wt-mock-sheet-stack">\n'
)
CLOSE = '\n    </div>\n    </div>\n'


def find_div_block(html: str, start: int) -> tuple[int, int] | None:
    open_start = html.rfind('<div', 0, start + 1)
    if open_start < 0:
        return None
    depth = 0
    i = open_start
    n = len(html)
    while i < n:
        if html.startswith('<div', i):
            depth += 1
            i += 4
            continue
        if html.startswith('</div>', i):
            depth -= 1
            i += 6
            if depth == 0:
                return open_start, i
            continue
        i += 1
    return None


def wrap_stack_layout(html: str) -> str:
    if 'wt-mock-block' not in html or 'wt-stack-layout' not in html:
        return html
    if 'wt-sheet-zone' in html:
        return html

    pos = 0
    changed = False
    while True:
        idx = html.find('wt-stack-layout', pos)
        if idx < 0:
            break
        stack_open = html.rfind('<div', 0, idx)
        stack = find_div_block(html, stack_open)
        if not stack:
            pos = idx + 1
            continue
        s0, s1 = stack
        inner = html[s0:s1]

        ps_idx = inner.find('wt-panel-summary')
        if ps_idx < 0:
            pos = idx + 1
            continue
        ps_open = inner.rfind('<div', 0, ps_idx)
        ps = find_div_block(inner, ps_open)
        if not ps:
            pos = idx + 1
            continue
        ps_end = ps[1]
        tail = inner[ps_end:].strip()
        if not tail:
            pos = idx + 1
            continue

        new_inner = inner[:ps_end] + OPEN + tail + CLOSE
        html = html[:s0] + new_inner + html[s1:]
        changed = True
        pos = s0 + len(new_inner)

    return html


def move_orphans_into_sheet_scroll(html: str) -> str:
    """Move siblings after wt-sheet-zone (mock blocks) into the sheet scroll area."""
    if 'wt-sheet-zone' not in html:
        return html

    pos = 0
    while True:
        idx = html.find('wt-stack-layout', pos)
        if idx < 0:
            break
        stack_open = html.rfind('<div', 0, idx)
        stack = find_div_block(html, stack_open)
        if not stack:
            pos = idx + 1
            continue
        s0, s1 = stack
        inner = html[s0:s1]

        zone_idx = inner.find('wt-sheet-zone')
        if zone_idx < 0:
            pos = idx + 1
            continue
        zone_open = inner.rfind('<div', 0, zone_idx)
        zone = find_div_block(inner, zone_open)
        if not zone:
            pos = idx + 1
            continue
        z0, z1 = zone
        orphan = inner[z1:].strip()
        if not orphan or ('wt-mock-block' not in orphan and 'wt-mock-note' not in orphan):
            pos = idx + 1
            continue

        zone_html = inner[z0:z1]
        scroll_idx = zone_html.find('wt-sheet-scroll')
        if scroll_idx < 0:
            pos = idx + 1
            continue
        sc_open = zone_html.rfind('<div', 0, scroll_idx)
        sc = find_div_block(zone_html, sc_open)
        if not sc:
            pos = idx + 1
            continue
        rel_close = z0 + sc[1]
        new_inner = inner[:rel_close] + '\n' + orphan + '\n' + inner[rel_close:z1] + inner[z1 + len(orphan) :]
        # orphan strip may leave extra whitespace - rebuild:
        new_inner = inner[:rel_close] + '\n' + orphan + '\n' + inner[rel_close:z1]
        html = html[:s0] + new_inner + html[s1:]
        pos = s0 + len(new_inner)

    return html


def main():
    count = 0
    for html in sorted(ROOT.rglob('*.html')):
        if any(p in html.parts for p in ('student', 'scripts', 'Test')):
            continue
        text = html.read_text(encoding='utf-8')
        if 'wt-stack-layout' not in text or 'wt-mock-block' not in text:
            continue
        new_text = wrap_stack_layout(text)
        new_text = move_orphans_into_sheet_scroll(new_text)
        if new_text != text:
            html.write_text(new_text, encoding='utf-8')
            print('updated', html.relative_to(ROOT))
            count += 1
    print('done', count)


if __name__ == '__main__':
    main()
