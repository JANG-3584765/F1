document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("main-news-wrapper");
  if (!wrapper) {
    console.error("main-news-wrapper 없음");
    return;
  }

  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => {
      if (!res.ok) throw new Error("JSON fetch 실패");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("data가 배열이 아님", data);
        return;
      }

      // STEP 1: id 기준 정렬
      const sortedById = [...data].sort((a, b) => a.id - b.id);

      // STEP 2: 카드 렌더링
      wrapper.innerHTML = "";
      sortedById.forEach(item => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide main-news-card";

        slide.innerHTML = `
          <img src="${item.image}" alt="${item.title}" class="slide-img" />
          <div class="main-news-info-bar">
            <span class="news-category-badge" data-category="${item.category}">
              ${item.category}
            </span>
            <h3 class="main-news-title">${item.title}</h3>
          </div>
          <a href="/F1/news/news_detail.html?id=${item.id}" class="main-news-link" aria-label="${item.title}"></a>
        `;

        wrapper.appendChild(slide);
      });

      // STEP 3: Swiper 초기화
      const mainNewsSwiper = new Swiper(".main-news-swiper", {
        slidesPerView: 1,          // 기본 1장
        spaceBetween: 20,
        loop: false,
        allowTouchMove: true,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        },

        // 모바일부터 데스크톱까지 브레이크포인트
        breakpoints: {
          0: { slidesPerView: 1, slidesPerGroup: 1 },      // 초소형 화면
          480: { slidesPerView: 2, slidesPerGroup: 1 },    // 작은 모바일 → 2장 보임, 1장씩 이동
          768: { slidesPerView: 2, slidesPerGroup: 1 },    // 일반 모바일 → 2장 보임, 1장씩 이동
          1024: { slidesPerView: 3, slidesPerGroup: 1 }    // 데스크톱 → 3장 보임, 1장씩 이동
        },

        on: {
          init() { updateNavState(this); },
          slideChange() { updateNavState(this); }
        }
      });

      // STEP 4: 양 끝 이동 제한
      function updateNavState(swiper) {
        const prevBtn = document.querySelector(".swiper-button-prev");
        const nextBtn = document.querySelector(".swiper-button-next");
        if (!prevBtn || !nextBtn) return;

        prevBtn.style.opacity = swiper.isBeginning ? "0.3" : "1";
        prevBtn.style.pointerEvents = swiper.isBeginning ? "none" : "auto";

        nextBtn.style.opacity = swiper.isEnd ? "0.3" : "1";
        nextBtn.style.pointerEvents = swiper.isEnd ? "none" : "auto";
      }
    })
    .catch(err => {
      console.error("메인 뉴스 오류:", err);
    });
});
