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
  document.querySelectorAll(".tabs .tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

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
  } catch (err) {
    console.error("ranking.js:", err);
    renderDriversTable([], true);
    renderConstructorsTable([], true);
  }
}

/** =========================
 *  팀 키 변환 (CSS 매핑용)
 *  ========================= */
function teamKey(teamName) {
  const t = String(teamName || "").replace(/\s+/g, "").toLowerCase();

  // JSON에 들어오는 한글 팀명 기준 매핑
  if (t.includes("맥라렌")) return "mclaren";
  if (t.includes("메르세데스")) return "mercedes";
  if (t.includes("레드불")) return "redbull";
  if (t.includes("페라리")) return "ferrari";
  if (t.includes("윌리엄스")) return "williams";
  if (t.includes("레이싱불스") || t.includes("레이싱")) return "rb";
  if (t.includes("애스턴마틴")) return "astonmartin";
  if (t.includes("하스")) return "haas";
  if (t.includes("자우버") || t.includes("자우버")) return "sauber";
  if (t.includes("알핀")) return "alpine";
  if (t.includes("아우디")) return "audi";
  if (t.includes("캐딜락")) return "cadillac";

  return "unknown";
}

/** =========================
 *  테이블 렌더
 *  ========================= */
function renderDriversTable(drivers, isError = false) {
  const tbody = document.getElementById("drivers-table-body");
  if (!tbody) return;

  // 드라이버: 6컬럼(순위/팀/드라이버/포인트/우승/포디움)
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
      const team = safeText(d.team);
      const name = safeText(d.name);
      const points = safeText(d.points);
      const wins = safeText(d.wins);
      const podiums = safeText(d.podiums);

      const tKey = teamKey(d.team);

      return `
        <tr>
          <td>${pos}</td>
          <td class="team-cell" data-team="${tKey}">${team}</td>
          <td class="name-cell">${name}</td>
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

  // 컨스트럭터: 5컬럼
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

      const tKey = teamKey(t.team);

      return `
        <tr>
          <td>${pos}</td>
          <td class="team-cell" data-team="${tKey}">${team}</td>
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
