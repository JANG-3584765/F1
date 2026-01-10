/**
 * results-page.js (FULL)
 * - 2025_round_result.json / 2026_round_result.json
 * - 2025_schedule.json / 2026_schedule.json
 * 을 불러와서 시즌/라운드 드롭다운 + Top5 + 전체(접기/펼치기) 렌더까지 한 번에 처리.
 *
 * ✅ 전제
 * 1) schedule 파일 구조: Array
 *    [{season, round, flag, city, race_name, circuit, sessions:[{name,start,end}, ...]}, ...]
 * 2) round_result 파일 구조: Object
 *    { season: 2025, rounds: { "1":[{code,name,position,status},...], ... } }
 * 3) circuitImage 규칙: ./images/home/nextrace/${circuit}.png
 * 4) location은 안 씀
 *
 * ✅ 필요한 HTML id
 * - select#seasonSelect
 * - select#roundSelect
 * - div#raceHeader
 * - div#topResults
 * - button#toggleFullBtn
 * - div#fullResults
 * - div#pageError (선택)
 */

const DATA_PATHS = {
  2025: {
    schedule: "./data/2025_schedule.json",
    results: "./data/2025_round_result.json",
  },
  2026: {
    schedule: "./data/2026_schedule.json",
    results: "./data/2026_round_result.json",
  },
};

const RACE_SESSION_NAME = "레이스";
const CIRCUIT_IMAGE = (circuit) => `./images/home/nextrace/${circuit}.png`;

const state = {
  loaded: false,
  seasons: {}, // { [season]: { scheduleByRound: Map, resultsByRound: Map } }
  currentSeason: null,
  currentRound: null,
  fullOpen: false,
};

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  bootstrap().catch((e) => {
    console.error(e);
    renderError("데이터 로드 실패 (콘솔 확인)");
  });
});

/* =========================
 * UI
 * ========================= */
function initUI() {
  const seasonSelect = document.getElementById("seasonSelect");
  const roundSelect = document.getElementById("roundSelect");
  const toggleBtn = document.getElementById("toggleFullBtn");

  if (seasonSelect) {
    seasonSelect.addEventListener("change", () => {
      const season = Number(seasonSelect.value);
      if (!Number.isFinite(season)) return;
      setSeason(season);
    });
  }

  if (roundSelect) {
    roundSelect.addEventListener("change", () => {
      const round = Number(roundSelect.value);
      if (!Number.isFinite(round)) return;
      setRound(round);
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      state.fullOpen = !state.fullOpen;
      renderCurrent();
    });
  }
}

/* =========================
 * Bootstrap
 * ========================= */
