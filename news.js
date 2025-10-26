// 운영자 여부 설정
const isAdmin = true; // false로 바꾸면 사용자 모드

// 샘플 뉴스 데이터
let newsData = [
  {title: "멕시코 GP 리뷰", team: "RedBull", date: "2025-10-24", popularity: 120, img: "", content: "막스 베르스타펜 우승!"},
  {title: "맥라렌 전략 분석", team: "McLaren", date: "2025-10-23", popularity: 80, img: "", content: "팀 전략 분석."}
];

// DOM 요소
const newsList = document.getElementById("news-list");
const tabButtons = document.querySelectorAll(".news-tabs button");
const sortButtons = document.querySelectorAll(".sort-options button");
const newsFormSection = document.querySelector(".news-form-section");

if (!isAdmin) {
  newsFormSection.style.display = 'none';
}

// 필드
const newsForm = document.getElementById("news-form");
const titleInput = document.getElementById("news-title");
const teamSelect = document.getElementById("news-team");
const dateInput = document.getElementById("news-date");
const imgInput = document.getElementById("news-img");
const contentInput = document.getElementById("news-content");

let currentTeam = "all";
let currentSort = "latest";

// 뉴스 렌더링
function renderNews() {
  let filtered = currentTeam === "all" ? newsData : newsData.filter(n => n.team === currentTeam);

  if (currentSort === "latest") filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  if (currentSort === "popular") filtered.sort((a,b) => b.popularity - a.popularity);

  newsList.innerHTML = filtered.map((n, index) => `
    <article class="news-item">
      <h2>${n.title}</h2>
      ${n.img ? `<img src="${n.img}" alt="${n.title}">` : ""}
      <p>${n.content}</p>
      <p style="font-size:14px; color:#666;">팀: ${n.team} | 날짜: ${n.date}</p>
      ${isAdmin ? `<button class="delete-btn" data-index="${index}">삭제</button>` : ""}
    </article>
  `).join("");

  // 삭제 버튼 이벤트 연결
  if (isAdmin) {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.index;
        newsData.splice(idx, 1);
        renderNews();
      });
    });
  }
}

// 탭 클릭
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTeam = btn.dataset.team;
    renderNews();
  });
});

// 정렬 클릭
sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    renderNews();
  });
});

// 뉴스 작성 이벤트
newsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newArticle = {
    title: titleInput.value,
    team: teamSelect.value,
    date: dateInput.value,
    popularity: 0,
    img: imgInput.value,
    content: contentInput.value
  };
  newsData.push(newArticle);
  renderNews();
  newsForm.reset();
});

// 초기 렌더링
renderNews();
