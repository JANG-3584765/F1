// mainnews.js (리팩토링 버전)
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) return;

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {
      // 날짜 최신순 정렬
      const sorted = data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      // 카테고리별 1개씩
      const categories = ["Driver", "Team", "Tech", "Rumor", "Regulation"];
      const topByCategory = categories
        .map(cat => sorted.find(item => item.category === cat))
        .filter(Boolean);

      // 슬라이드 HTML 생성
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

          <!-- 전체 클릭 링크 -->
          <a
            href="/F1/news/news_detail.html?id=${item.id}"
            class="main-news-link"
            aria-label="${item.title}"
          ></a>
        </div>
      `).join("");

      // Swiper 초기화 (모바일/데스크톱 반응형)
      const mainNewsSwiper = new Swiper(".main-news-swiper", {
        loop: false,                 // 루프 해제 (모바일 끊김 방지)
        slidesPerView: 3,
        spaceBetween: 20,
        centeredSlides: false,       // 모바일 자연스러운 스크롤 위해 false
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
            spaceBetween: 10,
            centeredSlides: false
          },
          480: {
            slidesPerView: 1.1,
            spaceBetween: 12,
            centeredSlides: false
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 15,
            centeredSlides: false
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 20,
            centeredSlides: false
          }
        },
        observer: true,        // DOM 변화 감지
        observeParents: true,  // 부모 변화 감지
        on: {
          imagesReady: function () {
            this.update();      // 이미지 로딩 후 슬라이드 재계산
          }
        }
      });
    })
    .catch(err => console.error("메인 뉴스 로딩 오류:", err));
});