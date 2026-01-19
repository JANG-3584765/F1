// result.js (type="module")
// 1) 시즌/라운드 드롭다운 연동
// 2) 선택 시 레이스 메타(국기, 레이스명(도시), 서킷 이미지/정보) 렌더
// 3) 결과 JSON(시즌 통합: {rounds:{...}})에서 Top5 + 전체 토글 렌더
//    - Top5: 1~5위
//    - 전체: 6위부터 + DNF/DNS/DSQ 포함 (중복 제거)
// 4) DOTD / Fastest Lap 표시
// 5) 초기 진입 시: 2025 시즌 24라운드가 가장 먼저 보이게

/* DOM */
const $season = document.querySelector("#season-select");
const $round = document.querySelector("#round-select");

const $details = document.querySelector("#race-details");
const $error = document.querySelector("#page-error");

const $flag = document.querySelector("#race-flag");
const $name = document.querySelector("#race-name");
const $city = document.querySelector("#race-city");
const $date = document.querySelector("#race-date");

const $circuitName = document.querySelector("#race-circuit-name");
const $extra = document.querySelector("#race-extra");
const $track = document.querySelector("#race-track");

const $topTbody = document.querySelector("#top-results-tbody");
const $fullWrap = document.querySelector("#full-results");
const $fullTbody = document.querySelector("#full-results-tbody");
const $toggleBtn = document.querySelector("#toggle-full-btn");

/* Config */
const DEFAULT_SEASON = 2025;
const DEFAULT_ROUND = 24;

const scheduleUrlBySeason = (season) => `../data/${season}_schedule.json`;
const RESULT_INDEX_URL = (season) => `./${season}_round_result.json`;

/* State */
let scheduleCache = new Map(); // season -> array of meta objects
let resultIndexCache = new Map(); // season -> parsed result index json

let currentSeason = null;
let currentRound = null;

/* Utils */
function showError(message) {
  if (!$error) return;
  $error.textContent = message;
  $error.hidden = false;
}

function hideError() {
  if (!$error) return;
  $error.textContent = "";
  $error.hidden = true;
}

function setLoadingUI(isLoading) {
  $season.disabled = isLoading;
  $round.disabled = isLoading || !$season.value;
}

function formatKSTDate(isoString) {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}. ${m}. ${day}. (${weekday}) ${hh}:${mm}`;
}

function pickRaceStart(meta) {
  const sessions = Array.isArray(meta.sessions) ? meta.sessions : [];
  const race = sessions.find((s) => s?.name === "레이스");
  return race?.start ?? sessions?.[0]?.start ?? null;
}

function normalizeSchedule(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.rounds)) return data.rounds;
  if (data && typeof data === "object") return [data];
  return [];
}

function resetResultTables() {
  if ($topTbody) $topTbody.innerHTML = "";
  if ($fullTbody) $fullTbody.innerHTML = "";

  // DOTD/FASTEST UI 제거
  const $badge = document.querySelector("#race-badges");
  if ($badge) $badge.remove();

  if ($fullWrap) $fullWrap.hidden = true;

  if ($toggleBtn) {
    $toggleBtn.disabled = true;
    $toggleBtn.setAttribute("aria-expanded", "false");
    $toggleBtn.textContent = "전체 결과 펼치기";
  }
}

function setDetailsHidden(hidden) {
  if (!$details) return;
  $details.hidden = hidden;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* Data Fetch */
async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (HTTP ${res.status})`);
  return res.json();
}

async function loadSchedule(season) {
  if (scheduleCache.has(season)) return scheduleCache.get(season);

  const url = scheduleUrlBySeason(season);
  const raw = await fetchJson(url);
  const list = normalizeSchedule(raw);

  list.sort((a, b) => (a?.round ?? 0) - (b?.round ?? 0));

  scheduleCache.set(season, list);
  return list;
}

async function loadResultIndex(season) {
  if (resultIndexCache.has(season)) return resultIndexCache.get(season);

  const url = RESULT_INDEX_URL(season);
  const data = await fetchJson(url);

  resultIndexCache.set(season, data);
  return data;
}

/* Render: Race Meta */
function renderRaceMeta(meta) {
  $flag.textContent = meta.flag ?? "";
  $name.textContent = meta.race_name ?? "";
  $city.textContent = meta.city ? `(${meta.city})` : "";

  const start = pickRaceStart(meta);
  $date.textContent = start ? formatKSTDate(start) : "";

  if ($circuitName) $circuitName.textContent = meta.circuit ?? "";

  const parts = [];
  if (meta.laps != null) parts.push(`랩 수 ${meta.laps}`);
  if (meta.circuit_length_km != null) parts.push(`서킷 길이 ${meta.circuit_length_km}km`);

  const cond = meta.weather?.condition;
  const temp = meta.weather?.temperature_c;

  if (cond != null || temp != null) {
    const tempStr = temp != null ? `${temp}°C` : "";
    const condStr = cond != null ? `${cond}` : "";
    let weatherStr = "";
    if (tempStr && condStr) weatherStr = `${tempStr} (${condStr})`;
    else weatherStr = tempStr || condStr;
    parts.push(weatherStr);
  }

  $extra.textContent = parts.join(" | ");

  if (meta.circuit_image) {
    $track.src = meta.circuit_image;
    $track.alt = meta.circuit ? `${meta.circuit} 서킷 이미지` : "서킷 이미지";
    $track.hidden = false;
  } else {
    $track.removeAttribute("src");
    $track.alt = "서킷 이미지";
    $track.hidden = true;
  }

  if (window.twemoji) window.twemoji.parse($flag);

  hideError();
  setDetailsHidden(false);
}

