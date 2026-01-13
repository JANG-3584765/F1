/* =========================
   DOM (result.html 기준)
========================= */
const $season = document.querySelector("#season-select");
const $round = document.querySelector("#round-select");

const $details = document.querySelector("#race-details");
const $pageError = document.querySelector("#page-error");

const $raceFlag = document.querySelector("#race-flag");
const $raceName = document.querySelector("#race-name");
const $raceCity = document.querySelector("#race-city");
const $raceDate = document.querySelector("#race-date");
const $raceExtra = document.querySelector("#race-extra");
const $raceTrack = document.querySelector("#race-track");

const $topTbody = document.querySelector("#top-results-tbody");
const $toggleBtn = document.querySelector("#toggle-full-btn");
const $fullWrap = document.querySelector("#full-results");
const $fullTbody = document.querySelector("#full-results-tbody");

/* =========================
   Paths (필요시 수정)
   - result.html이 /result/result.html 이라고 가정
========================= */
const SCHEDULE_PATH = (season) => `../data/${season}_schedule.json`;
const ROUND_RESULT_PATH = (season) => `./result/${season}_round_result.json`;

/* =========================
   Cache
========================= */
const scheduleCache = new Map();     // season -> array
const roundResultCache = new Map();  // season -> object

/* =========================
   Helpers
========================= */
function setError(message) {
  if (!$pageError) return;
  $pageError.hidden = !message;
  $pageError.textContent = message || "";
}

