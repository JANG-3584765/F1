// ============================
// 기본 변수
// ============================
let selectedSeason = "2025";
let selectedRound = "all";
let selectedType = "all";
let videos = [];

// ============================
// JSON 불러오기
// ============================
fetch("video.json")
  .then(res => res.json())
  .then(data => {
    videos = data;
    initSeasonDropdown();
    initTabs();
    createRoundDropdown();
    filterVideos();
  });

// ============================
// 시즌 드롭다운 초기화
// ============================
function initSeasonDropdown() {
  const seasonList = document.getElementById("season-list");
  const seasonButton = document.getElementById("season-button");

  const seasons = [...new Set(videos.map(v => v.season))].sort();

  seasonButton.addEventListener("click", () => {
    seasonList.classList.toggle("show");
  });

  seasonList.innerHTML = "";
  seasons.forEach(season => {
    const li = document.createElement("li");
    li.textContent = season + " 시즌";
    li.addEventListener("click", () => {
      selectedSeason = season;
      seasonButton.textContent = season + " 시즌 ▼";
      seasonList.classList.remove("show");
      createRoundDropdown();
      filterVideos();
    });
    seasonList.appendChild(li);
  });
}

// ============================
// 라운드 드롭다운 생성
// ============================
function createRoundDropdown() {
  const roundList = document.getElementById("round-list");
  const roundButton = document.getElementById("round-button");

  roundList.innerHTML = "";

  const seasonRounds = [...new Set(
    videos.filter(v => v.season === selectedSeason).map(v => v.round)
  )];

  selectedRound = seasonRounds[seasonRounds.length - 1] || "all";
  roundButton.textContent = selectedRound + " ▼";

  const allLi = document.createElement("li");
  allLi.textContent = "전체 라운드";
  allLi.addEventListener("click", () => {
    selectedRound = "all";
    roundButton.textContent = "전체 라운드 ▼";
    filterVideos();
    roundList.classList.remove("show");
  });
  roundList.appendChild(allLi);

  seasonRounds.forEach(round => {
    const li = document.createElement("li");
    li.textContent = round;
    li.addEventListener("click", () => {
      selectedRound = round;
      roundButton.textContent = round + " ▼";
      filterVideos();
      roundList.classList.remove("show");
    });
    roundList.appendChild(li);
  });

  roundButton.addEventListener("click", () => {
    roundList.classList.toggle("show");
  });
}

// ============================
// 영상 종류 탭 초기화
// ============================
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".tab-btn.active").classList.remove("active");
      btn.classList.add("active");
      selectedType = btn.dataset.filter;
      filterVideos();
    });
  });
}

// ============================
// 영상 필터링 + 렌더링
// ============================
function filterVideos() {
  let filtered = videos.filter(v => v.season === selectedSeason);

  if (selectedRound !== "all") filtered = filtered.filter(v => v.round === selectedRound);
  if (selectedType !== "all") filtered = filtered.filter(v => v.type === selectedType);

  renderVideos(filtered);
}

// ============================
// 영상 렌더링
// ============================
function renderVideos(videoArray) {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";

  if (videoArray.length === 0) {
    grid.innerHTML = "<p style='color:#fff; text-align:center;'>선택된 조건의 영상이 없습니다.</p>";
    return;
  }

  videoArray.forEach(v => {
    const card = document.createElement("div");
    card.className = "video-card";

    card.innerHTML = `
      <iframe src="${v.videoUrl}" allowfullscreen></iframe>
      <div class="video-info">
        <span class="badge">${v.type === 'official' ? '공식' : v.type === 'coupang' ? '쿠팡' : '인플루언서'}</span>
        <h3>${v.title}</h3>
        <div class="team">${v.round}</div>
      </div>
    `;

    card.addEventListener("mouseenter", () => {
      card.style.transform = "scale(1.03)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "scale(1)";
    });

    grid.appendChild(card);
  });

  grid.scrollIntoView({ behavior: "smooth", block: "start" });
}