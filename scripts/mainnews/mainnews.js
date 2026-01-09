document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) {
    console.error("main-news-wrapper 없음");
    return;
  }

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => {
      if (!res.ok) {
        throw new Error("JSON fetch 실패");
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("data가 배열이 아님", data);
        return;
      }

      /* STEP 1: id 기준 정렬 */
      const sortedById = [...data].sort((a, b) => a.id - b.id);

      console.log("mainnews.json 원본 데이터");
      console.table(data);

      console.log("id 기준 정렬 데이터 (1 → 5)");
      console.table(sortedById);

      console.log("총 기사 개수:", sortedById.length);

      /* STEP 2: 카드 렌더링 */

      // 기존 플레이스홀더 제거
      wrapper.innerHTML = "";

      sortedById.forEach(item => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide main-news-card";

        slide.innerHTML = `
          <img
            src="${item.image}"
            alt="${item.title}"
            class="slide-img"
          />

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

          <a
            href="/F1/news/news_detail.html?id=${item.id}"
            class="main-news-link"
            aria-label="${item.title}"
          ></a>
        `;

        wrapper.appendChild(slide);
      });

      console.log("STEP 2: 메인 뉴스 카드 렌더링 완료");

      /* STEP 3: Swiper 초기화 */

      const mainNewsSwiper = new Swiper(".main-news-swiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: false,              // id1~5에서 멈춤
        allowTouchMove: true,     // 드래그 가능

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        },

        breakpoints: {
          768: {
            slidesPerView: 2
          },
          1024: {
            slidesPerView: 3
          }
        },

        on: {
          init() {
            console.log("STEP 3: Swiper 초기화 완료");
          },
          slideChange() {
            console.log("현재 슬라이드 index:", this.activeIndex);
          }
        }
      });
    })
    .catch(err => {
      console.error("메인 뉴스 오류:", err);
    });
});