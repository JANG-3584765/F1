# WhatisF1

F1 입문자가 일정, 뉴스, 순위를 한 화면에서 빠르게 확인할 수 있도록 제작한 정보형 웹사이트입니다.
HTML / CSS / JavaScript와 정적 JSON 데이터로 구성하였습니다.

---

## 📄 index.html + home/ — 메인 홈페이지

### 구현 내용

진입점(landing page)으로, 5개 섹션을 순서대로 배치해 핵심 정보를 한 화면에서 파악할 수 있도록 설계했습니다.

```
[Next Race] → [Main News] → [Highlights] → [TOP3 Standing] → [Fan Vote]
```

- 헤더/푸터는 `common/header.js`, `common/footer.js`로 동적 주입 — 모든 페이지 공통 UI를 단일 파일로 관리
- `common/config.js`를 동기 로드해 `window.BASE_PATH`를 확정 — localhost/GitHub Pages 경로 차이 해결
- 카드 슬라이더: Swiper.js(v10) / 국기 이모지: Twemoji (CDN)

### 공통 개선

각 섹션 JS에서 JSON 데이터를 `innerHTML`에 직접 삽입하던 부분에 `escapeHtml()`을 일괄 적용했습니다.

| 파일 | 주요 데이터 |
|------|------------|
| `nextrace.js` | 일정 / 서킷 / 레이스 정보 |
| `mainnews.js` | 뉴스 이미지 / 제목 / 카테고리 |
| `highlight.js` | 영상 링크 / 제목 |
| `standing.js` | 순위 이미지 / 이름 / 점수 |

### 섹션별 상세

#### 1. Next Race (`home/nextrace/`)

**주요 기능**

- 다음 세션까지 카운트다운 표시
- 2025·2026 시즌 JSON 동시 fetch → 현재 시각 이후 첫 세션 자동 탐색
- "▼ 펼치기" 버튼으로 서킷 이미지 및 세션별 시각 확인
- 카운트다운 숫자에 `Orbitron` 폰트 적용

---

#### 2. Main News (`home/mainnews/`)

**주요 기능**

- 최신 뉴스 Swiper 슬라이더 노출
- 카드 상단에 카테고리 배지(Driver / Team / Tech / Rumor / Regulation) + 제목 오버레이
- 배지 색상 분기: CSS `data-category` 속성 선택자 사용
- 양 끝 도달 시 화살표 흐리게 처리(opacity 0.3)

---

#### 3. Highlights (`home/highlight/`)

**주요 기능**

- 최신 라운드 순 최대 7개 YouTube 썸네일 Swiper 노출
- URL에서 영상 ID 정규식 추출 → 썸네일(`hqdefault.jpg`) 자동 생성
- 마지막 슬롯: 영상 전체 페이지 이동 "더보기" 카드 고정

---

#### 4. TOP3 Standing (`home/standing/`)

**주요 기능**

- 드라이버/컨스트럭터 상위 3명 포디움 형태 시각화
- 1위 가운데 배치 + `translateY`로 높이 차이를 줘 시상대 연출
- 탭 클릭 시 `renderPodium()`으로 동일 컨테이너 재렌더링

**개선**

- `standing.js`: 하드코딩된 `"2026.json"`을 `const STANDING_SEASON = "2026"` 상수로 분리 — 시즌 변경 시 한 곳만 수정

---

#### 5. Fan Vote (`home/guess/`)

**주요 기능**

- 승부예측 페이지(`prediction/prediction.html`) 진입 버튼
- JS 없이 CSS만으로 구성
- F1 레드 배경 카드 디자인

---

## 🔧 common/ — 공통 컴포넌트

### 주요 기능

- `config.js`: `window.BASE_PATH` 설정 — localhost/GitHub Pages 환경 자동 감지
- `header.js`: `header.html` fetch 로드, 햄버거 메뉴 토글, Escape/외부 클릭 감지로 자동 닫힘
- `footer.js`: `footer.html` fetch 로드, BASE_PATH 기준 경로 자동 치환
- `darkmode.css`: 사이트 공통 CSS 변수 + `[data-theme="dark"]` 팔레트 정의
- `darkmode.js`: ☀️/🌙 토글 버튼, `localStorage` 저장/복원, MutationObserver로 헤더 비동기 주입 후 버튼 아이콘 동기화

### 다크모드

- 모든 HTML `<head>` 첫 줄에 FOUC 방지 인라인 스크립트 — CSS 렌더 전 `data-theme` 즉시 설정
- `prefers-color-scheme: dark` 감지로 OS 설정 초기값 반영
- CSS 변수 (`--bg`, `--card`, `--border`, `--text` 등)로 전체 페이지 팔레트 일괄 전환
- 헤더 우측 토글 버튼에서 모든 페이지 공통 적용

---

## 📊 ranking/ — 전체 순위

