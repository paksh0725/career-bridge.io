/**
 * EN 사전에서 Google 번역 실패(한국어 잔존) 항목에 phrase fallback 적용
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dictPath = path.join(root, 'work-tool-i18n-dict.js');

const enFallback = [
  [/안녕하세요\.?/g, 'Hello.'],
  [/감사합니다\.?/g, 'Thank you.'],
  [/승인/g, 'Approve'],
  [/처리/g, 'Process'],
  [/보내기/g, 'Export'],
  [/미리보기/g, 'Preview'],
  [/대시보드/g, 'Dashboard'],
  [/목업/g, 'mock'],
  [/추이/g, 'trend'],
  [/계약/g, 'contract'],
  [/과금/g, 'billing'],
  [/보안/g, 'security'],
  [/인증/g, 'verification'],
  [/마케팅/g, 'marketing'],
  [/매칭/g, 'matching'],
  [/품질/g, 'quality'],
  [/성과/g, 'performance'],
  [/리포트/g, 'report'],
  [/통계/g, 'statistics'],
  [/배너/g, 'banner'],
  [/파트너/g, 'partner'],
  [/권한/g, 'permission'],
  [/회원/g, 'member'],
  [/콘텐츠/g, 'content'],
  [/시스템/g, 'system'],
  [/운영/g, 'operations'],
  [/경영/g, 'business'],
  [/유료/g, 'paid'],
  [/전환율/g, 'conversion rate'],
  [/이탈률/g, 'churn rate'],
  [/활성/g, 'active'],
  [/기관/g, 'institution'],
  [/기업/g, 'company'],
  [/유학생/g, 'international student'],
  [/담당자/g, 'manager'],
  [/인재/g, 'talent'],
  [/채용/g, 'recruitment'],
  [/면접/g, 'interview'],
  [/후보/g, 'candidate'],
  [/검색/g, 'search'],
  [/조회/g, 'lookup'],
  [/관리/g, 'management'],
  [/메시지/g, 'message'],
  [/번역/g, 'translation'],
  [/문서/g, 'document'],
  [/프로필/g, 'profile'],
  [/자동저장/g, 'autosave'],
  [/준비/g, 'Ready'],
  [/저장/g, 'save'],
  [/발송/g, 'send'],
  [/승인처리/g, 'Approve'],
  [/로그아웃/g, 'Log out'],
  [/로그인/g, 'Log in'],
  [/명/g, ''],
  [/건/g, ''],
  [/월/g, ''],
  [/년/g, ''],
  [/일/g, ''],
];

function hasHangul(v) {
  return /[가-힣]/.test(v || '');
}

function fallbackEn(value) {
  let next = value;
  for (const [re, rep] of enFallback) next = next.replace(re, rep);
  return next;
}

const raw = fs.readFileSync(dictPath, 'utf8');
const m = raw.match(/window\.CB_I18N_DICT = (\{[\s\S]*\});/);
const dict = JSON.parse(m[1]);
let fixed = 0;
for (const [k, v] of Object.entries(dict.en)) {
  if (!hasHangul(v)) continue;
  const next = fallbackEn(v);
  if (next !== v) {
    dict.en[k] = next;
    fixed++;
  }
}

const header = `/* Career Bridge static i18n dictionary — auto-generated, do not edit by hand */
window.CB_I18N_DICT = `;
const sorted = {};
Object.keys(dict.en)
  .sort((a, b) => b.length - a.length)
  .forEach((k) => {
    sorted[k] = dict.en[k];
  });
dict.en = sorted;
const sortedZh = {};
Object.keys(dict.zh)
  .sort((a, b) => b.length - a.length)
  .forEach((k) => {
    sortedZh[k] = dict.zh[k];
  });
dict.zh = sortedZh;

fs.writeFileSync(dictPath, header + JSON.stringify(dict) + ';\n', 'utf8');

let remain = 0;
for (const v of Object.values(dict.en)) if (hasHangul(v)) remain++;
console.log(`Applied fallback to ${fixed} EN entries. Still Korean: ${remain}`);