/* Render: DOTD / Fastest Lap */
function injectBadges({ dotd, fastest }, driverNameByCode) {
  const $topSection = document.querySelector("#top-results");
  if (!$topSection) return;

  const dotdName = dotd ? (driverNameByCode.get(dotd) ?? dotd) : null;
  const fastName = fastest ? (driverNameByCode.get(fastest) ?? fastest) : null;

  if (!dotdName && !fastName) return;

  const wrap = document.createElement("div");
  wrap.id = "race-badges";
  wrap.className = "race-badges";

  const items = [];
  if (dotdName) items.push(`<span class="badge badge-dotd">🏆 DOTD: <strong>${escapeHtml(dotdName)}</strong></span>`);
  if (fastName) items.push(`<span class="badge badge-fast">⚡ Fastest Lap: <strong>${escapeHtml(fastName)}</strong></span>`);

  wrap.innerHTML = `
    <div class="badge-row">
      ${items.join("\n")}
    </div>
  `;

  $topSection.parentNode.insertBefore(wrap, $topSection);
}

/* Render: Results */
function getRoundResultBlock(resultIndex, round) {
  const rounds = resultIndex?.rounds;
  if (!rounds || typeof rounds !== "object") return null;
  return rounds[String(round)] ?? null;
}

function normalizeResultRowsFromBlock(block) {
  const arr = Array.isArray(block?.results) ? block.results : [];

  const finished = [];
  const others = [];

  for (const r of arr) {
    if (typeof r?.position === "number") finished.push(r);
    else others.push(r);
  }

  finished.sort((a, b) => a.position - b.position);
  const merged = [...finished, ...others];

  return merged.map((r) => ({
    code: r.code ?? "",
    name: r.name ?? "-",
    team: r.team ?? "",
    position: r.position, // number | null
    status: r.status ?? "-",
    time: r.time,
    gap: r.gap,
    laps: r.laps,
    points: r.points,
  }));
}

/**
 * "상태" 대신 "기록" 개념으로 표시할 텍스트를 만든다.
 * - FINISHED: time 있으면 time, 없으면 gap, 없으면 "완주"
 * - DNF/DNS/DSQ: status 그대로
 */
function formatRecordCell(row) {
  if (row.status === "FINISHED") {
    return row.time ?? row.gap ?? "완주";
  }
  return row.status;
}

function formatDriverCell(row) {
  // 보기 좋게: 이름 (팀) 형태
  if (row.team) return `${row.name} (${row.team})`;
  return row.name;
}

function valueOrDash(v) {
  return v == null || v === "" ? "-" : String(v);
}

function rowToTr(row) {
  const tr = document.createElement("tr");

  const tdPos = document.createElement("td");
  tdPos.textContent = row.position != null ? row.position : "-";

  const tdDriver = document.createElement("td");
  tdDriver.textContent = formatDriverCell(row);

  const tdRecord = document.createElement("td");
  tdRecord.textContent = formatRecordCell(row);

  const tdLaps = document.createElement("td");
  tdLaps.textContent = valueOrDash(row.laps);

  const tdPts = document.createElement("td");
  tdPts.textContent = valueOrDash(row.points);

  tr.append(tdPos, tdDriver, tdRecord, tdLaps, tdPts);
  return tr;
}

function setTableHeadersToRecordLapsPoints() {
  // HTML을 안 건드렸을 때를 대비해, thead 텍스트를 JS에서 맞춰준다.
  // (현재 HTML은 3열이라면 이 부분은 5열로 바꾼 상태에서만 제대로 보임)
  // 사용자가 HTML을 아직 3열 그대로면, 아래 경고처럼 UI가 깨질 수 있다.
  const topThs = document.querySelectorAll("#top-results .results-table thead th");
  const fullThs = document.querySelectorAll("#full-results .results-table thead th");

  const labels = ["순위", "드라이버", "기록", "랩", "포인트"];
  if (topThs.length === 5) topThs.forEach((th, i) => (th.textContent = labels[i]));
  if (fullThs.length === 5) fullThs.forEach((th, i) => (th.textContent = labels[i]));
}

