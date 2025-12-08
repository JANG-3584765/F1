document.addEventListener("DOMContentLoaded", () => {
  const newsWrapper = document.getElementById("main-news-wrapper");

  fetch("./scripts/mainnews/mainnews.json")
    .then(res => res.json())
    .then(data => {
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const categories = ["Driver", "Team", "Tech", "Rumor", "Regulation"];
      const topByCategory = categories.map(cat => sorted.find(item => item.category === cat)).filter(Boolean);

      topByCategory.forEach(item => {
        const slide = document.createElement("div");
        slide.classList.add("swiper-slide");
        slide.style.backgroundImage = `url('${item.image}')`;

        slide.innerHTML = `
          <div class="news-category-badge" data-category="${item.category}">${item.category}</div>
          <div class="main-news-text"><h3>${item.title}</h3></div>
        `;

        newsWrapper.appendChild(slide);
      });

      new Swiper(".main-news-swiper", {
        slidesPerView: 3,
        spaceBetween: 20,
        loop: true,
        centeredSlides: true,
        loopFillGroupWithBlank: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        breakpoints: {
          1024: { slidesPerView: 3 },
          768: { slidesPerView: 1 },
          480: { slidesPerView: 1 }
        }
      });
    })
    .catch(err => console.error("메인 뉴스 로딩 오류:", err));
});
