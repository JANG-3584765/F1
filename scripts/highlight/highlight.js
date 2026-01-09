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

// 유튜브 링크 → 썸네일 URL 생성
function getYoutubeThumbnail(url) {
  const match = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return "";
}

function renderHighlights() {
  const wrapper = document.getElementById("highlight-list");
  if (!wrapper) return;

  const swiperWrapper = wrapper.querySelector(".swiper-wrapper");
  if (!swiperWrapper) return;

  // 카드 생성
  const slides = highlightData.map(link => `
    <div class="swiper-slide highlight-card">
      <a href="${link}" target="_blank">
        <div class="highlight-thumb">
          <img src="${getYoutubeThumbnail(link)}" alt="Highlight Video">
          <span class="play-icon">▶</span>
        </div>
      </a>
    </div>
  `).join("");

  // 마지막 슬라이드: 더보기
  const moreSlide = `
    <div class="swiper-slide highlight-card more-card">
      <a href="./video/video.html">
        <div class="highlight-thumb">
          <span class="more-icon">+ 더보기</span>
        </div>
      </a>
    </div>
  `;

  swiperWrapper.innerHTML = slides + moreSlide;
}

function initHighlightSwiper() {
  new Swiper(".highlights-section .swiper", {
    slidesPerView: 2,       // 처음에 3개 카드
    spaceBetween: 16,
    slidesPerGroup: 1,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    breakpoints: {
      768: { slidesPerView: 3 },
    }
  });
}