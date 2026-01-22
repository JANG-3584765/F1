const DEFAULT_URL = 'http://localhost:5000/api/v1/news';
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
    // ✅ 상세는 /api/v1/news/:id 로 직접 요청
    const res = await fetch(`${DEFAULT_URL}/${encodeURIComponent(newsId)}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) throw new Error('NOT_FOUND');
      throw new Error('불러오기 실패');
    }

    const item = await res.json();
    renderDetail(item);

  } catch (e) {
    console.error(e);
    if (String(e.message) === 'NOT_FOUND') {
      articleEl.innerHTML = `<p>기사를 찾을 수 없습니다.</p>`;
      return;
    }
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