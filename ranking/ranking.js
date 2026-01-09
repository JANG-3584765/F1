document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSeasonSelector();
  loadSeasonAndRender(getSelectedSeason());
});

/** =========================
 *  상태/유틸
 *  ========================= */
function getSelectedSeason() {
  const seasonSelect = document.getElementById("season");
  return seasonSelect ? seasonSelect.value : "2025";
}

function getJsonPathBySeason(season) {
  return `./season/${season}.json`;
}

function setActiveTab(tabId) {
  // 버튼 active
  document.querySelectorAll(".tabs .tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // 컨텐츠 active + 표시 제어
  document.querySelectorAll(".tab-contents .tab-content").forEach((section) => {
    const isActive = section.id === tabId;
    section.classList.toggle("active", isActive);
    section.style.display = isActive ? "block" : "none";
  });
}

/** =========================
 *  탭 전환
 *  ========================= */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tabs .tab-button");
  if (!tabButtons.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      if (!tabId) return;
      setActiveTab(tabId);
    });
  });

  // 초기 탭 확정
  const initialActive =
    document.querySelector(".tabs .tab-button.active")?.dataset.tab || "driversTab";
  setActiveTab(initialActive);
}

/** =========================
 *  시즌 변경
 *  ========================= */
function initSeasonSelector() {
  const seasonSelect = document.getElementById("season");
  if (!seasonSelect) return;

  seasonSelect.addEventListener("change", () => {
    loadSeasonAndRender(seasonSelect.value);
  });
}

/** =========================
 *  데이터 로드 + 렌더
 *  ========================= */
async function loadSeasonAndRender(season) {
  const jsonPath = getJsonPathBySeason(season);

  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`JSON 로드 실패: ${res.status} ${res.statusText}`);

    const data = await res.json();

    renderDriversTable(data?.drivers || []);
    renderConstructorsTable(data?.teams || []);

    // Twemoji 적용
    if (window.twemoji) {
      window.twemoji.parse(document.body);
    }
  } catch (err) {
    console.error("ranking.js:", err);
    renderDriversTable([], true);
    renderConstructorsTable([], true);
  }
}

/** =========================
 *  테이블 렌더
 *  ========================= */
function renderDriversTable(drivers, isError = false) {
  const tbody = document.getElementById("drivers-table-body");
  if (!tbody) return;

  // 드라이버 테이블은 이제 6컬럼
  const colCount = 6;

  if (isError) {
    tbody.innerHTML = emptyRow(colCount, "데이터를 불러오지 못했습니다.");
    return;
  }

  if (!drivers.length) {
    tbody.innerHTML = emptyRow(colCount, "표시할 데이터가 없습니다.");
    return;
  }

  tbody.innerHTML = drivers
    .map((d) => {
      const pos = safeText(d.pos);
      const flag = safeText(d.flag);
      const name = safeText(d.name);
      const team = safeText(d.team);
      const points = safeText(d.points);
      const wins = safeText(d.wins);
      const podiums = safeText(d.podiums);

      return `
        <tr>
          <td>${pos}</td>
          <td class="flag-cell">${flag}</td>
          <td class="name-cell">
            <div class="driver-name">${name}</div>
            <div class="driver-team">${team}</div>
          </td>
          <td>${points}</td>
          <td>${wins}</td>
          <td>${podiums}</td>
        </tr>
      `;
    })
    .join("");
}

function renderConstructorsTable(teams, isError = false) {
  const tbody = document.getElementById("constructors-table-body");
  if (!tbody) return;

  // 컨스트럭터 테이블은 5컬럼
  const colCount = 5;

  if (isError) {
    tbody.innerHTML = emptyRow(colCount, "데이터를 불러오지 못했습니다.");
    return;
  }

  if (!teams.length) {
    tbody.innerHTML = emptyRow(colCount, "표시할 데이터가 없습니다.");
    return;
  }

  tbody.innerHTML = teams
    .map((t) => {
      const pos = safeText(t.pos);
      const team = safeText(t.team);
      const points = safeText(t.points);
      const wins = safeText(t.wins);
      const podiums = safeText(t.podiums);

      return `
        <tr>
          <td>${pos}</td>
          <td class="team-cell">${team}</td>
          <td>${points}</td>
          <td>${wins}</td>
          <td>${podiums}</td>
        </tr>
      `;
    })
    .join("");
}

/** =========================
 *  공용: 빈 행 템플릿
 *  ========================= */
function emptyRow(colspan, message) {
  const msg = safeText(message);
  return `
    <tr>
      <td colspan="${colspan}" style="text-align:center; padding:16px;">
        ${msg}
      </td>
    </tr>
  `;
}

/** =========================
 *  XSS/안전 문자열 처리
 *  ========================= */
function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}