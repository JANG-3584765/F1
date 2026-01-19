// result.js (type="module")
// 목표:
// 1) 시즌/라운드 드롭다운 연동
// 2) 선택 시 레이스 메타(국기, 레이스명(도시), 서킷 이미지/정보) 렌더
// 3) (옵션) 결과 JSON이 있으면 Top5/전체 결과 렌더 + 토글
// 4) 초기 진입 시: 2025 시즌 24라운드가 가장 먼저 보이게

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

/**
 * 결과 JSON 경로는 프로젝트마다 다를 수 있어서
 * 여러 후보를 순차적으로 시도하도록 해둠.
 * 너의 실제 경로가 확정되어 있으면 후보를 1개로 줄여도 됨.
 */
function resultUrlCandidates(season, round) {
  const r2 = String(round).padStart(2, "0");
  return [
    `../data/${season}_results_round_${round}.json`,
    `../data/${season}_results_round_${r2}.json`,
    `../data/${season}_round_${round}_results.json`,
    `../data/${season}_round_${r2}_results.json`,
    `../data/results/${season}/${round}.json`,
    `../data/results/${season}/${r2}.json`,
    `../data/results/${season}/round_${round}.json`,
    `../data/results/${season}/round_${r2}.json`,
  ];
}

/* =========================
   State
========================= */
let scheduleCache = new Map(); // season -> array of meta objects
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
  // 필요하면 로딩 UI를 추가해도 됨. 지금은 최소 처리로 select disabled만 사용.
  $season.disabled = isLoading;
  // 시즌이 선택되어 있어야 라운드 선택 의미가 있으므로, 로딩 중에는 라운드도 잠깐 잠금
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

/**
 * schedule JSON이 어떤 형태든 "라운드 메타 배열"로 정규화
 * - 배열: 그대로
 * - { rounds: [...] }: rounds 사용
 * - 단일 객체: [obj]
 */
function normalizeSchedule(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.rounds)) return data.rounds;
  if (data && typeof data === "object") return [data];
  return [];
}

function resetResultTables() {
  if ($topTbody) $topTbody.innerHTML = "";
  if ($fullTbody) $fullTbody.innerHTML = "";

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

  // 기본 정렬 안전장치
  list.sort((a, b) => (a?.round ?? 0) - (b?.round ?? 0));

  scheduleCache.set(season, list);
  return list;
}

async function tryFetchFirstJson(urls) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const data = await fetchJson(url);
      return { data, url };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No result url candidates worked");
}

