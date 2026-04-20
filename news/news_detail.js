const STATIC_JSON_URL = './news.json';

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const articleEl = document.getElementById('detailArticle');
const params = new URLSearchParams(location.search);
const newsId = params.get('id');

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const err = new Error(`HTTP_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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

function renderDetail(item) {
  articleEl.innerHTML = `
    <h1 class="detail-title">${escapeHtml(item.title || '제목 없음')}</h1>

    <div class="detail-meta">
      ${escapeHtml(item.source || '')} · ${formatDate(item.pubDate)}
    </div>

    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : ''}

    <div class="detail-summary">
      ${escapeHtml(item.summary || '')}
    </div>
  `;
}

function renderError(msg) {
  articleEl.innerHTML = `<p>${msg}</p>`;
}

async function loadFromStaticJsonById(id) {
  const json = await fetchJson(STATIC_JSON_URL);
  const list = Array.isArray(json) ? json : (json?.news ?? []);
  if (!Array.isArray(list)) return null;

  const found = list.find(n => String(n.id) === String(id));
  return found || null;
}

async function loadDetail() {
  if (!articleEl) return;

  if (!newsId) {
    renderError('잘못된 접근입니다.');
    return;
  }

  try {
    const item = await loadFromStaticJsonById(newsId);
    if (!item) {
      renderError('기사를 찾을 수 없습니다.');
      return;
    }
    renderDetail(item);
  } catch (e) {
    console.error(e);
    renderError('로드 실패');
  }
}

document.querySelector('.back-btn')?.addEventListener('click', () => history.back());

loadDetail();
