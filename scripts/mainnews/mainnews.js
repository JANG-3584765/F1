// mainnews.js (최적화 & 리팩토링)
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) return;

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {
      // 날짜 기준 최신순 정렬
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 카테고리별 최신 1개 추출
      const categories = ["Driver", "Team", "Tech", "Rumor", "Regulation"];
      const topByCategory = categories.map(cat => sorted.find(item => item.category === cat)).filter(Boolean);

      // HTML 생성
      wrapper.innerHTML = topByCategory.map(item => `
        <div class="swiper-slide main-news-card">
          <img src="${item.image}" alt="${item.title}" class="slide-img" />
          <div class="main-news-info-bar">
            <span class="news-category-badge" data-category="${item.category}">${item.category}</span>
            <h3 class="main-news-title">${item.title}</h3>
          </div>
          <a href="/F1/news/news_detail.html?id=${item.id}" class="main-news-link" aria-label="${item.title}"></a>
        </div>
      `).join("");

      // Swiper 초기화
      new Swiper(".main-news-swiper", {
        loop: false,             // 모바일 자연스러운 스크롤 위해 루프 해제
        centeredSlides: false,   // 중앙 정렬 해제
        spaceBetween: 20,
        slidesPerView: 3,
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 10 },
          480: { slidesPerView: 1.1, spaceBetween: 12 },
          768: { slidesPerView: 2, spaceBetween: 15 },
          1024: { slidesPerView: 3, spaceBetween: 20 }
        },
        observer: true,           // DOM 변화 감지
        observeParents: true,     // 부모 변화 감지
        on: {
          imagesReady(swiper) {
            swiper.update();      // 이미지 로딩 후 크기 재계산
          }
        }
      });
    })
    .catch(err => console.error("메인 뉴스 로딩 오류:", err));
});