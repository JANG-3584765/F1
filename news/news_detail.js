/* news_detail.js */

const DEFAULT_URL = './news.json';
const articleEl = document.getElementById('detailArticle');

// URL 파라미터 읽기 (예: ?id=3)
const params = new URLSearchParams(location.search);
const newsId = params.get('id');

async function loadDetail() {
  if (!newsId) {
    articleEl.innerHTML = `<p>잘못된 접근입니다.</p>`;
    return;
  }

  try {
    const res = await fetch(DEFAULT_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('불러오기 실패');

    const json = await res.json();
    const NEWS = Array.isArray(json) ? json : [];

    const item = NEWS.find(x => String(x.id) === String(newsId));

    if (!item) {
      articleEl.innerHTML = `<p>기사를 찾을 수 없습니다.</p>`;
      return;
    }

    renderDetail(item);

  } catch (e) {
    console.error(e);
    articleEl.innerHTML = `<p>로드 실패</p>`;
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
    return iso;
  }
}

function renderDetail(item) {
  articleEl.innerHTML = `
    <h1 class="detail-title">${item.title}</h1>

    <div class="detail-meta">
      ${item.source} · ${formatDate(item.pubDate)}
    </div>

    ${item.image ? `<img src="${item.image}" alt="">` : ''}

    <div class="detail-summary">
      ${item.summary}
    </div>
  `;
}

loadDetail();