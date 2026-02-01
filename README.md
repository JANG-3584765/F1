# WhatisF1

F1 뉴스, 경기 일정, 하이라이트 영상, 레이스 결과, 시즌 순위, 승부예측 기능을 한 곳에서 제공하는 F1 정보 서비스 웹 플랫폼입니다.
Vanilla JavaScript 기반으로 전체 서비스를 구축한 뒤, 핵심 기능인 뉴스 탭만 React / Next.js(App Router)로 부분 마이그레이션하여 점진적 전환이 가능한 구조로 설계했습니다.


## Tool

Frontend

* HTML5, CSS3, JavaScript (ES6+)
* React, Next.js (App Router)

Backend

* Node.js, Express

API / Web

* REST API (fetch)
* IntersectionObserver
* LocalStorage


Tools / Deploy
* Git, GitHub


## Project Structure

## Project Structure

```text
root
 ├─ index.html

 ├─ common/                     # 공통 UI
 │   ├─ header.html
 │   ├─ header.css
 │   ├─ header.js
 │   ├─ footer.html
 │   ├─ footer.css
 │   └─ footer.js

 ├─ data/                       # 시즌 데이터 (일정, 결과 공통)
 │   ├─ 2025_schedule.json
 │   └─ 2026_schedule.json

 ├─ images/
 │   ├─ common/
 │   │   ├─ logo.png
 │   │   └─ instagram_logo.png
 │   ├─ home/
 │   │   ├─ mainnews/
 │   │   ├─ nextrace/
 │   │   └─ standing/
 │   └─ result/
 │       └─ circuit/            # 서킷 이미지

 ├─ scripts/                    # 홈 섹션 모듈
 │   ├─ mainnews/   (html, css, js)
 │   ├─ nextrace/   (html, css, js)
 │   ├─ highlight/  (html, css, js)
 │   ├─ standing/   (html, css, js)
 │   └─ guess/      (html, css, js)

 ├─ news/                       # Vanilla JS 뉴스
 │   ├─ news.html
 │   ├─ news.css
 │   ├─ news.js
 │   ├─ news_detail.html
 │   ├─ news_detail.css
 │   ├─ news_detail.js
 │   ├─ news_generate.js
 │   └─ news.json

 ├─ prediction/
 │   ├─ prediction.html
 │   ├─ prediction.css
 │   └─ prediction.js

 ├─ schedule/
 │   ├─ schedule.html
 │   ├─ schedule.css
 │   └─ schedule.js

 ├─ result/
 │   ├─ result.html
 │   ├─ result.css
 │   ├─ result.js
 │   └─ 2025_round_result.json

 ├─ ranking/
 │   ├─ ranking.html
 │   ├─ ranking.css
 │   ├─ ranking.js
 │   └─ season/

 ├─ video/
 │   ├─ video.html
 │   ├─ video.css
 │   ├─ video.js
 │   └─ video.json

 ├─ login/
 │   ├─ login.html
 │   ├─ login.css
 │   ├─ login.js
 │   ├─ signup.html
 │   ├─ signup.css
 │   └─ signup.js

 ├─ policy/
 │   ├─ terms.html
 │   ├─ privacy.html
 │   └─ policy.css

 └─ backend/
     ├─ server.js
     └─ data/
         └─ users.json



## Architecture Overview

* 홈 / 일정 / 결과 / 순위 / 하이라이트 / 승부예측 → Vanilla JS
* 뉴스 탭 → Next.js 부분 마이그레이션
* 데이터 저장소 → JSON 파일
* API 서버 → Express
* 인증 → express-session
*목표: 기존 구조 유지 + 핵심 기능만 단계적 프레임워크 이전


## Home

홈은 다음 5개 모듈로 구성됩니다.

* Next Race(경기 일정 및 결과 연결)
* Main News(뉴스 연결)
* Highlights(하이라이트 연결)
* Standing TOP3(순위 연결): 드라이버, 팀 Top3 제공(가독성 고려)
* Prediction Quick Link(승부예측 연결)

각 섹션은 독립 모듈로 분리되어 로딩 및 유지보수가 가능합니다.
각 섹션에 더보기 버튼을 배치하여 각각 메뉴로 접속할 수 있도록 하였습니다.

## Next Race

* 2025 / 2026 시즌 스케줄 JSON 병합 로드
* 현재 시각 기준 가장 가까운 세션 자동 탐색
* 예정 / 진행중 / 종료 상태 판별
* 1초 단위 카운트다운
* 세션 종료 시 다음 세션 자동 갱신
* 10분 주기 데이터 재검사
* 국가 → 깃발 이모지 매핑 + fallback 처리

## Main news
* 뉴스에서의 각 카테고리(팀, 드라이버, 기술, 규정, 루머) 별 메인 뉴스를 배치
* 클릭 시 해당 기사로 접속할 수 있게 연결

## News (Vanilla JS)

### Data Loading Strategy

1. Express API 우선 호출
2. 실패 시 정적 JSON 로드
3. 최후 더미 데이터 생성

배포 환경(GitHub Pages)에서도 동작 가능하도록 설계.

### Features

* 카테고리 필터링
* 소스 필터링
* 무한 스크롤
* Lazy Loading
* 스크롤 위치 복원(LocalStorage)
* 카드 타입 분기(analysis / short)

### Detail Page

* Query String 기반 id 추출
* API → JSON fallback
* 세션 인증 확인 후 관리자만 삭제 버튼 노출


## News (Next.js Migration)

Vanilla JS 뉴스 구조를 유지한 채 Next.js(App Router) 기반으로 재구성.

### List Page

* public/news.json 로드
* useState로 상태 관리
* useMemo로 필터링 + 정렬
* IntersectionObserver 기반 무한 스크롤
* useRouter로 상세 페이지 이동

### Detail Page

* useParams로 id 추출
* 단일 기사 탐색
* 로딩 / 실패 / 정상 상태 분기

### 특징

* 파일 기반 라우팅
* 페이지 단위 CSS 분리
* 추후 API 연동 시 fetch 대상만 교체


## Backend (Express)

### Basic

* REST API 서버
* express.json, CORS
* 프론트엔드 정적 서빙

### File-based Storage

* news/news.json
* backend/data/users.json

CRUD 흐름: Read → Parse → Validate → Modify → Save

### Auth

* express-session
* 로그인 / 회원가입 / 로그아웃
* role 기반 권한 분리 (admin / user)

### News API

* GET /api/v1/news
* GET /api/v1/news/:id
* POST / PUT / DELETE (admin only)


## Schedule

* 다중 시즌 JSON 병합
* 시즌 선택 드롭다운
* 레이스 카드 렌더링
* 라운드 기간 자동 계산
* 세션 상세 토글

## Race Result

* 시즌 / 라운드 드롭다운
* 메타 정보 표시 (서킷, 날짜, 랩수 등)
* 결과 데이터 정규화

분류:
* 완주자(position)
* DNF / DNS / DSQ

구성:
* Top5 미리보기
* 전체 결과 토글


## Standing

* Drivers / Constructors 탭
* 시즌 선택
* 팀 컬러 매핑
* 데이터 없을 경우 Empty Row 처리


## Prediction

* Week별 아코디언 UI
* Single / Multi / Rank(Top3) 타입
* LocalStorage 저장
* 선택 완료 시 잠금
* 새로고침 후 상태 복원


## Technical Focus

* 프레임워크 없이 상태 관리 설계
* JSON 기반 데이터 정규화
* 점진적 마이그레이션 구조
* 대용량 리스트 성능 고려


## Future Improvements

* DB 연동
* 로그인 사용자별 예측 저장
* 뉴스 API Next.js 통합
* 실제 결과와 예측 비교
