/* =====================================================================
   news.js (통합 안정 버전 - API 우선 + 정적 JSON fallback)
   - 1순위: Express API (DEFAULT_API_URL)
   - 2순위: 정적 JSON (STATIC_JSON_URL): GitHub Pages
   - 3순위: 임시 데이터(50개)
   - 자동 소스 / 태그 / 카드 타입 분류
   - 무한 스크롤
   - 리스트 → 상세 페이지 라우팅
   - Lazy-loading
   - 뒤로가기 스크롤 복원
   ===================================================================== */

/* 환경/경로 설정- */
// 1) API (Express). 필요하면 배포 URL로 바꾸기
const DEFAULT_API_URL = 'http://localhost:5000/api/v1/news';
// 2) 정적 JSON (GitHub Pages)
const STATIC_JSON_URL = './news.json';

// 카드 클릭 시 이동할 상세 페이지
const DETAIL_PAGE_URL = 'news_detail.html';

// DOM
const newsContainer =
  document.getElementById('newsContainer') || document.querySelector('.news-list');

const tabsEl = document.querySelectorAll('.news-category-tabs button');
const sourceFilterEl = document.getElementById('newsSourceFilter');

// State
let NEWS = [];
let activeCategory = 'all';

// 무한 스크롤 상태
let renderList = [];
let page = 0;
const PAGE_SIZE = 20;
let isLoading = false;

/* 공통: fetch JSON */
async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.json();
}

/* 1) 소스 분류 */
function detectSourceClass(source) {
  if (!source) return 'media';
  const s = source.toLowerCase();

  if (['f1', 'fia', 'formula1.com', 'formula 1'].some(x => s.includes(x))) return 'official';
  if (['autosport', 'motorsport', 'racefans', 'the-race'].some(x => s.includes(x))) return 'media';
  if (['marko', 'wolff', 'brown', 'horner', '기자', 'journalist'].some(x => s.includes(x))) return 'reporter';
  if (['rumor', '루머', 'gossip'].some(x => s.includes(x))) return 'rumor';

  return 'media';
}

/* 2) 태그 분류 */
function detectTags(title, summary) {
  const txt = `${title || ''} ${summary || ''}`.toLowerCase();
  const tags = [];

  if (['team', 'constructor', '업데이트', '팀'].some(k => txt.includes(k))) tags.push('team');
  if (['driver', '드라이버', '페널티', '인터뷰'].some(k => txt.includes(k))) tags.push('driver');
  if (['aero', 'technical', '업그레이드', '패키지'].some(k => txt.includes(k))) tags.push('tech');
  if (['규정', 'rule', 'regulation', '징계'].some(k => txt.includes(k))) tags.push('reg');
  if (['루머', 'rumor', '추측'].some(k => txt.includes(k))) tags.push('rumor');

  return tags.length ? tags : ['etc'];
}

/* 3) 카드 타입 분류 */
function detectCardType(item) {
  const summary = item.summary || "";
  const lower = ((item.title || "") + " " + (item.summary || "")).toLowerCase();
  const hasImage = !!item.image;

  if (hasImage && summary.length >= 120) return 'analysis';
  if (summary.length <= 120) return 'short';
  if (['analysis', 'aero', 'technical', '업그레이드', '패키지'].some(k => lower.includes(k))) return 'analysis';
  return 'short';
}

/* 4) 뉴스 아이템 정규화(필수 필드 보장 + 자동 분류) */
function normalizeNewsItem(item) {
  const safe = { ...item };

  // pubDate 없는 경우 대비
  if (!safe.pubDate) safe.pubDate = new Date().toISOString();

  // title/summary 기본값
  if (!safe.title) safe.title = '제목 없음';
  if (!safe.summary) safe.summary = '';

  // sourceClass/tags/cardType 자동 생성
  safe.sourceClass = safe.sourceClass || detectSourceClass(safe.source || '');
  safe.tags = (Array.isArray(safe.tags) && safe.tags.length) ? safe.tags : detectTags(safe.title, safe.summary);
  safe.cardType = safe.cardType || detectCardType(safe);

  return safe;
}

/* 5) 임시 데이터 생성 (최후 fallback) */
function makeTempNews(count = 30) {
  const base = Date.now();
  const temp = Array.from({ length: count }).map((_, i) => ({
    id: `temp-${i}`,
    title: `임시 뉴스 제목 ${i + 1}`,
    summary: "이곳은 뉴스 요약 내용입니다.",
    image: "https://via.placeholder.com/800x450?text=News+Image",
    source: i % 2 === 0 ? 'F1 공식' : 'RaceFans',
    pubDate: new Date(base - i * 3600 * 1000).toISOString()
  }));
  return temp.map(normalizeNewsItem);
}

/* -----------------------------------------------------
   6) 뉴스 데이터 로드
   - 1) API 우선
   - 2) 정적 JSON fallback
   - 3) 임시 데이터
----------------------------------------------------- */
async function loadNewsData() {
  // 1) API
  try {
    const json = await fetchJson(DEFAULT_API_URL);

    // 응답 형태 유연하게 처리:
    // - 배열: [...]
    // - 객체: { news: [...] }
    const list = Array.isArray(json) ? json : (json?.news ?? []);
    if (!Array.isArray(list)) throw new Error('API response is not an array');

    NEWS = list.map(normalizeNewsItem);
    return;
  } catch (e) {
    console.warn('❌ API 뉴스 로드 실패 → 정적 JSON fallback 시도', e);
  }

  // 2) 정적 JSON
  try {
    const json = await fetchJson(STATIC_JSON_URL);
    const list = Array.isArray(json) ? json : (json?.news ?? []);
    if (!Array.isArray(list)) throw new Error('Static JSON is not an array');

    NEWS = list.map(normalizeNewsItem);
    return;
  } catch (e) {
    console.warn('❌ 정적 JSON 로드 실패 → 임시 데이터 사용', e);
  }

  // 3) temp
  NEWS = makeTempNews(30);
}