function clearError() {
  setError("");
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateFromISODateTime(iso) {
  // "2025-03-16T13:00:00+09:00" -> "2025.03.16"
  if (!iso) return "-";
  const datePart = String(iso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return "-";
  return datePart.replaceAll("-", ".");
}

function findRaceSession(scheduleRound) {
  return scheduleRound?.sessions?.find((s) => s?.name === "레이스") ?? null;
}

function buildRoundOptions(total = 24) {
  const frag = document.createDocumentFragment();

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "라운드를 선택하세요";
  frag.appendChild(opt0);

  for (let i = 1; i <= total; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i}R`;
    frag.appendChild(opt);
  }

  $round.innerHTML = "";
  $round.appendChild(frag);
}

function getAvailableSeasons() {
  return Array.from($season.querySelectorAll("option"))
    .map((o) => o.value)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

/* =========================
   Loaders
========================= */
async function loadSchedule(season) {
  if (scheduleCache.has(season)) return scheduleCache.get(season);

  const res = await fetch(SCHEDULE_PATH(season));
  if (!res.ok) throw new Error(`schedule load fail: ${season} (${res.status})`);

  const raw = await res.json();

  // schedule: 배열 or { rounds:[...] } 대응
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.rounds) ? raw.rounds : []);
  scheduleCache.set(season, list);
  return list;
}

async function loadRoundResult(season) {
  if (roundResultCache.has(season)) return roundResultCache.get(season);

  const res = await fetch(ROUND_RESULT_PATH(season));
  if (!res.ok) throw new Error(`round_result load fail: ${season} (${res.status})`);

  const raw = await res.json();
  roundResultCache.set(season, raw);
  return raw;
}

/* =========================
   Latest finished round (schedule 기준)
========================= */
function getLatestFinishedRound(scheduleList) {
  const now = new Date();
  let latestRoundNum = 1;

  for (const r of scheduleList) {
    const race = findRaceSession(r);
    const endISO = race?.end ?? race?.start;
    if (!endISO) continue;

    const end = new Date(endISO);
    if (Number.isNaN(end.getTime())) continue;

    if (end <= now) {
      const rn = Number(r.round);
      if (Number.isFinite(rn) && rn > latestRoundNum) latestRoundNum = rn;
    }
  }
  return latestRoundNum;
}

/* =========================
   Latest round with results (round_result 기준)
========================= */
function getLatestRoundWithResult(roundResultObj) {
  const rounds = roundResultObj?.rounds;
  if (!rounds || typeof rounds !== "object") return null;

  const keys = Object.keys(rounds)
    .map((k) => Number(k))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  for (let i = keys.length - 1; i >= 0; i--) {
    const rd = rounds[String(keys[i])];
    if (Array.isArray(rd?.results) && rd.results.length > 0) return keys[i];
  }
  return null;
}

/* =========================
   Render - Race header (schedule)
========================= */
function renderRaceInfo(scheduleRound) {
  if (!scheduleRound) {
    $details.hidden = true;
    return;
  }

  const flag = scheduleRound.flag ?? "";
  const raceName = scheduleRound.race_name ?? `${scheduleRound.round}R`;
  const city = scheduleRound.city ?? "";
  const location = scheduleRound.location ?? "";
  const circuit = scheduleRound.circuit ?? "";

  // 상단 텍스트
  $raceFlag.textContent = flag;
  $raceName.textContent = raceName;
  $raceCity.textContent = city ? `(${city})` : "";

  // 날짜(레이스 세션 start)
  const raceSession = findRaceSession(scheduleRound);
  $raceDate.textContent = formatDateFromISODateTime(raceSession?.start);

  // "랩 수 | 서킷 길이 | 날씨 (기온)"
  const laps = scheduleRound.laps ?? "-";
  const len = scheduleRound.circuit_length_km == null ? "-" : `${scheduleRound.circuit_length_km} km`;

  const cond = scheduleRound.weather?.condition;
  const temp = scheduleRound.weather?.temperature_c;
  let weatherText = "-";
  if (cond == null && temp == null) weatherText = "-";
  else if (cond != null && temp == null) weatherText = String(cond);
  else if (cond == null && temp != null) weatherText = `${temp} ℃`;
  else weatherText = `${cond} (${temp} ℃)`;

  $raceExtra.textContent = `${laps} Laps | ${len} | ${weatherText}`;

  // 서킷 이미지
  const img = scheduleRound.circuit_image ?? "";
  $raceTrack.src = img;
  $raceTrack.hidden = !img;
  $raceTrack.alt = circuit ? `${circuit} 서킷 이미지` : "서킷 이미지";

  // details show
  $details.hidden = false;
}

/* =========================
   Render - Results tables (round_result)
========================= */
function getStatusText(row) {
  const status = String(row.status ?? "").toUpperCase();

  if (status === "FINISHED") {
    // 1위는 time, 나머지는 gap 우선
    if (row.position === 1 && row.time) return row.time;
    if (row.gap) return row.gap;
    if (row.time) return row.time;
    return "Finished";
  }
  return status || "-";
}

function rowLabelSuffix(row, dotdCode, flCode) {
  const tags = [];
  if (dotdCode && row.code === dotdCode) tags.push("DOTD");
  if (flCode && row.code === flCode) tags.push("FL");
  return tags.length ? ` (${tags.join(",")})` : "";
}

function renderTopAndFull(roundData) {
  // 초기화
  $topTbody.innerHTML = "";
  $fullTbody.innerHTML = "";
  $fullWrap.hidden = true;
  $toggleBtn.disabled = true;
  $toggleBtn.textContent = "전체 결과 펼치기";

  if (!roundData || !Array.isArray(roundData.results)) {
    $topTbody.innerHTML = `<tr><td colspan="3" class="empty">결과 데이터가 없습니다.</td></tr>`;
    return;
  }

  const dotdCode = roundData.dotd ?? null;
  const flCode = roundData.fastest_lap_driver ?? null;

  // 정렬: position 있는 애 먼저 오름차순, 나머지 뒤로
  const results = roundData.results.slice();
  const classified = results
    .filter((r) => Number.isFinite(Number(r.position)))
    .sort((a, b) => Number(a.position) - Number(b.position));
  const unclassified = results.filter((r) => !Number.isFinite(Number(r.position)));
  const sorted = [...classified, ...unclassified];

  // top5
  const top5 = sorted.filter(r => Number.isFinite(Number(r.position))).slice(0, 5);
  const topRows = top5.map((r) => {
    const pos = r.position ?? "-";
    const name = escapeHTML(r.name) + rowLabelSuffix(r, dotdCode, flCode);
    const status = escapeHTML(getStatusText(r));
    return `
      <tr>
        <td>${escapeHTML(pos)}</td>
        <td>${name}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join("");

  $topTbody.innerHTML = topRows || `<tr><td colspan="3" class="empty">상위 5명 데이터가 없습니다.</td></tr>`;

  // full (1~20 기준으로 표시하되, 데이터가 20 미만이면 있는 만큼)
  const full20 = sorted.slice(0, 20);
  const fullRows = full20.map((r) => {
    const pos = r.position ?? "-";
    const name = escapeHTML(r.name) + rowLabelSuffix(r, dotdCode, flCode);
    const status = escapeHTML(getStatusText(r));
    return `
      <tr>
        <td>${escapeHTML(pos)}</td>
        <td>${name}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join("");

  $fullTbody.innerHTML = fullRows || `<tr><td colspan="3" class="empty">전체 결과 데이터가 없습니다.</td></tr>`;

  // toggle 활성화
  $toggleBtn.disabled = false;
}

/* =========================
   Pipeline
========================= */
async function renderAll(season, round) {
  clearError();

  // schedule
  const scheduleList = await loadSchedule(season);
  const scheduleRound = scheduleList.find((r) => String(r.round) === String(round));
  renderRaceInfo(scheduleRound);

  // round result (없어도 스케줄 정보는 보여주고, 결과만 비우기)
  try {
    const rr = await loadRoundResult(season);
    const roundData = rr?.rounds?.[String(round)] ?? null;
    renderTopAndFull(roundData);
  } catch (e) {
    $topTbody.innerHTML = `<tr><td colspan="3" class="empty">해당 시즌 결과 파일이 없습니다.</td></tr>`;
    $fullTbody.innerHTML = "";
    $toggleBtn.disabled = true;
    $fullWrap.hidden = true;
  }
}

/* =========================
   Initial pick
========================= */
async function pickInitialSeasonAndRound() {
  const seasons = getAvailableSeasons();
  if (seasons.length === 0) return { season: null, round: null };

  // 최신 시즌부터
  for (let i = seasons.length - 1; i >= 0; i--) {
    const season = String(seasons[i]);

    // schedule은 필수
    let scheduleList = [];
    try {
      scheduleList = await loadSchedule(season);
    } catch {
      continue;
    }

    // 결과 파일 있으면 결과가 있는 마지막 라운드
    try {
      const rr = await loadRoundResult(season);
      const latestWithResult = getLatestRoundWithResult(rr);
      if (latestWithResult != null) return { season, round: String(latestWithResult) };
    } catch {
      // ignore
    }

    // fallback: schedule 최신 완료
    const latestFinished = getLatestFinishedRound(scheduleList);
    return { season, round: String(latestFinished) };
  }

  return { season: null, round: null };
}

/* =========================
   Init
========================= */
async function init() {
  // 필수 DOM 체크
  if (!$season || !$round || !$details || !$topTbody || !$fullTbody || !$toggleBtn) {
    setError("필수 DOM 요소가 누락되었습니다. result.html의 id를 확인하세요.");
    return;
  }

  buildRoundOptions(24);
  $round.disabled = false;

  const picked = await pickInitialSeasonAndRound();
  if (!picked.season || !picked.round) {
    setError("시즌/라운드 데이터를 불러올 수 없습니다. JSON 경로를 확인하세요.");
    return;
  }

  $season.value = picked.season;
  $round.value = picked.round;

  await renderAll(picked.season, picked.round);
}

/* =========================
   Events
========================= */
$season.addEventListener("change", async () => {
  const season = $season.value;

  $details.hidden = true;
  clearError();

  if (!season) {
    $round.disabled = true;
    $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;
    $topTbody.innerHTML = "";
    $fullTbody.innerHTML = "";
    $toggleBtn.disabled = true;
    $fullWrap.hidden = true;
    return;
  }

  buildRoundOptions(24);
  $round.disabled = false;

  // 시즌 변경 시: 결과 있는 최신 라운드 우선
  try {
    const rr = await loadRoundResult(season);
    const latestWithResult = getLatestRoundWithResult(rr);
    if (latestWithResult != null) {
      $round.value = String(latestWithResult);
      await renderAll(season, String(latestWithResult));
      return;
    }
  } catch {
    // ignore
  }

  // fallback: schedule 최신 완료
  const scheduleList = await loadSchedule(season);
  const latestFinished = getLatestFinishedRound(scheduleList);
  $round.value = String(latestFinished);
  await renderAll(season, String(latestFinished));
});

$round.addEventListener("change", async () => {
  const season = $season.value;
  const round = $round.value;
  if (!season || !round) return;
  await renderAll(season, round);
});

/* =========================
   Toggle button
========================= */
$toggleBtn.addEventListener("click", () => {
  const isHidden = $fullWrap.hidden;
  $fullWrap.hidden = !isHidden;
  $toggleBtn.textContent = isHidden ? "전체 결과 접기" : "전체 결과 펼치기";
});

/* run */
init().catch((e) => {
  console.error(e);
  setError("데이터 로딩 중 오류가 발생했습니다. 콘솔을 확인하세요.");
});