async function bootstrap() {
  // 1) 로드할 시즌(파일이 있는 시즌만)
  const seasonsToLoad = Object.keys(DATA_PATHS).map(Number);

  // 2) 병렬 로드
  const loaded = await Promise.all(
    seasonsToLoad.map(async (season) => {
      const { schedule, results } = DATA_PATHS[season];
      const [scheduleArr, resultsObj] = await Promise.all([
        fetchJson(schedule),
        fetchJson(results),
      ]);

      return [
        season,
        {
          scheduleByRound: indexScheduleByRound(scheduleArr),
          resultsByRound: indexResultsByRound(resultsObj),
        },
      ];
    })
  );

  // 3) 상태 저장
  loaded.forEach(([season, data]) => {
    state.seasons[season] = data;
  });
  state.loaded = true;

  // 4) 시즌 드롭다운 채우기
  const availableSeasons = Object.keys(state.seasons)
    .map(Number)
    .sort((a, b) => a - b);

  if (availableSeasons.length === 0) {
    renderError("사용 가능한 시즌 데이터가 없습니다.");
    return;
  }

  populateSeasonSelect(availableSeasons);

  // 5) 기본 시즌 선택
  setSeason(availableSeasons[0]);
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch 실패: ${url} (${res.status})`);
  return res.json();
}

function indexScheduleByRound(scheduleArr) {
  const map = new Map();
  (scheduleArr || []).forEach((item) => {
    if (!item) return;
    const r = Number(item.round);
    if (!Number.isFinite(r)) return;
    map.set(r, item);
  });
  return map;
}

function indexResultsByRound(resultsObj) {
  const map = new Map();
  const rounds = resultsObj?.rounds || {};
  for (const [roundStr, arr] of Object.entries(rounds)) {
    const r = Number(roundStr);
    if (!Number.isFinite(r)) continue;
    map.set(r, Array.isArray(arr) ? arr : []);
  }
  return map;
}

/* =========================
 * Season / Round selection
 * ========================= */
function setSeason(season) {
  if (!state.seasons[season]) return;

  state.currentSeason = season;

  // 라운드 옵션: schedule + results 합집합
  const sRounds = [...state.seasons[season].scheduleByRound.keys()];
  const rRounds = [...state.seasons[season].resultsByRound.keys()];
  const rounds = uniqueSorted([...sRounds, ...rRounds]);

  populateRoundSelect(rounds);

  // 기본 라운드
  setRound(rounds[0] ?? 1);
}

function setRound(round) {
  state.currentRound = round;
  renderCurrent();
}

function populateSeasonSelect(seasons) {
  const el = document.getElementById("seasonSelect");
  if (!el) return;
  el.innerHTML = seasons
    .map((s) => `<option value="${s}">${s} 시즌</option>`)
    .join("");
  el.value = String(seasons[0]);
}

function populateRoundSelect(rounds) {
  const el = document.getElementById("roundSelect");
  if (!el) return;
  el.innerHTML = rounds.map((r) => `<option value="${r}">${r}R</option>`).join(
    ""
  );
  el.value = String(rounds[0] ?? 1);
}

/* =========================
 * Build view-model
 * ========================= */
function buildViewModel(season, round) {
  const seasonData = state.seasons[season];
  const scheduleItem = seasonData.scheduleByRound.get(round) || null;
  const results = seasonData.resultsByRound.get(round) || [];

  const raceSession = scheduleItem?.sessions?.find(
    (s) => s?.name === RACE_SESSION_NAME
  );

  return {
    season,
    round,
    race: scheduleItem
      ? {
          flag: scheduleItem.flag ?? "",
          raceName: scheduleItem.race_name ?? "",
          city: scheduleItem.city ?? "",
          dateTime: raceSession?.start ?? null,
          circuit: scheduleItem.circuit ?? "",
          circuitImage: scheduleItem.circuit
            ? CIRCUIT_IMAGE(scheduleItem.circuit)
            : null,
        }
      : {
          flag: "",
          raceName: "",
          city: "",
          dateTime: null,
          circuit: "",
          circuitImage: null,
        },
    // round_result.json 기반
    results: Array.isArray(results) ? results : [],

    // 아직 없는 상세 데이터(시간/포인트 등)는 빈 상태
    fullResults: [],

    // meta도 나중에 채움
    meta: {
      lapsTotal: null,
      circuitLengthKm: null,
      weather: null,
      temperatureC: null,
    },
  };
}

/* =========================
 * Render
 * ========================= */
function renderCurrent() {
  if (!state.loaded) return;
  const season = state.currentSeason;
  const round = state.currentRound;
  if (!season || !round) return;

  const vm = buildViewModel(season, round);

  renderRaceHeader(vm);
  renderTopResults(vm);
  renderFullResults(vm);
  renderToggle(vm);
  clearError();
}

function renderRaceHeader(vm) {
  const el = document.getElementById("raceHeader");
  if (!el) return;

  const dateText = vm.race.dateTime ? formatDateTime(vm.race.dateTime) : "-";

  const metaParts = [];
  if (vm.meta.lapsTotal != null) metaParts.push(`랩 ${vm.meta.lapsTotal}`);
  if (vm.meta.circuitLengthKm != null)
    metaParts.push(`서킷 길이 ${vm.meta.circuitLengthKm}km`);
  if (vm.meta.weather) metaParts.push(vm.meta.weather);
  if (vm.meta.temperatureC != null) metaParts.push(`${vm.meta.temperatureC}°C`);

  const metaLine = metaParts.length ? metaParts.join(" | ") : "";

  el.innerHTML = `
    <div class="race-title-row">
      <span class="race-flag">${escapeHtml(vm.race.flag)}</span>
      <span class="race-name">${escapeHtml(vm.race.raceName || `${vm.round}R`)}</span>
      <span class="race-city">${vm.race.city ? `(${escapeHtml(vm.race.city)})` : ""}</span>
    </div>
    <div class="race-date-row">${escapeHtml(dateText)}</div>
    ${metaLine ? `<div class="race-meta-row">${escapeHtml(metaLine)}</div>` : ""}
    ${
      vm.race.circuitImage
        ? `<div class="race-circuit-wrap">
             <img class="race-circuit-img" src="${vm.race.circuitImage}" alt="${escapeHtml(
            vm.race.circuit
          )}">
           </div>`
        : ""
    }
  `;
}

function renderTopResults(vm) {
  const el = document.getElementById("topResults");
  if (!el) return;

  const top5 = (vm.results || [])
    .filter((r) => typeof r.position === "number")
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);

  if (top5.length === 0) {
    el.innerHTML = `<div class="empty">Top 5 결과가 없습니다.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="results-list top">
      ${top5.map(renderResultRow).join("")}
    </div>
  `;
}

function renderFullResults(vm) {
  const el = document.getElementById("fullResults");
  if (!el) return;

  if (!state.fullOpen) {
    el.innerHTML = "";
    el.style.display = "none";
    return;
  }

  el.style.display = "";

  // 지금은 round_result만으로 전체(=20명 내외)를 보여줌
  const rows = (vm.results || []).slice();

  if (rows.length === 0) {
    el.innerHTML = `<div class="empty">전체 결과가 없습니다.</div>`;
    return;
  }

  // position 있는 애들 먼저, 그 다음 DNF/DNS/DSQ
  rows.sort((a, b) => {
    const ap = typeof a.position === "number" ? a.position : 9999;
    const bp = typeof b.position === "number" ? b.position : 9999;
    if (ap !== bp) return ap - bp;

    const order = { Finished: 0, DSQ: 1, DNF: 2, DNS: 3 };
    const as = order[a.status] ?? 9;
    const bs = order[b.status] ?? 9;
    if (as !== bs) return as - bs;

    return String(a.code).localeCompare(String(b.code));
  });

  el.innerHTML = `
    <div class="results-list full">
      ${rows.map(renderResultRow).join("")}
    </div>
  `;
}

function renderToggle(vm) {
  const btn = document.getElementById("toggleFullBtn");
  if (!btn) return;

  // 결과가 없으면 버튼 숨김
  const hasAny = (vm.results || []).length > 0;
  btn.style.display = hasAny ? "" : "none";
  btn.textContent = state.fullOpen ? "전체 결과 접기" : "전체 결과 펼치기";
}

function renderResultRow(r) {
  const pos =
    typeof r.position === "number" ? String(r.position).padStart(2, " ") : "—";
  const status = r.status || "";
  return `
    <div class="result-row">
      <div class="result-pos">${escapeHtml(pos)}</div>
      <div class="result-name">${escapeHtml(r.name || "")}</div>
      <div class="result-code">${escapeHtml(r.code || "")}</div>
      <div class="result-status">${escapeHtml(status)}</div>
    </div>
  `;
}

/* =========================
 * Utils
 * ========================= */
function uniqueSorted(arr) {
  return [...new Set(arr.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
}

function formatDateTime(iso) {
  // "2025-03-16T13:00:00+09:00" -> "2025.03.16 13:00"
  // (원하면 더 이쁘게 커스터마이즈 가능)
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
 * Error
 * ========================= */
function renderError(msg) {
  const el = document.getElementById("pageError");
  if (el) {
    el.textContent = msg;
    el.style.display = "";
  } else {
    // fallback
    console.warn(msg);
  }
}
function clearError() {
  const el = document.getElementById("pageError");
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}
