// mainnews.js (깃허브 배포용)
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) return;

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {

      // 날짜 최신순
      const sorted = data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      // 카테고리별 1개
      const categories = ["Driver", "Team", "Tech", "Rumor", "Regulation"];
      const topByCategory = categories
        .map(cat => sorted.find(item => item.category === cat))
        .filter(Boolean);

      wrapper.innerHTML = topByCategory.map(item => `
        <div class="swiper-slide main-news-card">

          <!-- 이미지 -->
          <img
            src="${item.image}"
            alt="${item.title}"
            class="slide-img"
          />

          <!-- 상단 정보 바 -->
          <div class="main-news-info-bar">
            <span
              class="news-category-badge"
              data-category="${item.category}"
            >
              ${item.category}
            </span>

            <h3 class="main-news-title">
              ${item.title}
            </h3>
          </div>

          <!-- 상세 페이지 연결 -->
          <a
            href="/F1/news/news_detail.html?id=${item.id}"
            class="main-news-link"
            aria-label="${item.title}"
          ></a>

        </div>
      `).join("");

      new Swiper(".main-news-swiper", {
        slidesPerView: 3,
        spaceBetween: 20,
        loop: true,
        centeredSlides: true,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        }
      });
    })
    .catch(err => console.error("메인 뉴스 로딩 오류:", err));
});
