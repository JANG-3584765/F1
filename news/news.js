const STATIC_JSON_URL = './news.json';

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const DETAIL_PAGE_URL = './news_detail.html';

const newsContainer =
  document.getElementById('newsContainer') || document.querySelector('.news-list');

const tabsEl = document.querySelectorAll('.news-category-tabs button');
const sourceFilterEl = document.getElementById('newsSourceFilter');

let NEWS = [];
let activeCategory = 'all';

let renderList = [];
let page = 0;
const PAGE_SIZE = 20;
let isLoading = false;

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.json();
}

function detectSourceClass(source) {
  if (!source) return 'media';
  const s = source.toLowerCase();

  if (['f1', 'fia', 'formula1.com', 'formula 1'].some(x => s.includes(x))) return 'official';
  if (['autosport', 'motorsport', 'racefans', 'the-race'].some(x => s.includes(x))) return 'media';
  if (['marko', 'wolff', 'brown', 'horner', '기자', 'journalist'].some(x => s.includes(x))) return 'reporter';
  if (['rumor', '루머', 'gossip'].some(x => s.includes(x))) return 'rumor';

  return 'media';
}

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

function detectCardType(item) {
  const summary = item.summary || "";
  const lower = ((item.title || "") + " " + (item.summary || "")).toLowerCase();
  const hasImage = !!item.image;

  if (hasImage && summary.length >= 120) return 'analysis';
  if (summary.length <= 120) return 'short';
  if (['analysis', 'aero', 'technical', '업그레이드', '패키지'].some(k => lower.includes(k))) return 'analysis';
  return 'short';
}

function normalizeNewsItem(item) {
  const safe = { ...item };

  if (!safe.pubDate) safe.pubDate = new Date().toISOString();
  if (!safe.title) safe.title = '제목 없음';
  if (!safe.summary) safe.summary = '';

  safe.sourceClass = safe.sourceClass || detectSourceClass(safe.source || '');
  safe.tags = (Array.isArray(safe.tags) && safe.tags.length) ? safe.tags : detectTags(safe.title, safe.summary);
  safe.cardType = safe.cardType || detectCardType(safe);

  return safe;
}

async function loadNewsData() {
  try {
    const json = await fetchJson(STATIC_JSON_URL);
    const list = Array.isArray(json) ? json : (json?.news ?? []);
    if (!Array.isArray(list)) throw new Error('Invalid JSON format');
    NEWS = list.map(normalizeNewsItem);
  } catch (e) {
    console.error('뉴스 데이터 로드 실패', e);
  }
}

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

function makeBadges(tags, sourceClass) {
  const tagBadges = (tags || [])
    .slice(0, 2)
    .map(t => `<span class="badge">${escapeHtml(t)}</span>`)
    .join(' ');
  return `${tagBadges} <span class="badge">${escapeHtml(sourceClass || 'media')}</span>`;
}

function renderCard(item) {
  const imgTag = item.image ? `<img data-src="${escapeHtml(item.image)}" alt="">` : '';

  if (item.cardType === 'analysis') {
    return `
      <article class="news-card analysis" data-id="${item.id}">
        <div class="meta-row">
          <div class="badges">${makeBadges(item.tags, item.sourceClass)}</div>
          <div style="margin-left:auto;font-size:12px;color:var(--muted)">
            ${escapeHtml(item.source || '')} · ${formatDate(item.pubDate)}
          </div>
        </div>
        ${imgTag}
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-summary">${escapeHtml(item.summary || '')}</div>
      </article>
    `;
  }

  return `
    <article class="news-card short" data-id="${item.id}">
      ${item.image ? `<img class="thumb" data-src="${escapeHtml(item.image)}" alt="">` : `<div class="thumb"></div>`}
      <div class="short-body">
        <div class="s-title">${escapeHtml(item.title)}</div>
        <div class="s-text">${escapeHtml(item.summary || '')}</div>
        <div style="margin-top:6px;font-size:12px;color:var(--muted)">
          ${escapeHtml(item.source || '')} · ${formatDate(item.pubDate)}
        </div>
      </div>
    </article>
  `;
}

function applyFilters(list) {
  const src = sourceFilterEl?.value || 'all';
  let out = list.slice();

  if (activeCategory !== 'all') {
    out = out.filter(it => (it.tags || []).includes(activeCategory));
  }
  if (src !== 'all') {
    out = out.filter(it => it.sourceClass === src);
  }

  return out.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function resetAndRender() {
  renderList = applyFilters(NEWS);
  page = 0;
  if (newsContainer) newsContainer.innerHTML = "";
  loadMore();
}

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

document.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;

  localStorage.setItem("news_scroll", String(window.scrollY || 0));
  setTimeout(() => {
    location.href = `${DETAIL_PAGE_URL}?id=${encodeURIComponent(card.dataset.id)}`;
  }, 50);
});

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

function setupLazyLoading() {
  const lazyImages = document.querySelectorAll("img[data-src]");
  if (!lazyImages.length) return;

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

function newsEnhance() {
  setupLazyLoading();
}

window.addEventListener('scroll', () => {
  if (isLoading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
    loadMore();
  }
});

tabsEl.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.news-category-tabs .active')?.classList.remove('active');
    btn.classList.add('active');
    activeCategory = btn.dataset.category || 'all';
    resetAndRender();
  });
});

if (sourceFilterEl) {
  sourceFilterEl.addEventListener('change', resetAndRender);
}

(async () => {
  await loadNewsData();
  resetAndRender();
})();
