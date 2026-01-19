// result.js (type="module")
// 목표:
// 1) 시즌/라운드 드롭다운 연동
// 2) 선택 시 레이스 메타(국기, 레이스명(도시), 서킷 이미지/정보) 렌더
// 3) 결과 JSON(시즌 통합: {rounds:{...}})에서 Top5 + 전체 토글 렌더
// 4) DOTD / Fastest Lap 표시
// 5) 초기 진입 시: 2025 시즌 24라운드가 가장 먼저 보이게

/* =========================
   DOM
========================= */
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

/* =========================
   Config
========================= */
const DEFAULT_SEASON = 2025;
const DEFAULT_ROUND = 24;

const scheduleUrlBySeason = (season) => `../data/${season}_schedule.json`;

// ✅ 네 결과 JSON 파일(시즌 통합) 경로
// - 예: /result/result.html 페이지에서
//   /result/2025_round_result.json을 읽으려면 "./2025_round_result.json"
//   /result 폴더가 루트 바로 아래가 아니라면 "../result/..."가 맞을 수 있음.
// 현재는 네가 말한 "result/2025_round_result.json"을 '폴더'로 보고 안전하게 ../result 사용.
const RESULT_INDEX_URL = (season) => `../result/${season}_round_result.json`;

/* =========================
   State
========================= */
let scheduleCache = new Map(); // season -> array of meta objects
let resultIndexCache = new Map(); // season -> parsed result index json

let currentSeason = null;
let currentRound = null;

/* =========================
   Utils
========================= */
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

/* =========================
   Data Fetch
========================= */
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

  // 기대 구조:
  // { season: 2025, rounds: { "1": { dotd, fastest_lap_driver, results: [...] }, ... } }
  resultIndexCache.set(season, data);
  return data;
}

/* =========================
   Render: Race Meta
========================= */
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

  // Twemoji(국기)
  if (window.twemoji) window.twemoji.parse($flag);

  hideError();
  setDetailsHidden(false);
}

/* =========================
   Render: DOTD / Fastest Lap (보기 좋게)
========================= */
function injectBadges({ dotd, fastest }, driverNameByCode) {
  // 표 위에 배지 한 줄 삽입
  // 위치: top-results 섹션 바로 위에 넣으면 자연스럽다.
  const $topSection = document.querySelector("#top-results");
  if (!$topSection) return;

  const dotdName = dotd ? (driverNameByCode.get(dotd) ?? dotd) : null;
  const fastName = fastest ? (driverNameByCode.get(fastest) ?? fastest) : null;

  // 둘 다 없으면 삽입 안 함
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

  // top-results 앞에 삽입
  $topSection.parentNode.insertBefore(wrap, $topSection);
}

/* =========================
   Render: Results (네 JSON 구조 대응)
========================= */
function getRoundResultBlock(resultIndex, round) {
  const rounds = resultIndex?.rounds;
  if (!rounds || typeof rounds !== "object") return null;

  // round 키가 "1" 같은 문자열
  return rounds[String(round)] ?? null;
}

function normalizeResultRowsFromBlock(block) {
  const arr = Array.isArray(block?.results) ? block.results : [];

  // position이 null(DNF/DNS/DSQ)일 수 있으니 정렬은:
  // - position이 숫자인 애들 먼저 오름차순
  // - 그 다음 position null인 애들(status 기준, 그 후 입력 순)
  const finished = [];
  const others = [];

  for (const r of arr) {
    if (typeof r?.position === "number") finished.push(r);
    else others.push(r);
  }

  finished.sort((a, b) => a.position - b.position);

  // others는 원래 순서 유지(필요하면 status 우선순위 정렬 추가 가능)
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

function formatStatusCell(row) {
  // Top/Full 테이블의 "상태"에 표시할 텍스트:
  // - FINISHED면 time이 있으면 time, 없으면 gap, 그것도 없으면 "FINISHED"
  // - 그 외(DNF/DNS/DSQ)는 status 그대로 (+ 추가정보 있으면)
  if (row.status === "FINISHED") {
    return row.time ?? row.gap ?? "FINISHED";
  }
  // 예: DSQ도 time/gap이 있을 수 있는데, 보통은 status가 우선
  return row.status;
}

function rowToTrSimple(row) {
  const tr = document.createElement("tr");

  const tdPos = document.createElement("td");
  tdPos.textContent = row.position != null ? row.position : "-";

  const tdDriver = document.createElement("td");
  // 보기 좋게: "이름 · 팀" 형태로 붙임(원하면 CSS로 스타일)
  tdDriver.textContent = row.team ? `${row.name} · ${row.team}` : row.name;

  const tdStatus = document.createElement("td");
  tdStatus.textContent = formatStatusCell(row);

  tr.append(tdPos, tdDriver, tdStatus);
  return tr;
}

function renderResultsFromBlock(block) {
  resetResultTables();

  const rows = normalizeResultRowsFromBlock(block);
  if (!rows.length) {
    // 결과 없음
    return;
  }

  // code -> name 매핑(배지 표시용)
  const map = new Map();
  for (const r of rows) if (r.code) map.set(r.code, r.name);

  // DOTD / Fastest Lap 배지 삽입
  injectBadges(
    { dotd: block.dotd, fastest: block.fastest_lap_driver },
    map
  );

  // Top5: position 숫자 있는 애들 중 1~5
  const top5 = rows.filter(r => typeof r.position === "number").slice(0, 5);
  for (const r of top5) $topTbody.appendChild(rowToTrSimple(r));

  // Full: 전체 rows
  for (const r of rows) $fullTbody.appendChild(rowToTrSimple(r));

  // 토글 활성화
  $toggleBtn.disabled = false;
}

/* =========================
   Populate: Round Select
========================= */
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

/* =========================
   Main Flow
========================= */
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

    // 2) 결과 렌더(시즌 통합 파일에서 해당 라운드 꺼냄)
    try {
      const idx = await loadResultIndex(season);
      const block = getRoundResultBlock(idx, round);

      if (!block || !Array.isArray(block.results) || block.results.length === 0) {
        // 결과 없음: 토글 비활성 유지
        return;
      }
      renderResultsFromBlock(block);
    } catch (e) {
      // 결과 파일이 아직 없을 수 있음: 에러로 띄우지 않고 조용히
      // 원하면 아래 주석 해제
      // console.warn(e);
    }
  } catch (e) {
    console.error(e);
    showError("라운드 데이터를 불러오지 못했습니다.");
  } finally {
    setLoadingUI(false);
  }
}

/* =========================
   Toggle Full Results
========================= */
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

/* =========================
   Events
========================= */
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

/* =========================
   Init
========================= */
(async function init() {
  initToggle();
  initEvents();

  // 초기값: 2025 시즌 24라운드를 먼저 보여주기
  $season.value = String(DEFAULT_SEASON);
  await onSeasonChange(DEFAULT_SEASON, { preferRound: DEFAULT_ROUND });
})();