### 주요 기능

- 드라이버 / 컨스트럭터 탭 전환
- 시즌 selector로 연도별 데이터 동적 전환
- `teamKey()`로 팀명 → CSS 클래스 매핑해 팀 컬러 적용
- `safeText()`로 모든 출력값 XSS 방지

**개선**

- `ranking.js`: 중복 OR 조건 수정 (`자우버 || 자우버` → `자우버 || 킥`) — 킥 자우버 팀명 누락 버그 수정

---

## 🏁 result/ — 경기 결과

### 주요 기능

- 시즌 / 라운드 드롭다운으로 결과 조회
- Top 5 + 전체 결과 2단계 표시 (DNF / DNS / DSQ 포함)
- 팀 컬러 dot으로 소속 팀 시각화
- DOTD / Fastest Lap 배지 표시
- `Map` 자료구조로 fetch 결과 캐싱 — 반복 요청 최적화

---

## 📰 news/ — 뉴스

### 주요 기능

- 텍스트 검색 input — 제목 / 요약 기준 실시간 필터 (`input` 이벤트, 기존 `applyFilters()` 확장)
- 카테고리 / 소스 필터 + 최신순 정렬
- 무한스크롤 (20개 단위 페이지네이션)
- `IntersectionObserver` 기반 이미지 lazy loading
- 카드 클릭 시 상세 페이지 이동 (`news_detail.html?id=`)
- 상세 페이지: URL 파라미터 `id`로 `news.json`에서 해당 기사 렌더링

**개선**

- `news.js` / `news_detail.js`: 뉴스 제목 / 이미지 / 요약 / 소스 삽입 시 `escapeHtml()` 적용

---

## 📅 schedule/ — 레이스 일정

### 주요 기능

- 시즌 selector로 연도별 일정 전환
- 라운드별 일정 카드 렌더링 (날짜, 서킷, 국가 정보)
- `textContent` 기반 DOM 조작으로 XSS 안전

---

## 🎬 video/ — 영상

### 주요 기능

- 라운드별 영상 카드 (YouTube URL에서 썸네일 자동 생성)
- 카테고리 드롭다운 필터
- `classList` 기반 show/hide 전환

---

## 🗳️ prediction/ — 승부예측

### 주요 기능

- 주(week) 단위 예측 카드
- Rank / Single / Multi 3가지 선택 모드
- `localStorage`로 선택 상태 자동 저장 및 복원
- 잠금(Lock) 기능으로 제출 후 수정 방지
- 전체 초기화 버튼 (confirm 확인 후 실행)

---

## 👤 login/ — 로그인 / 회원가입

### 주요 기능

- 로그인 / 회원가입 폼 UI
- 비밀번호 일치 검증
- 로그인 기능은 현재 미구현 상태

---

## 📋 policy/ — 정책

### 주요 기능

- 개인정보처리방침 / 이용약관 페이지
- JS 없이 정적 HTML / CSS로 구성

---

## 🗂️ data/ — JSON 데이터

```
data/
├── 2025_schedule.json
└── 2026_schedule.json
```

레이스 일정 데이터는 각 페이지 폴더 안이 아닌 `data/`로 분리했습니다.
일정 데이터는 `nextrace.js`(홈 카운트다운), `schedule.js`(전체 일정) 두 곳에서 공통으로 참조하기 때문에, 특정 페이지에 종속시키면 중복 관리가 발생합니다.
공용 데이터는 공용 위치에 두는 것이 맞다고 판단해 별도 폴더로 분리했습니다.

---

## 🖼️ images/ — 이미지 에셋

```
images/
├── common/          로고, SNS 아이콘 등 공통 이미지
└── home/
    ├── mainnews/    카테고리별 기본 이미지 (driver, team, tech, rumor, regulation)
    ├── nextrace/    서킷 이미지 (라운드별)
    └── standing/
        ├── driver/      드라이버 프로필 이미지
        └── constructor/ 컨스트럭터 로고 이미지
└── result/
    └── circuit/     결과 페이지용 서킷 이미지
```

이미지 폴더는 **페이지 구조를 그대로 반영**해 설계했습니다.
어떤 이미지가 어느 페이지에서 쓰이는지 경로만 봐도 바로 알 수 있도록, 페이지 폴더 계층과 동일한 구조로 구성했습니다.
예를 들어 `images/home/standing/driver/랜도 노리스.png`는 홈 화면 스탠딩 섹션의 드라이버 카드에 쓰이는 이미지임을 경로에서 바로 파악할 수 있습니다.

---

## 프로젝트를 통해 얻은 경험

- JSON 기반 데이터 렌더링 구조 설계
- 공통 UI 모듈화 경험 (header, footer, config)
- GitHub Pages 배포 환경 대응 경험
- 유지보수성과 보안을 고려한 리팩토링 경험 (상수 분리, XSS 방지)
