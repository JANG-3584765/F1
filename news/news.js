/* =====================================================================
   news.js (통합 안정 버전)
   - news.json 로딩
   - 임시 데이터 지원
   - 자동 소스 / 태그 / 카드 타입 분류
   - 무한 스크롤
   - 리스트 → 상세 페이지 라우팅
   - Lazy-loading
   - 뒤로가기 스크롤 복원
   ===================================================================== */

const DEFAULT_URL = 'http://localhost:5000/api/v1/news';
const newsContainer = document.getElementById('newsContainer') || document.querySelector('.news-list');
const tabsEl = document.querySelectorAll('.news-category-tabs button');
const sourceFilterEl = document.getElementById('newsSourceFilter');

let NEWS = [];
let activeCategory = 'all';

// 무한 스크롤 상태
let renderList = [];
let page = 0;
const PAGE_SIZE = 20;
let isLoading = false;

/* -----------------------------------------------------
   1) 소스 분류
----------------------------------------------------- */
function detectSourceClass(source) {
  if (!source) return 'media';
  const s = source.toLowerCase();

  if (['f1', 'fia', 'formula1.com', 'formula 1'].some(x => s.includes(x))) return 'official';
  if (['autosport', 'motorsport', 'racefans', 'the-race'].some(x => s.includes(x))) return 'media';
  if (['marko', 'wolff', 'brown', 'horner', '기자', 'journalist'].some(x => s.includes(x))) return 'reporter';
  if (['rumor', '루머', 'gossip'].some(x => s.includes(x))) return 'rumor';

  return 'media';
}

/* -----------------------------------------------------
   2) 태그 분류
----------------------------------------------------- */
function detectTags(title, summary) {
  const txt = `${title} ${summary}`.toLowerCase();
  const tags = [];

  if (['team', 'constructor', '업데이트', '팀'].some(k => txt.includes(k))) tags.push('team');
  if (['driver', '드라이버', '페널티', '인터뷰'].some(k => txt.includes(k))) tags.push('driver');
  if (['aero', 'technical', '업그레이드', '패키지'].some(k => txt.includes(k))) tags.push('tech');
  if (['규정', 'rule', 'regulation', '징계'].some(k => txt.includes(k))) tags.push('reg');
  if (['루머', 'rumor', '추측'].some(k => txt.includes(k))) tags.push('rumor');

  return tags.length ? tags : ['etc'];
}

/* -----------------------------------------------------
   3) 카드 타입 분류
----------------------------------------------------- */
function detectCardType(item) {
  const summary = item.summary || "";
  const lower = (item.title + " " + item.summary).toLowerCase();
  const hasImage = !!item.image;

  if (hasImage && summary.length >= 120) return 'analysis';
  if (summary.length <= 120) return 'short';
  if (['analysis', 'aero', 'technical', '업그레이드', '패키지'].some(k => lower.includes(k))) return 'analysis';
  return 'short';
}

