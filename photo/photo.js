/* =====================================================================
   photo.js (최적화 버전)
   - photo_team.json / photo_driver.json 로딩
   - 팀 팬용 / 드라이버 팬용 필터
   - 무한 스크롤
   - Lazy-loading
===================================================================== */

const photoGrid = document.getElementById('photo-grid');

const themeTabs = document.querySelectorAll('.fan-theme-tabs .tab');
const teamFilters = document.querySelectorAll('.team-filters .tab');
const driverFilters = document.querySelectorAll('.driver-filters .tab');

let PHOTOS = [];
let activeTheme = 'team';       // team / driver
let activeTeam = 'All';
let activeDriver = 'All';

let renderList = [];
let page = 0;
const PAGE_SIZE = 20;
let isLoading = false;

/* -----------------------------------------------------
   1) 사진 데이터 로드
----------------------------------------------------- */
async function loadPhotoData() {
  const url = activeTheme === 'team' ? './photo_team.json' : './photo_driver.json';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${url} 불러오기 실패`);
    PHOTOS = await res.json();
  } catch (e) {
    console.warn(`❌ ${url} 불러오기 실패, 임시 데이터 사용`, e);
    PHOTOS = Array.from({ length: 20 }).map((_, i) => ({
      id: `temp-${i}`,
      image: `https://via.placeholder.com/400x300?text=Photo+${i + 1}`,
      team: activeTheme === 'team' ? 'Red Bull' : '',
      driver: activeTheme === 'driver' ? 'Max Verstappen' : ''
    }));
  }
}

/* -----------------------------------------------------
   2) 필터 적용
----------------------------------------------------- */
function applyFilters() {
  return PHOTOS.filter(p => {
    if (activeTheme === 'team') return (activeTeam === 'All' || p.team === activeTeam);
    return (activeDriver === 'All' || p.driver === activeDriver);
  });
}

/* -----------------------------------------------------
   3) 그리드 렌더링
----------------------------------------------------- */
function renderGrid() {
  renderList = applyFilters();
  page = 0;
  photoGrid.innerHTML = '';
  loadMore();
}

function renderPhotoCard(item) {
  const altText = activeTheme === 'team' ? item.team : item.driver;
  return `<div class="photo-card"><img data-src="${item.image}" alt="${altText}"></div>`;
}

/* -----------------------------------------------------
   4) 무한 스크롤 & 로딩
----------------------------------------------------- */
function loadMore() {
  if (isLoading) return;
  const slice = renderList.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  if (!slice.length) return;

  isLoading = true;
  addLoader();

  setTimeout(() => {
    removeLoader();
    photoGrid.insertAdjacentHTML('beforeend', slice.map(renderPhotoCard).join(''));
    setupLazyLoading();
    page++;
    isLoading = false;
  }, 200);
}

function addLoader() {
  if (!document.getElementById("loader")) {
    photoGrid.insertAdjacentHTML('beforeend', `<div id="loader" class="loader">불러오는 중...</div>`);
  }
}
function removeLoader() {
  const el = document.getElementById("loader");
  if (el) el.remove();
}

/* -----------------------------------------------------
   5) Lazy Loading
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
    img.setAttribute("loading", "lazy");
    io.observe(img);
  });
}

/* -----------------------------------------------------
   6) 팬 테마 탭 이벤트
----------------------------------------------------- */
themeTabs.forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelector('.fan-theme-tabs .active')?.classList.remove('active');
    tab.classList.add('active');

    activeTheme = tab.dataset.theme;
    activeTeam = 'All';
    activeDriver = 'All';

    document.querySelector('.team-filters').classList.toggle('active', activeTheme === 'team');
    document.querySelector('.driver-filters').classList.toggle('active', activeTheme === 'driver');

    await loadPhotoData();
    renderGrid();
  });
});

/* -----------------------------------------------------
   7) 팀/드라이버 필터 이벤트
----------------------------------------------------- */
teamFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.team-filters .active')?.classList.remove('active');
    btn.classList.add('active');
    activeTeam = btn.dataset.team;
    renderGrid();
  });
});

driverFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.driver-filters .active')?.classList.remove('active');
    btn.classList.add('active');
    activeDriver = btn.dataset.driver;
    renderGrid();
  });
});

/* -----------------------------------------------------
   8) 무한 스크롤 감지
----------------------------------------------------- */
window.addEventListener('scroll', () => {
  if (!isLoading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
});

/* -----------------------------------------------------
   9) 초기 실행
----------------------------------------------------- */
(async () => {
  await loadPhotoData();
  renderGrid();
})();