/**
 * HTML 전체에서 한국어 UI 문자열 추출 → work-tool-i18n-dict.js 생성
 * 기존 company.html dict 병합 + 미번역 항목 Google Translate(무료 엔드포인트) 초벌 번역
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

const SKIP_DIRS = new Set(['scripts', 'node_modules']);
const SKIP_ATTR_TYPES = new Set(['password', 'email', 'file', 'date', 'month', 'number', 'hidden']);

function walkHtml(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walkHtml(p, out);
    } else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function extractFromHtml(html) {
  const set = new Set();
  const body = stripTags(html);

  const attrRe = /(?:placeholder|title|aria-label|alt)=["']([^"']*[가-힣][^"']*)["']/gi;
  let m;
  while ((m = attrRe.exec(html))) set.add(m[1].trim());

  const textRe = />([^<]*[가-힣][^<]*)</g;
  while ((m = textRe.exec(body))) {
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (t && t.length < 500) set.add(t);
  }

  const toastRe = /(?:demoToast|toast)\(['"]([^'"]*[가-힣][^'"]*)['"]\)/g;
  while ((m = toastRe.exec(html))) set.add(m[1].trim());

  return set;
}

function parseDictFromCompanyHtml() {
  const html = fs.readFileSync(path.join(root, 'company', 'company.html'), 'utf8');
  const start = html.indexOf('var dict = {');
  if (start < 0) return { en: {}, zh: {} };
  const slice = html.slice(start);
  const en = {};
  const zh = {};
  const pairRe = /'((?:\\'|[^'])*)':\s*'((?:\\'|[^'])*)'/g;
  let inEn = false;
  let inZh = false;
  for (const line of slice.split('\n')) {
    if (line.includes('en: {')) inEn = true;
    else if (line.includes('zh: {')) {
      inEn = false;
      inZh = true;
    } else if (line.trim() === '};' && (inEn || inZh)) {
      inEn = false;
      inZh = false;
    }
    if (!inEn && !inZh) continue;
    let pm;
    pairRe.lastIndex = 0;
    while ((pm = pairRe.exec(line))) {
      const k = pm[1].replace(/\\'/g, "'");
      const v = pm[2].replace(/\\'/g, "'");
      if (inEn) en[k] = v;
      if (inZh) zh[k] = v;
    }
  }
  const corrections = [
    'zhCorrections',
    'copyCorrections',
    'languagePolishCorrections',
    'messagePagePolishCorrections',
    'messageBodyPolishCorrections',
    'messageListPolishCorrections',
    'zhStudentVisibilityCorrections',
    'zhHomePolishCorrections',
  ];
  for (const block of corrections) {
    const re = new RegExp(`var ${block}[\\s\\S]*?\\{([\\s\\S]*?)\\};`, 'm');
    const bm = html.match(re);
    if (!bm) continue;
    let pm;
    pairRe.lastIndex = 0;
    while ((pm = pairRe.exec(bm[1]))) {
      const k = pm[1].replace(/\\'/g, "'");
      const v = pm[2].replace(/\\'/g, "'");
      if (block === 'copyCorrections') {
        try {
          const inner = bm[1];
          if (inner.includes('en:')) {
            /* copyCorrections has en/zh nested - apply to zh only keys in flat section */
          }
        } catch (e) {}
      }
      zh[k] = v;
    }
  }
  const copyMatch = html.match(/var copyCorrections = \{[\s\S]*?en:\s*\{([\s\S]*?)\},\s*zh:\s*\{([\s\S]*?)\}\s*\};/);
  if (copyMatch) {
    for (const [block, target] of [
      [copyMatch[1], en],
      [copyMatch[2], zh],
    ]) {
      let pm;
      pairRe.lastIndex = 0;
      while ((pm = pairRe.exec(block))) {
        target[pm[1].replace(/\\'/g, "'")] = pm[2].replace(/\\'/g, "'");
      }
    }
  }
  return { en, zh };
}

async function translateBatch(texts, targetLang, translate) {
  const out = {};
  const batchSize = 40;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    for (const text of batch) {
      try {
        const res = await translate(text, { to: targetLang, from: 'ko' });
        out[text] = res.text;
      } catch (e) {
        out[text] = text;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    console.log(`  ${targetLang}: ${Math.min(i + batchSize, texts.length)} / ${texts.length}`);
  }
  return out;
}

function shouldSkipString(s) {
  if (!s || !/[가-힣]/.test(s)) return true;
  if (s.length > 400) return true;
  if (/^[\d\s₩$%.,:;·\-–—/\\|()[\]{}<>]+$/.test(s)) return true;
  return false;
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort((a, b) => b.length - a.length)
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

function loadExistingDict() {
  const dictPath = path.join(root, 'work-tool-i18n-dict.js');
  if (!fs.existsSync(dictPath)) return { en: {}, zh: {} };
  const raw = fs.readFileSync(dictPath, 'utf8');
  const m = raw.match(/window\.CB_I18N_DICT = (\{[\s\S]*\});/);
  if (!m) return { en: {}, zh: {} };
  try {
    const parsed = JSON.parse(m[1]);
    return { en: parsed.en || {}, zh: parsed.zh || {} };
  } catch (e) {
    return { en: {}, zh: {} };
  }
}

async function main() {
  console.log('Loading existing work-tool-i18n-dict.js...');
  const existing = loadExistingDict();
  console.log(`  existing en: ${Object.keys(existing.en).length}, zh: ${Object.keys(existing.zh).length}`);

  console.log('Parsing legacy dict from company.html...');
  const legacy = parseDictFromCompanyHtml();
  console.log(`  legacy en: ${Object.keys(legacy.en).length}, zh: ${Object.keys(legacy.zh).length}`);

  const baseEn = { ...legacy.en, ...existing.en };
  const baseZh = { ...legacy.zh, ...existing.zh };

  const allStrings = new Set();
  for (const file of walkHtml(root)) {
    for (const s of extractFromHtml(fs.readFileSync(file, 'utf8'))) {
      if (!shouldSkipString(s)) allStrings.add(s);
    }
  }
  console.log(`Extracted ${allStrings.size} unique Korean UI strings`);

  const hangul = /[가-힣]/;
  const needsRetranslate = (table, key) => {
    const v = table[key];
    return !v || v === key || hangul.test(v);
  };

  const missingEn = [];
  const missingZh = [];
  for (const s of allStrings) {
    if (needsRetranslate(baseEn, s)) missingEn.push(s);
    if (needsRetranslate(baseZh, s)) missingZh.push(s);
  }
  console.log(`Retranslate EN: ${missingEn.length}, Retranslate ZH: ${missingZh.length}`);

  let translateFn = null;
  try {
    const { translate } = await import('@vitalets/google-translate-api');
    translateFn = translate;
    console.log('Using @vitalets/google-translate-api');
  } catch (e) {
    console.warn('Google translate package not available, using phrase fallback only');
  }

  const en = { ...baseEn };
  const zh = { ...baseZh };

  // Also retranslate any EN/ZH values that still contain Korean
  for (const [k, v] of Object.entries(en)) {
    if (hangul.test(v) && !missingEn.includes(k)) missingEn.push(k);
  }
  for (const [k, v] of Object.entries(zh)) {
    if (hangul.test(v) && k !== v && !missingZh.includes(k)) missingZh.push(k);
  }
  console.log(`Final retranslate EN: ${missingEn.length}, ZH: ${missingZh.length}`);

  if (translateFn && missingEn.length) {
    console.log('Translating EN...');
    const added = await translateBatch(missingEn, 'en', translateFn);
    Object.assign(en, added);
  }
  if (translateFn && missingZh.length) {
    console.log('Translating ZH...');
    const added = await translateBatch(missingZh, 'zh-CN', translateFn);
    Object.assign(zh, added);
  }

  const header = `/* Career Bridge static i18n dictionary — auto-generated, do not edit by hand */
window.CB_I18N_DICT = `;
  const body = JSON.stringify({ en: sortObject(en), zh: sortObject(zh) }, null, 0);
  fs.writeFileSync(path.join(root, 'work-tool-i18n-dict.js'), header + body + ';\n', 'utf8');
  console.log(`Wrote work-tool-i18n-dict.js (en: ${Object.keys(en).length}, zh: ${Object.keys(zh).length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