/* =========================
   Render: Race Meta
========================= */
function renderRaceMeta(meta) {
  // 상단 타이틀: 국기 + race_name (city)
  $flag.textContent = meta.flag ?? "";
  $name.textContent = meta.race_name ?? "";
  $city.textContent = meta.city ? `(${meta.city})` : "";

  // 날짜: 레이스 start 우선
  const start = pickRaceStart(meta);
  $date.textContent = start ? formatKSTDate(start) : "";

  // 2열 오른쪽: 서킷 이름 + 스펙
  if ($circuitName) $circuitName.textContent = meta.circuit ?? "";

  const parts = [];

  if (meta.laps != null) parts.push(`랩 수 ${meta.laps}`);
  if (meta.circuit_length_km != null) parts.push(`서킷 길이 ${meta.circuit_length_km}km`);

  const cond = meta.weather?.condition;
  const temp = meta.weather?.temperature_c;

  // 기온(날씨) 표기: "23°C (맑음)" / "맑음" / "23°C"
  if (cond != null || temp != null) {
    const tempStr = temp != null ? `${temp}°C` : "";
    const condStr = cond != null ? `${cond}` : "";
    let weatherStr = "";

    if (tempStr && condStr) weatherStr = `${tempStr} (${condStr})`;
    else weatherStr = tempStr || condStr;

    parts.push(weatherStr);
  }

  $extra.textContent = parts.join(" | ");

  // 왼쪽 이미지
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
   Render: Results (옵션)
   - 결과 JSON 구조는 프로젝트마다 다르므로 유연하게 파싱
========================= */
function normalizeResultRows(data) {
  // 아래 케이스들을 지원:
  // - { results: [...] }
  // - { raceResult: [...] }
  // - [...] (배열 자체)
  const arr =
    (data && Array.isArray(data.results) && data.results) ||
    (data && Array.isArray(data.raceResult) && data.raceResult) ||
    (Array.isArray(data) && data) ||
    [];

  // 각 row는 최소 "순위/드라이버/상태"를 만들 수 있게 정규화
  return arr.map((r, idx) => {
    const position = r.position ?? r.rank ?? r.pos ?? (idx + 1);
    const driver =
      r.driver ??
      r.driver_name ??
      r.name ??
      r.driverName ??
      r.fullname ??
      r.full_name ??
      "-";

    // status/시간/갭/완주 여부 등: 프로젝트에 맞춰 여기서 확장 가능
    const status =
      r.status ??
      r.state ??
      r.result ??
      r.time ??
      r.gap ??
      r.note ??
      (r.dnf ? "DNF" : null) ??
      "-";

    return { position, driver, status };
  });
}

function rowToTr({ position, driver, status }) {
  const tr = document.createElement("tr");

  const tdPos = document.createElement("td");
  tdPos.textContent = position;

  const tdDriver = document.createElement("td");
  tdDriver.textContent = driver;

  const tdStatus = document.createElement("td");
  tdStatus.textContent = status;

  tr.append(tdPos, tdDriver, tdStatus);
  return tr;
}

function renderResultsTable(rows) {
  resetResultTables();

  if (!rows || rows.length === 0) {
    // 결과가 없으면 토글 비활성 유지
    return;
  }

  // Top5
  const top5 = rows.slice(0, 5);
  for (const r of top5) $topTbody.appendChild(rowToTr(r));

  // Full
  for (const r of rows) $fullTbody.appendChild(rowToTr(r));

  // 토글 활성화
  $toggleBtn.disabled = false;
}

/* =========================
   Populate: Round Select
========================= */
function populateRounds(scheduleList) {
  // 기존 옵션 초기화
  $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;

  for (const item of scheduleList) {
    const round = item?.round;
    if (round == null) continue;

    const opt = document.createElement("option");
    opt.value = String(round);

    // 라운드 표시 텍스트(원하면 더 꾸밀 수 있음)
    // 예: "24R - 아부다비(야스 마리나)"
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

    // 라운드 셀렉트 잠금 + 초기화
    $round.disabled = true;
    $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;

    const scheduleList = await loadSchedule(season);
    if (!scheduleList.length) {
      showError("해당 시즌의 스케줄 데이터를 찾지 못했습니다.");
      return;
    }

    populateRounds(scheduleList);

    // preferRound가 있으면 우선 시도, 없으면 아무것도 선택하지 않음
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

    const scheduleList = await loadSchedule(season);
    const meta = scheduleList.find((x) => String(x?.round) === String(round));

    if (!meta) {
      showError("선택한 라운드의 레이스 정보를 찾지 못했습니다.");
      return;
    }

    // 1) 레이스 메타 렌더
    renderRaceMeta(meta);

    // 2) (옵션) 결과 렌더: 있으면 보여주고, 없으면 조용히 비활성 유지
    try {
      const urls = resultUrlCandidates(season, round);
      const { data } = await tryFetchFirstJson(urls);
      const rows = normalizeResultRows(data);

      renderResultsTable(rows);

      // 결과가 있다면, Top5는 항상 보이고
      // 전체는 토글로 노출(초기 숨김 유지)
    } catch {
      // 결과 파일이 없을 수 있음: 에러로 띄우지 말고 토글만 비활성 유지
      // (원하면 안내문을 띄울 수 있지만, 현재는 조용히 처리)
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
      // 시즌 선택 해제
      $round.disabled = true;
      $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;
      setDetailsHidden(true);
      resetResultTables();
      hideError();
      return;
    }

    // 시즌 변경 시에는 기본적으로 라운드 자동 선택하지 않음
    // (원하면 여기서 최신 라운드 자동선택 가능)
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
  // (요구사항 그대로 반영)
  $season.value = String(DEFAULT_SEASON);

  await onSeasonChange(DEFAULT_SEASON, { preferRound: DEFAULT_ROUND });
})();
