// STEP 1: 데이터 로딩 + id 기준 정렬 검증 + 콘솔 검증
document.addEventListener("DOMContentLoaded", () => {
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

      // id 오름차순 정렬 (1 → 5)
      const sortedById = [...data].sort((a, b) => a.id - b.id);

      console.log("mainnews.json 원본 데이터");
      console.table(data);

      console.log("id 기준 정렬 데이터 (1 → 5)");
      console.table(sortedById);

      console.log("총 기사 개수:", sortedById.length);
    })
    .catch(err => {
      console.error("메인 뉴스 STEP 1 오류:", err);
    });
});

// STEP 2: 메인 뉴스 카드 렌더링(DOM에 5개 카드 삽입)
const wrapper = document.getElementById("main-news-wrapper");
if (!wrapper) {
  console.error("main-news-wrapper 없음");
  return;
}

// 기존 플레이스홀더 제거
wrapper.innerHTML = "";

// 카드 생성
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
    <a href="/F1/news/news_detail.html?id=${item.id}"
       class="main-news-link"
       aria-label="${item.title}">
    </a>
  `;

  wrapper.appendChild(slide);
});

console.log("✅ STEP 2: 메인 뉴스 카드 렌더링 완료");