/* 7) 날짜 포맷 */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso || '';
  }
}

/* 8) 배지 생성 */
function makeBadges(tags, sourceClass) {
  const tagBadges = (tags || [])
    .slice(0, 2)
    .map(t => `<span class="badge">${t}</span>`)
    .join(' ');
  return `${tagBadges} <span class="badge">${sourceClass || 'media'}</span>`;
}

/* 9) 카드 렌더링- */
function renderCard(item) {
  const imgTag = item.image ? `<img data-src="${item.image}" alt="">` : '';

  if (item.cardType === 'analysis') {
    return `
      <article class="news-card analysis" data-id="${item.id}">
        <div class="meta-row">
          <div class="badges">${makeBadges(item.tags, item.sourceClass)}</div>
          <div style="margin-left:auto;font-size:12px;color:var(--muted)">
            ${item.source || ''} · ${formatDate(item.pubDate)}
          </div>
        </div>
        ${imgTag}
        <div class="card-title">${item.title}</div>
        <div class="card-summary">${item.summary || ''}</div>
      </article>
    `;
  }

  return `
    <article class="news-card short" data-id="${item.id}">
      ${item.image ? `<img class="thumb" data-src="${item.image}" alt="">` : `<div class="thumb"></div>`}
      <div class="short-body">
        <div class="s-title">${item.title}</div>
        <div class="s-text">${item.summary || ''}</div>
        <div style="margin-top:6px;font-size:12px;color:var(--muted)">
          ${item.source || ''} · ${formatDate(item.pubDate)}
        </div>
      </div>
    </article>
  `;
}

/* 10) 필터 적용 */
function applyFilters(list) {
  const src = sourceFilterEl?.value || 'all';
  let out = list.slice();

  if (activeCategory !== 'all') {
    out = out.filter(it => (it.tags || []).includes(activeCategory));
  }
  if (src !== 'all') {
    out = out.filter(it => it.sourceClass === src);
  }

  // 최신순 정렬
  return out.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

/* 11) 리스트 초기화 후 렌더링 */
function resetAndRender() {
  renderList = applyFilters(NEWS);
  page = 0;
  if (newsContainer) newsContainer.innerHTML = "";
  loadMore();
}

/* 12) 무한 스크롤 loadMore() */
function loadMore() {
  if (isLoading || !newsContainer) return;

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = renderList.slice(start, end);
  if (slice.length === 0) return;

  isLoading = true;
  addLoader();

  setTimeout(() => {
    removeLoader();
    newsContainer.insertAdjacentHTML('beforeend', slice.map(renderCard).join(''));
    newsEnhance();
    page++;
    isLoading = false;
  }, 200);
}

/* 13) 카드 클릭 → 상세 페이지 라우팅 + 스크롤 저장 */
document.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;

  localStorage.setItem("news_scroll", String(window.scrollY || 0));
  setTimeout(() => {
    location.href = `${DETAIL_PAGE_URL}?id=${encodeURIComponent(card.dataset.id)}`;
  }, 50);
});

/* 14) 뒤로가기 스크롤 복원 */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("news_scroll");
  if (!saved) return;

  const targetY = parseInt(saved, 10);
  if (Number.isNaN(targetY)) return;

  const restoreScroll = () => {
    if (document.body.offsetHeight >= targetY + 200) {
      window.scrollTo(0, targetY);
      localStorage.removeItem("news_scroll");
      return;
    }
    setTimeout(restoreScroll, 50);
  };
  restoreScroll();
});

/* 15) 로딩 스피너 */
function addLoader() {
  if (!newsContainer) return;
  if (!document.getElementById("loader")) {
    newsContainer.insertAdjacentHTML(
      'beforeend',
      `<div id="loader" class="loader">불러오는 중...</div>`
    );
  }
}
function removeLoader() {
  const el = document.getElementById("loader");
  if (el) el.remove();
}

/* 16) Lazy Loading */
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll("img[data-src]");
  if (!lazyImages.length) return;

  // 기존 io가 중복 생성되지 않게 간단 처리
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.setAttribute("data-loaded", "true");
      io.unobserve(img);
    });
  });

  lazyImages.forEach(img => {
    img.setAttribute("loading", "lazy");
    io.observe(img);
  });
}

/* 17) 렌더 후 추가 실행 */
function newsEnhance() {
  setupLazyLoading();
}

/* 18) 무한 스크롤 감지 */
window.addEventListener('scroll', () => {
  if (isLoading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
    loadMore();
  }
});

/* 19) 탭 필터 */
tabsEl.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.news-category-tabs .active')?.classList.remove('active');
    btn.classList.add('active');
    activeCategory = btn.dataset.category || 'all';
    resetAndRender();
  });
});

/* 20) 소스 필터 */
if (sourceFilterEl) {
  sourceFilterEl.addEventListener('change', resetAndRender);
}

/* 21) 초기 실행 */
(async () => {
  await loadNewsData();
  resetAndRender();
})();
