function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${BASE_PATH}/video/video.json`)
    .then(res => res.json())
    .then(data => {
      // 라운드 역순(최신 먼저)으로 영상 펼치기
      const allVideos = Object.keys(data.rounds)
        .map(Number)
        .sort((a, b) => b - a)
        .flatMap(k => data.rounds[k].videos);

      renderHighlights(allVideos.slice(0, 7));
      initHighlightSwiper();
    })
    .catch(err => console.error("Highlight data load error:", err));
});

function getYoutubeThumbnail(url) {
  let m = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;

  m = url.match(/[?&]v=([0-9A-Za-z_-]{11})/);
  if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;

  return "";
}

function renderHighlights(videos) {
  const swiperWrapper = document.getElementById("highlight-wrapper");
  if (!swiperWrapper) {
    console.error("highlight-wrapper 없음");
    return;
  }

  const slides = videos.map(v => `
    <div class="swiper-slide highlight-card">
      <a href="${escapeHtml(v.videoUrl)}" target="_blank" rel="noopener noreferrer">
        <div class="highlight-thumb">
          <img src="${getYoutubeThumbnail(v.videoUrl)}" alt="${escapeHtml(v.title)}" class="slide-img">
          <span class="play-icon">▶</span>
        </div>
      </a>
    </div>
  `).join("");

  const moreSlide = `
    <div class="swiper-slide highlight-card more-card">
      <a href="${BASE_PATH}/video/video.html" class="more-highlight-link" aria-label="하이라이트 더보기">
        <div class="highlight-thumb">
          <span class="more-icon">+ 더보기</span>
        </div>
      </a>
    </div>
  `;

  swiperWrapper.innerHTML = slides + moreSlide;
}

function initHighlightSwiper() {
  const section = document.querySelector(".highlights-section");
  const nextBtn = section?.querySelector(".swiper-button-next");
  const prevBtn = section?.querySelector(".swiper-button-prev");

  new Swiper(".highlights-swiper", {
    slidesPerView: 2,
    spaceBetween: 16,
    slidesPerGroup: 1,
    loop: false,
    allowTouchMove: true,

    navigation: {
      nextEl: nextBtn,
      prevEl: prevBtn
    },

    breakpoints: {
      768: { slidesPerView: 3 }
    }
  });
}
