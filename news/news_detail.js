/* =========================================================
   news_detail.js (API 우선 + 정적 JSON fallback)
   - 1) /api/v1/news/:id 시도 (로컬/배포에서만)
   - 2) 실패 시 정적 JSON에서 id로 검색 (GitHub Pages)
   - 3) 관리자 삭제 버튼은 API+세션 가능한 환경에서만 노출
   ========================================================= */

const API_BASE = '/api/v1/news';
const AUTH_ME_URL = 'http://localhost:5000/api/v1/auth/me'; // 로컬 전용(원하면 상대경로로 바꿔도 됨)
const STATIC_JSON_URL = './news/news.json'; // 🔥 detail 페이지 위치에 맞게 필요 시 수정

const articleEl = document.getElementById('detailArticle');
const params = new URLSearchParams(location.search);
const newsId = params.get('id');

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { cache: 'no-store', ...options });
  if (!res.ok) {
    const err = new Error(`HTTP_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function checkAuth() {
  // Pages에서는 localhost로 mixed content/cors 등으로 실패 가능 → false로 처리
  try {
    const res = await fetch(AUTH_ME_URL, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return { loggedIn: false };
    return await res.json();
  } catch {
    return { loggedIn: false };
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

function renderDetail(item) {
  articleEl.innerHTML = `
    <h1 class="detail-title">${item.title || '제목 없음'}</h1>

    <div class="detail-meta">
      ${item.source || ''} · ${formatDate(item.pubDate)}
    </div>

    ${item.image ? `<img src="${item.image}" alt="">` : ''}

    <div class="detail-summary">
      ${item.summary || ''}
    </div>

    <div id="adminActions" style="margin-top:24px;"></div>
  `;
}

function renderError(msg) {
  articleEl.innerHTML = `<p>${msg}</p>`;
}

async function loadFromApiById(id) {
  // API: /api/v1/news/:id
  const item = await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`);
  return item;
}

async function loadFromStaticJsonById(id) {
  // 정적 JSON: 배열 or {news:[...]} 둘 다 대응
  const json = await fetchJson(STATIC_JSON_URL);
  const list = Array.isArray(json) ? json : (json?.news ?? []);
  if (!Array.isArray(list)) return null;

  // id 비교는 String으로 통일(숫자/문자 혼용 방지)
  const found = list.find(n => String(n.id) === String(id));
  return found || null;
}

async function attachAdminActionsIfPossible() {
  // 관리자 기능은 API+세션 가능한 환경에서만 의미 있음.
  const auth = await checkAuth();
  if (!(auth.loggedIn && auth.role === 'admin')) return;

  const box = document.getElementById('adminActions');
  if (!box) return;

  box.innerHTML = `<button id="deleteBtn">삭제</button>`;

  document.getElementById('deleteBtn').onclick = async () => {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await fetch(`${API_BASE}/${encodeURIComponent(newsId)}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store'
      });
      alert('삭제 완료');
      location.href = './news.html';
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    }
  };
}

async function loadDetail() {
  if (!articleEl) return;

  if (!newsId) {
    renderError('잘못된 접근입니다.');
    return;
  }

  // 1) API 우선
  try {
    const item = await loadFromApiById(newsId);
    renderDetail(item);
    await attachAdminActionsIfPossible();
    return;
  } catch (e) {
    // 404든 네트워크든 → 정적 fallback 시도
    console.warn('API detail load failed. Try static fallback.', e);
  }

  // 2) 정적 JSON fallback
  try {
    const item = await loadFromStaticJsonById(newsId);
    if (!item) {
      renderError('기사를 찾을 수 없습니다.');
      return;
    }
    renderDetail(item);
    // Pages에서는 관리자 기능 의미 없으니(서버 없음) 굳이 붙이지 않음
    return;
  } catch (e) {
    console.error(e);
    renderError('로드 실패');
  }
}

loadDetail();