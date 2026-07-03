#!/usr/bin/env python3
"""Inject work-tool-actions.js after work-tool.js in portal HTML files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKER = 'work-tool-actions.js'
INSERT = '<script src="../work-tool-actions.js" defer></script>'

count = 0
for html in ROOT.rglob('*.html'):
    if 'student' in html.parts:
        continue
    text = html.read_text(encoding='utf-8')
    if 'work-tool.js' not in text or MARKER in text:
        continue
    new_text = text.replace(
        '<script src="../work-tool.js" defer></script>',
        '<script src="../work-tool.js" defer></script>\n' + INSERT,
        1,
    )
    if new_text != text:
        html.write_text(new_text, encoding='utf-8')
        count += 1
        print('updated', html.relative_to(ROOT))

print('done', count)
