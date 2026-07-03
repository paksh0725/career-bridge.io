# Career Bridge Contents — 목업 데이터 패키지

`2차시안(0622)/Contents` 는 HTML 목업에 넣을 **더미 사용자·KPI·차트·표·메시지** 데이터입니다.  
Codex(또는 개발자)가 이 폴더만 읽고 페이지에 바로 반영할 수 있도록 구성했습니다.

## 폴더 구조

```
Contents/
├── README.md                 ← 이 파일
├── page-manifest.json        ← 페이지별 필요 데이터 매핑 (가장 먼저 참조)
├── meta.json                 ← 기준일·플랫폼 전역 수치
├── contents-bundle.js        ← JSON 통합본 (window.CB_CONTENTS) — 자동 생성
├── contents-apply.js         ← DOM 자동 반영 헬퍼
├── scripts/
│   └── build-contents-bundle.mjs
├── shared/
│   └── organizations.json    ← 기업·기관 마스터
├── users/
│   ├── students.json         ← 유학생 12명 (프로필·문서·OCR·비자 등)
│   ├── managers.json         ← 기업/기관 담당자 6명
│   └── admins.json           ← 관리자 4명
├── charts/
│   ├── admin.json
│   ├── company.json
│   └── institution.json
├── kpis/
│   └── pages.json            ← 페이지별 KPI·큐·이벤트·사이드바
├── tables/
│   └── pages.json            ← 표·채용공고·상담이력 등
└── messages/
    └── threads.json          ← 학생 메시지 스레드 4건
```

## HTML 연결 방법 (권장)

`work-tool-charts.js` **앞**에 아래 두 스크립트를 추가합니다.

```html
<!-- admin/company/institution/student 하위 페이지 -->
<script src="../Contents/contents-bundle.js" defer></script>
<script src="../Contents/contents-apply.js" defer></script>
<script src="../work-tool-charts.js" defer></script>
```

`contents-apply.js`가 현재 URL 기준으로 차트 `data-labels` / `data-series` 를 채우고, KPI·사이드바를 갱신합니다.  
전역 변수 `window.CB_STUDENTS` 로 기존 `students` 배열과 동일 형태 데이터를 제공합니다.

## Codex 삽입 가이드

### 1) 차트 (`line-chart-host`)

`charts/{portal}.json` 에서 페이지 키(예: `admin/admin-kpi.html`) → 차트 키(예: `mrr`) 조회.

```javascript
var chart = CB_CONTENTS.charts.admin['admin/admin-kpi.html'].mrr;
el.setAttribute('data-labels', JSON.stringify(chart.labels));
el.setAttribute('data-series', JSON.stringify(chart.series));
el.setAttribute('data-suffix', chart.suffix || '');
```

| 속성 | 설명 |
|------|------|
| `ariaLabel` | HTML `aria-label` 과 일치 — DOM 선택자 |
| `labels` | X축 라벨 배열 |
| `series` | `[{ name, values, color? }]` |
| `suffix` | 우측 끝 수치 접미사 (`%`, `명`, `일` 등) |

### 2) 유학생 목록 (`students` JS 배열)

```javascript
// 방법 A: 헬퍼 사용
const students = window.CB_getStudents();

// 방법 B: 원본 풀 데이터
const wang = window.CB_getStudent('stu-001');
const all = window.CB_CONTENTS.users.students;
```

`users/students.json` 필드: `id`, `name`, `nameKo`, `school`, `major`, `nation`, `topik`, `tags`, `matchScore`, `profileComplete`, `documents[]`, `visaType`, `visaExpiry` …

### 3) KPI / 사이드바

`kpis/pages.json` → `"company/company.html"` 등:

- `kpis[]` → `.wt-mock-kpi-item` 또는 `.stat-card`
- `sidebar.managerId` → `users/managers.json` 또는 `users/admins.json` 교차 참조
- `shortlist`, `pipeline`, `alertQueue`, `queues`, `securityEvents`, `recentLogs` → 해당 HTML 블록에 행 단위 삽입

### 4) 메시지

```javascript
const threads = window.CB_getMessages();
// student/messages.html 의 CHATS 배열과 동일 구조
```

### 5) 표·채용·상담

`tables/pages.json` 에 페이지별 `rows`, `jobPostings`, `interviews`, `certPending` 등 정의.

## 번들 재생성

JSON 수정 후:

```bash
node Contents/scripts/build-contents-bundle.mjs
```

`Contents/contents-bundle.js` 가 갱신됩니다.

## 기준 시나리오 (데모 주인공)

| 역할 | ID | 이름 |
|------|-----|------|
| 유학생 | `stu-001` | 왕샤오밍 (Wang Xiaoming) · 경희대 경영학 · TOPIK 5급 |
| 기업 담당 | `mgr-co-001` | 이수진 과장 · 삼성전자 인사팀 |
| 기관 담당 | `mgr-in-002` | 정유진 · 코트라 해외취업팀 |
| 관리자 | `adm-001` | 한정 관리자 · 플랫폼 운영팀 |

## 주의

- 모든 수치는 **목업용 더미**입니다. 실제 API/DB 연동 없음.
- 개인정보(이메일 등)는 `@example.com` 형태의 가상 값입니다.
- 차트 색상은 `work-tool-charts.js` 기본 팔레트(`#4F83B8` 등)와 맞춤.
