/**
 * 모든 HTML에 work-tool-i18n-dict.js / work-tool-i18n.js 연결
 * 인라인 __careerBridgeLanguagePatch / __careerBridgeZhPatch 제거
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['scripts', 'node_modules']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (SKIP.has(name)) continue;
      walk(p, out);
    } else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function relScript(file, name) {
  const depth = path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = depth ? '../'.repeat(depth) : '';
  return prefix + name;
}

const patchStart = /<!-- Site-wide language demo patch -->[\s\S]*?window\.__careerBridgeLanguagePatch[\s\S]*?\}\)\(\);\s*<\/script>/;
const zhPatch = /<script>\s*\(function\(\)\{\s*if \(window\.__careerBridgeZhPatch\)[\s\S]*?\}\)\(\);\s*<\/script>/;

function removeAdminSetLang(html) {
  return html.replace(
    /function setLang\(l,el\)\{document\.querySelectorAll\('\.lang-sw span'\)\.forEach\(s=>s\.classList\.remove\('active'\)\);el\.classList\.add\('active'\);toast\('미리 준비된 다국어 화면으로 전환된 상태입니다\.'\);\}\s*/g,
    ''
  );
}

let changed = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = html.replace(patchStart, '');
  html = html.replace(zhPatch, '');
  html = removeAdminSetLang(html);

  const dictSrc = relScript(file, 'work-tool-i18n-dict.js');
  const i18nSrc = relScript(file, 'work-tool-i18n.js');
  const inject = `<script src="${dictSrc}" defer></script>\n<script src="${i18nSrc}" defer></script>`;

  if (!html.includes('work-tool-i18n.js')) {
    if (html.includes('work-tool-actions.js')) {
      html = html.replace(
        /(<script src="[^"]*work-tool-actions\.js" defer><\/script>)/,
        `$1\n${inject}`
      );
    } else if (html.includes('work-tool.js')) {
      html = html.replace(/(<script src="[^"]*work-tool\.js" defer><\/script>)/, `$1\n${inject}`);
    } else if (file.endsWith('index.html') || file.includes('student') || file.includes('login')) {
      html = html.replace('</body>', `${inject}\n</body>`);
    }
  }

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
    console.log('updated:', path.relative(root, file));
  }
}
console.log('done:', changed, 'files');