function renderResultsFromBlock(block) {
  resetResultTables();

  const rows = normalizeResultRowsFromBlock(block);
  if (!rows.length) return;

  const map = new Map();
  for (const r of rows) if (r.code) map.set(r.code, r.name);

  injectBadges(
    { dotd: block.dotd, fastest: block.fastest_lap_driver },
    map
  );

  // ✅ 테이블 헤더(HTML을 5열로 바꿨다면 자동으로 "기록/랩/포인트"로 맞춤)
  setTableHeadersToRecordLapsPoints();

  // Top5: 완주자 중 1~5
  const top5 = rows.filter((r) => typeof r.position === "number").slice(0, 5);
  for (const r of top5) $topTbody.appendChild(rowToTr(r));

  // Full: ✅ 6위부터 + (position null인 DNF/DNS/DSQ는 전부 포함)
  const rest = rows.filter((r) => (typeof r.position === "number" ? r.position >= 6 : true));
  for (const r of rest) $fullTbody.appendChild(rowToTr(r));

  $toggleBtn.disabled = false;
}

/* Populate: Round Select */
function populateRounds(scheduleList) {
  $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;

  for (const item of scheduleList) {
    const round = item?.round;
    if (round == null) continue;

    const opt = document.createElement("option");
    opt.value = String(round);

    const city = item?.city ? ` - ${item.city}` : "";
    opt.textContent = `${round}R${city}`;
    $round.appendChild(opt);
  }

  $round.disabled = false;
}

/* Main Flow */
async function onSeasonChange(season, { preferRound = null } = {}) {
  try {
    hideError();
    setLoadingUI(true);
    setDetailsHidden(true);
    resetResultTables();

    currentSeason = season;
    currentRound = null;

    $round.disabled = true;
    $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;

    const scheduleList = await loadSchedule(season);
    if (!scheduleList.length) {
      showError("해당 시즌의 스케줄 데이터를 찾지 못했습니다.");
      return;
    }

    populateRounds(scheduleList);

    if (preferRound != null) {
      const exists = scheduleList.some((x) => String(x?.round) === String(preferRound));
      const chosen = exists ? preferRound : scheduleList[scheduleList.length - 1]?.round;

      if (chosen != null) {
        $round.value = String(chosen);
        await onRoundChange(season, chosen);
      }
    }
  } catch (e) {
    console.error(e);
    showError("시즌 데이터를 불러오지 못했습니다.");
  } finally {
    setLoadingUI(false);
  }
}

async function onRoundChange(season, round) {
  try {
    hideError();
    setLoadingUI(true);
    setDetailsHidden(true);
    resetResultTables();

    currentSeason = season;
    currentRound = round;

    // 1) 레이스 메타 렌더
    const scheduleList = await loadSchedule(season);
    const meta = scheduleList.find((x) => String(x?.round) === String(round));
    if (!meta) {
      showError("선택한 라운드의 레이스 정보를 찾지 못했습니다.");
      return;
    }
    renderRaceMeta(meta);

    // 2) 결과 렌더
    try {
      const idx = await loadResultIndex(season);
      const block = getRoundResultBlock(idx, round);

      if (!block || !Array.isArray(block.results) || block.results.length === 0) {
        return; // 결과 없음
      }
      renderResultsFromBlock(block);
    } catch (e) {
      // 결과 파일이 없는 시즌(예: 2026)은 조용히 처리
    }
  } catch (e) {
    console.error(e);
    showError("라운드 데이터를 불러오지 못했습니다.");
  } finally {
    setLoadingUI(false);
  }
}

/* Toggle Full Results */
function initToggle() {
  if (!$toggleBtn) return;

  $toggleBtn.addEventListener("click", () => {
    if ($toggleBtn.disabled) return;

    const isOpen = !$fullWrap.hidden;
    const nextOpen = !isOpen;

    $fullWrap.hidden = !nextOpen;
    $toggleBtn.setAttribute("aria-expanded", String(nextOpen));
    $toggleBtn.textContent = nextOpen ? "전체 결과 접기" : "전체 결과 펼치기";
  });
}

/* Events */
function initEvents() {
  $season.addEventListener("change", async () => {
    const season = Number($season.value);
    if (!season) {
      $round.disabled = true;
      $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;
      setDetailsHidden(true);
      resetResultTables();
      hideError();
      return;
    }
    await onSeasonChange(season);
  });

  $round.addEventListener("change", async () => {
    const season = Number($season.value);
    const round = Number($round.value);

    if (!season || !round) {
      setDetailsHidden(true);
      resetResultTables();
      hideError();
      return;
    }
    await onRoundChange(season, round);
  });
}

/* Init */
(async function init() {
  initToggle();
  initEvents();

  // 초기값: 2025 시즌 24라운드를 먼저 보여주기
  $season.value = String(DEFAULT_SEASON);
  await onSeasonChange(DEFAULT_SEASON, { preferRound: DEFAULT_ROUND });
})();