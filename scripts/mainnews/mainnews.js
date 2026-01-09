// mainnews.js (id 기준 정렬 + 자동 슬라이드)
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) return;

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) return;

      /* id 기준 오름차순 정렬 (1 → 5) */
      const sortedById = [...data].sort((a, b) => a.id - b.id);

      /* 슬라이드 HTML 생성 */
      wrapper.innerHTML = sortedById.map(item => `
        <div class="swiper-slide main-news-card">
          <img
            src="${item.image}"
            alt="${item.title}"
            class="slide-img"
            loading="lazy"
          />

          <div class="main-news-info-bar">
            <span
              class="news-category-badge"
              data-category="${item.category}"
            >
              ${item.category}
            </span>
            <h3 class="main-news-title">${item.title}</h3>
          </div>

          <a
            href="/F1/news/news_detail.html?id=${item.id}"
            class="main-news-link"
            aria-label="${item.title}"
          ></a>
        </div>
      `).join("");

      /* Swiper 초기화 */
      new Swiper(".main-news-swiper", {
        loop: false,                 // 끝에서 멈춤 (빈 슬라이드 방지)
        slidesPerView: 1,
        spaceBetween: 16,
        centeredSlides: false,
        watchOverflow: true,         // 슬라이드 부족 시 자동 비활성화
        speed: 500,

        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        },

        breakpoints: {
          768: {
            slidesPerView: 2,
            spaceBetween: 18
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 20
          }
        },

        on: {
          init() {
            this.update();
          }
        }
      });
    })
    .catch(err => {
      console.error("메인 뉴스 로딩 오류:", err);
    });
});
