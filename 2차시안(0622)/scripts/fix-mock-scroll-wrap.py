#!/usr/bin/env python3
"""Fix mock-only stack pages: wrap content in wt-sheet-zone and remove empty orphans."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
ORPHAN = re.compile(
    r'\n  </div>\n    <div class="wt-sheet-zone">\n    <div class="wt-sheet-scroll wt-mock-sheet-stack">\n</div>\n    </div>\n    </div>\n',
)
OPEN = (
    '\n    <div class="wt-sheet-zone">\n'
    '    <div class="wt-sheet-scroll wt-mock-sheet-stack">\n'
)
CLOSE = '\n    </div>\n    </div>\n'


def fix_file(text: str) -> str:
    text = ORPHAN.sub('\n  </div>\n', text)

    # Already wrapped correctly: sheet-zone immediately follows panel-summary
    if re.search(
        r'wt-panel-summary">[\s\S]*?</div>\s*\n\s*<div class="wt-sheet-zone">\s*\n\s*<div class="wt-sheet-scroll wt-mock-sheet-stack">\s*\n\s*<div class="wt-mock-block"',
        text,
    ):
        return text

    # Insert sheet zone before first mock block after panel-summary inside stack
    pattern = re.compile(
        r'(<div class="wt-section-layout wt-stack-layout">[\s\S]*?<div class="wt-panel-summary">[\s\S]*?</div>)\s*\n(\s*<div class="wt-mock-block)',
        re.MULTILINE,
    )
    m = pattern.search(text)
    if not m:
        return text
    start, end = m.span(2)
    # find stack closing after mock blocks - insert CLOSE before `  </div>` that closes stack
    stack_start = text.find('<div class="wt-section-layout wt-stack-layout">', m.start())
    stack_close = text.find('\n  </div>', end)
    if stack_close < 0:
        return text
    # avoid double wrap
    between = text[end:stack_close]
    if 'wt-sheet-zone' in between:
        return text
    text = text[:start] + OPEN + text[start:stack_close] + CLOSE + text[stack_close:]
    return text


def fix_ocr_review(text: str) -> str:
    """Move orphan mock blocks into existing wt-sheet-zone scroll area."""
    if 'inst-ocr-review' not in text and 'OCR 추출 필드' not in text:
        return text
    text = ORPHAN.sub('\n  </div>\n', text)
    marker = '<div class="wt-mock-block">\n      <h3>OCR 추출 필드'
    if marker not in text:
        return text
    # move OCR block + note into sheet zone before its closing
    zone_end_marker = '      </div>\n    </div>\n    <div class="wt-mock-block">\n      <h3>OCR 추출 필드'
    if zone_end_marker not in text:
        return text
    orphan_start = text.find('    <div class="wt-mock-block">\n      <h3>OCR 추출 필드')
    stack_close = text.find('\n  </div>', orphan_start)
    orphan_chunk = text[orphan_start:stack_close]
    text = text[:orphan_start] + text[stack_close:]
    insert_at = text.find('      </div>\n    </div>\n    <div class="wt-mock-block">\n      <h3>OCR 추출 필드')
    if insert_at < 0:
        # insert before sheet-zone table wrap close - find wt-sheet-zone table end
        insert_at = text.find('      </div>\n    </div>\n    <div class="wt-mock-block">')
    if insert_at < 0:
        insert_at = text.find('        </table>\n      </div>\n    </div>')
        if insert_at >= 0:
            insert_at += len('        </table>\n      </div>\n')
    if insert_at < 0:
        return text
    text = text[:insert_at] + '\n' + orphan_chunk + '\n' + text[insert_at:]
    return text


def main():
    count = 0
    for html in sorted(ROOT.rglob('*.html')):
        if any(p in html.parts for p in ('student', 'scripts', 'Test')):
            continue
        raw = html.read_text(encoding='utf-8')
        new = fix_file(raw)
        new = fix_ocr_review(new)
        if new != raw:
            html.write_text(new, encoding='utf-8')
            print('fixed', html.relative_to(ROOT))
            count += 1
    print('done', count)


if __name__ == '__main__':
    main()
