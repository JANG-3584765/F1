// highlight.js
document.addEventListener("DOMContentLoaded", () => {
  renderHighlights();
  initHighlightSwiper();
});

// 유튜브 링크 배열
const highlightData = [
  "https://youtu.be/S-LMSpzlnc0?si=wcuXcT6e2D4xdTlB",
  "https://youtu.be/E6aFUtgKX2E?si=oFaC-qDuHXOFodnh",
  "https://youtu.be/w-fRL80HpxA?si=erXidGq5v1YRwzy-",
  "https://youtu.be/oQI93sLnBks?si=VnT5urM1yAkulEi7",
  "https://youtu.be/IiaVcT3SZv0?si=UsjXEVDLGkwZepyb",
  "https://youtu.be/MHJZUoi9yAo?si=SME-ClGy2xSn6D-z",
  "https://youtu.be/wZ5D4a-EgZI?si=xbhmss9w0UUqGT0u"
];

// 유튜브 링크 → 썸네일 URL 생성 (youtu.be / youtube.com 둘 다 대응)
function getYoutubeThumbnail(url) {
  // youtu.be/VIDEO_ID
  let m = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;

  // youtube.com/watch?v=VIDEO_ID
  m = url.match(/[?&]v=([0-9A-Za-z_-]{11})/);
  if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;

  return "";
}

function renderHighlights() {
  // ✅ HTML의 wrapper id에 맞춤
  const swiperWrapper = document.getElementById("highlight-wrapper");
  if (!swiperWrapper) {
    console.error("highlight-wrapper 없음");
    return;
  }

  const slides = highlightData.map(link => `
    <div class="swiper-slide highlight-card">
      <a href="${link}" target="_blank" rel="noopener noreferrer">
        <div class="highlight-thumb">
          <img src="${getYoutubeThumbnail(link)}" alt="Highlight Video" class="slide-img">
          <span class="play-icon">▶</span>
        </div>
      </a>
    </div>
  `).join("");

  const moreSlide = `
    <div class="swiper-slide highlight-card more-card">
      <a href="./video/video.html" class="more-highlight-link" aria-label="하이라이트 더보기">
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
    slidesPerView: 2,          // 모바일: 2개
    spaceBetween: 16,
    slidesPerGroup: 1,
    loop: false,
    allowTouchMove: true,

    navigation: {
      nextEl: nextBtn,
      prevEl: prevBtn
    },

    breakpoints: {
      768: { slidesPerView: 3 },   // 태블릿/데스크톱
      1024: { slidesPerView: 3 }
    }
  });
}