/**
 * Contents JSON → window.CB_CONTENTS 번들 생성
 * 실행: node Contents/scripts/build-contents-bundle.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const contentsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(contentsDir, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function walkJson(dir, base = '') {
  const out = {};
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      Object.assign(out, walkJson(p, base ? `${base}/${name}` : name));
    } else if (name.endsWith('.json')) {
      const key = base ? `${base}/${name.replace(/\.json$/, '')}` : name.replace(/\.json$/, '');
      out[key] = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  return out;
}

const bundle = {
  meta: readJson('meta.json'),
  manifest: readJson('page-manifest.json'),
  shared: walkJson(path.join(root, 'shared')),
  users: walkJson(path.join(root, 'users')),
  charts: walkJson(path.join(root, 'charts')),
  kpis: walkJson(path.join(root, 'kpis')),
  tables: walkJson(path.join(root, 'tables')),
  messages: walkJson(path.join(root, 'messages')),
};

const header = `/* Career Bridge mock contents — auto-generated from Contents/*.json */
/* 재생성: node Contents/scripts/build-contents-bundle.mjs */
window.CB_CONTENTS = `;

fs.writeFileSync(
  path.join(root, 'contents-bundle.js'),
  header + JSON.stringify(bundle, null, 0) + ';\n',
  'utf8'
);

console.log('Wrote contents-bundle.js');
console.log('  students:', bundle.users.students?.length ?? 0);
console.log('  chart pages:', Object.keys(bundle.charts.admin || {}).length + Object.keys(bundle.charts.company || {}).length + Object.keys(bundle.charts.institution || {}).length);