/* -----------------------------------------------------
   4) 뉴스 데이터 로드 (json + 임시데이터)
----------------------------------------------------- */
async function loadNewsData() {
  try {
    const res = await fetch(DEFAULT_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('news.json 불러오기 실패');

    const json = await res.json();
    NEWS = Array.isArray(json) ? json : [];

    NEWS = NEWS.map(item => ({
      ...item,
      sourceClass: item.sourceClass || detectSourceClass(item.source || ''),
      tags: item.tags?.length ? item.tags : detectTags(item.title, item.summary),
      cardType: item.cardType || detectCardType(item),
    }));

  } catch (e) {
    console.warn('❌ news.json 불러오기 실패, 임시 데이터 사용', e);
    // 임시 데이터 생성
    NEWS = Array.from({ length: 30 }).map((_, i) => ({
      id: `temp-${i}`,
      title: `임시 뉴스 제목 ${i + 1}`,
      summary: "이곳은 뉴스 요약 내용입니다.",
      image: "https://via.placeholder.com/400x220?text=News+Image",
      source: i % 2 === 0 ? 'F1 공식' : 'RaceFans',
      pubDate: new Date(Date.now() - i * 3600 * 1000).toISOString()
    }));

    NEWS = NEWS.map(item => ({
      ...item,
      sourceClass: detectSourceClass(item.source),
      tags: detectTags(item.title, item.summary),
      cardType: detectCardType(item),
    }));
  }
}

/* -----------------------------------------------------
   5) 날짜 포맷
----------------------------------------------------- */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/* -----------------------------------------------------
   6) 배지 생성
----------------------------------------------------- */
function makeBadges(tags, sourceClass) {
  const tagBadges = (tags || []).slice(0, 2).map(t => `<span class="badge">${t}</span>`).join(' ');
  return `${tagBadges} <span class="badge">${sourceClass}</span>`;
}

/* -----------------------------------------------------
   7) 카드 렌더링
----------------------------------------------------- */
function renderCard(item) {
  const imgTag = item.image ? `<img data-src="${item.image}" alt="">` : '';
  if (item.cardType === 'analysis') {
    return `
      <article class="news-card analysis" data-id="${item.id}">
        <div class="meta-row">
          <div class="badges">${makeBadges(item.tags, item.sourceClass)}</div>
          <div style="margin-left:auto;font-size:12px;color:var(--muted)">
            ${item.source} · ${formatDate(item.pubDate)}
          </div>
        </div>
        ${imgTag}
        <div class="card-title">${item.title}</div>
        <div class="card-summary">${item.summary}</div>
      </article>
    `;
  }
  return `
    <article class="news-card short" data-id="${item.id}">
      ${item.image ? `<img class="thumb" data-src="${item.image}" alt="">` : `<div class="thumb"></div>`}
      <div class="short-body">
        <div class="s-title">${item.title}</div>
        <div class="s-text">${item.summary}</div>
        <div style="margin-top:6px;font-size:12px;color:var(--muted)">
          ${item.source} · ${formatDate(item.pubDate)}
        </div>
      </div>
    </article>
  `;
}

/* -----------------------------------------------------
   8) 필터 적용
----------------------------------------------------- */
function applyFilters(list) {
  const src = sourceFilterEl?.value || 'all';
  let out = list.slice();
  if (activeCategory !== 'all') out = out.filter(it => (it.tags || []).includes(activeCategory));
  if (src !== 'all') out = out.filter(it => it.sourceClass === src);
  return out.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

/* -----------------------------------------------------
   9) 리스트 초기화 후 렌더링
----------------------------------------------------- */
function resetAndRender() {
  renderList = applyFilters(NEWS);
  page = 0;
  newsContainer.innerHTML = "";
  loadMore();
}

/* -----------------------------------------------------
   10) 무한 스크롤 loadMore()
----------------------------------------------------- */
function loadMore() {
  if (isLoading) return;
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
  }, 250);
}

/* -----------------------------------------------------
   11) 뒤로가기 스크롤 저장
----------------------------------------------------- */
document.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;

  localStorage.setItem("news_scroll", window.scrollY);
  setTimeout(() => {
    location.href = `news_detail.html?id=${card.dataset.id}`;
  }, 50);
});

/* -----------------------------------------------------
   12) 뒤로가기 스크롤 복원
----------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("news_scroll");
  if (!saved) return;

  const targetY = parseInt(saved, 10);
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

/* -----------------------------------------------------
   13) 로딩 스피너
----------------------------------------------------- */
function addLoader() {
  if (!document.getElementById("loader")) {
    newsContainer.insertAdjacentHTML('beforeend', `<div id="loader" class="loader">불러오는 중...</div>`);
  }
}
function removeLoader() {
  const el = document.getElementById("loader");
  if (el) el.remove();
}

/* -----------------------------------------------------
   14) Lazy Loading
----------------------------------------------------- */
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll("img[data-src]");
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
    img.setAttribute("data-loading", "lazy");
    io.observe(img);
  });
}

/* -----------------------------------------------------
   15) 렌더 후 추가 실행
----------------------------------------------------- */
function newsEnhance() {
  setupLazyLoading();
}

/* -----------------------------------------------------
   16) 무한 스크롤 감지
----------------------------------------------------- */
window.addEventListener('scroll', () => {
  if (isLoading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
});

/* -----------------------------------------------------
   17) 탭 필터
----------------------------------------------------- */
tabsEl.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.news-category-tabs .active')?.classList.remove('active');
    btn.classList.add('active');
    activeCategory = btn.dataset.category || 'all';
    resetAndRender();
  });
});

/* -----------------------------------------------------
   18) 소스 필터
----------------------------------------------------- */
if (sourceFilterEl) {
  sourceFilterEl.addEventListener('change', resetAndRender);
}

/* -----------------------------------------------------
   19) 초기 실행
----------------------------------------------------- */
(async () => {
  await loadNewsData();
  resetAndRender();
})();
