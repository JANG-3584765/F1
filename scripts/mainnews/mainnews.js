// mainnews.js (최적화 + 자동 슬라이드 3초)
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) return;

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {
      // 최신순 정렬
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 카테고리별 최신 1개
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
        loop: false,
        centeredSlides: false,
        spaceBetween: 20,
        slidesPerView: 3,
        autoplay: {
          delay: 3000,      // 3초마다 자동 이동
          disableOnInteraction: false, // 사용자가 스크롤해도 자동 슬라이드 유지
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        },
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 10 },
          480: { slidesPerView: 1.1, spaceBetween: 12 },
          768: { slidesPerView: 2, spaceBetween: 15 },
          1024: { slidesPerView: 3, spaceBetween: 20 }
        },
        observer: true,
        observeParents: true,
        on: {
          imagesReady(swiper) {
            swiper.update();
          }
        }
      });
    })
    .catch(err => console.error("메인 뉴스 로딩 오류:", err));
});