// ranking.js

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

  // 컨텐츠 active
  document.querySelectorAll(".tab-contents .tab-content").forEach((section) => {
    section.classList.toggle("active", section.id === tabId);

    // CSS가 active로 제어한다면 display 조작은 없어도 되지만,
    // 혹시 CSS가 아직 미완이면 확실히 숨김 처리까지 같이 해줌
    section.style.display = section.id === tabId ? "block" : "none";
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
      const tabId = btn.dataset.tab; // "driversTab" / "constructorsTab"
      if (!tabId) return;
      setActiveTab(tabId);
    });
  });

  // 초기 탭 상태 보정(HTML에 active가 있어도 JS에서 확정)
  const initialActive = document.querySelector(".tabs .tab-button.active")?.dataset.tab || "driversTab";
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

    // 이모지(국기) 트위모지 변환 (있는 경우만)
    if (window.twemoji) {
      // 페이지 전체를 매번 파싱해도 되지만, 범위 줄이고 싶으면 main만 파싱
      window.twemoji.parse(document.body);
    }
  } catch (err) {
    console.error("ranking.js:", err);
    renderDriversTable([], true);
    renderConstructorsTable([], true);
  }
}

/** =========================
 *  테이블 렌더 함수들
 *  ========================= */
function renderDriversTable(drivers, isError = false) {
  const tbody = document.getElementById("drivers-table-body");
  if (!tbody) return;

  if (isError) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:16px;">
          데이터를 불러오지 못했습니다.
        </td>
      </tr>
    `;
    return;
  }

  if (!drivers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:16px;">
          표시할 데이터가 없습니다.
        </td>
      </tr>
    `;
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
          <td class="name-cell">${name}</td>
          <td>${team}</td>
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

  if (isError) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:16px;">
          데이터를 불러오지 못했습니다.
        </td>
      </tr>
    `;
    return;
  }

  if (!teams.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:16px;">
          표시할 데이터가 없습니다.
        </td>
      </tr>
    `;
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
