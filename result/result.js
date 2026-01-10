// result.js (type="module")

/* =========================
   DOM
========================= */
const $season = document.querySelector("#season-select");
const $round = document.querySelector("#round-select");
const $msg = document.querySelector("#result-message");

const $raceInfo = document.querySelector("#race-info");
const $raceFullname = document.querySelector("#race-fullname");
const $raceSubinfo = document.querySelector("#race-subinfo");

const $metaDate = document.querySelector("#meta-date");
const $metaLaps = document.querySelector("#meta-laps");
const $metaLength = document.querySelector("#meta-length");
const $metaWeather = document.querySelector("#meta-weather");

const $circuitImg = document.querySelector("#circuit-image");
const $circuitCaption = document.querySelector("#circuit-caption");

const $raceResult = document.querySelector("#race-result");
const $tbody = document.querySelector("#result-tbody");

const $badgesWrap = document.querySelector("#result-badges");
const $badgeDotd = document.querySelector("#badge-dotd");
const $badgeFastest = document.querySelector("#badge-fastestlap");

/* =========================
   Paths (필요시 수정)
========================= */
const SCHEDULE_PATH = (season) => `./data/${season}_schedule.json`;
const ROUND_RESULT_PATH = (season) => `./data/${season}_round_result.json`;

/* =========================
   Cache
========================= */
const scheduleCache = new Map();     // season -> array
const roundResultCache = new Map();  // season -> object

/* =========================
   Helpers
========================= */
function showMessage(text, type = "info") {
  if (!$msg) return;
  $msg.hidden = !text;
  $msg.textContent = text || "";
  $msg.dataset.type = type;
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
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

/* =========================
   Loaders
========================= */
async function loadSchedule(season) {
  if (scheduleCache.has(season)) return scheduleCache.get(season);

  const res = await fetch(SCHEDULE_PATH(season));
  if (!res.ok) throw new Error(`schedule load fail: ${season}`);

  const raw = await res.json();

  // 네 구조: "라운드 객체 배열"이 정상.
  // 혹시 { rounds: [...] } 형태로 바뀌어도 대응.
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.rounds) ? raw.rounds : []);

  scheduleCache.set(season, list);
  return list;
}

async function loadRoundResult(season) {
  if (roundResultCache.has(season)) return roundResultCache.get(season);

  const res = await fetch(ROUND_RESULT_PATH(season));
  if (!res.ok) throw new Error(`round_result load fail: ${season}`);

  const raw = await res.json();

  // 네 구조: { season, rounds: { "1": { dotd, fastest_lap_driver, results:[...] } } }
  roundResultCache.set(season, raw);
  return raw;
}

/* =========================
   Latest finished round
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
   Render - Step 2 (Schedule)
========================= */
function renderRaceInfo(scheduleRound) {
  if (!scheduleRound) {
    $raceInfo.hidden = true;
    return;
  }

  const raceName = scheduleRound.race_name ?? `${scheduleRound.round}R`;
  const location = scheduleRound.location ?? "-";
  const city = scheduleRound.city ?? "-";
  const flag = scheduleRound.flag ?? "";
  const circuit = scheduleRound.circuit ?? "-";

  // 풀네임(위치)
  $raceFullname.textContent = `${raceName} (${city})`;

  // 서브정보: 국기 + 국가/도시 + 서킷
  $raceSubinfo.textContent = `${flag} ${location} · ${city}  |  ${circuit}`;

  // 날짜: 레이스 세션 start에서
  const raceSession = findRaceSession(scheduleRound);
  $metaDate.textContent = formatDateFromISODateTime(raceSession?.start);

  // laps / length / weather
  $metaLaps.textContent = scheduleRound.laps ?? "-";
  $metaLength.textContent =
    scheduleRound.circuit_length_km == null ? "-" : `${scheduleRound.circuit_length_km} km`;

  const cond = scheduleRound.weather?.condition;
  const temp = scheduleRound.weather?.temperature_c;
  if (cond == null && temp == null) {
    $metaWeather.textContent = "-";
  } else if (cond != null && temp == null) {
    $metaWeather.textContent = String(cond);
  } else if (cond == null && temp != null) {
    $metaWeather.textContent = `${temp} ℃`;
  } else {
    $metaWeather.textContent = `${cond} / ${temp} ℃`;
  }

  // 서킷 이미지
  const img = scheduleRound.circuit_image ?? "";
  $circuitImg.src = img;
  $circuitImg.hidden = !img;

  $circuitCaption.textContent = circuit;

  $raceInfo.hidden = false;
}

/* =========================
   Render - Step 3 (Round Result)
========================= */
function getTimeOrStatus(row) {
  const status = String(row.status ?? "").toUpperCase();

  // 완주
  if (status === "FINISHED") {
    // 1위는 time, 나머지는 gap 우선
    if (row.position === 1 && row.time) return row.time;
    if (row.gap) return row.gap;
    if (row.time) return row.time;
    return "-";
  }

  // DNF/DNS/DSQ 등
  return status || "-";
}

function renderRoundResult(roundData) {
  if (!roundData) {
    $raceResult.hidden = true;
    return;
  }

  const dotdCode = roundData.dotd ?? null;
  const flCode = roundData.fastest_lap_driver ?? null;

  // 배지
  if (dotdCode || flCode) {
    $badgesWrap.hidden = false;

    if (dotdCode) {
      $badgeDotd.hidden = false;
      $badgeDotd.textContent = `오늘의 드라이버: ${dotdCode}`;
    } else {
      $badgeDotd.hidden = true;
    }

    if (flCode) {
      $badgeFastest.hidden = false;
      $badgeFastest.textContent = `패스티스트랩: ${flCode}`;
    } else {
      $badgeFastest.hidden = true;
    }
  } else {
    $badgesWrap.hidden = true;
  }

  const results = Array.isArray(roundData.results) ? roundData.results : [];

  // 정렬: position 있는 것(1~20) 먼저 오름차순, 그 다음 미분류(status) 유지
  const classified = results
    .filter(r => Number.isFinite(Number(r.position)))
    .sort((a, b) => Number(a.position) - Number(b.position));

  const unclassified = results.filter(r => !Number.isFinite(Number(r.position)));

  const merged = [...classified, ...unclassified].slice(0, 20);

  const rowsHTML = merged.map((r) => {
    const pos = r.position == null ? "-" : r.position;
    const driver = escapeHTML(r.name);
    const team = escapeHTML(r.team ?? "");
    const points = r.points ?? 0;

    const timeOrStatus = escapeHTML(getTimeOrStatus(r));

    const podiumClass =
      r.position === 1 ? "podium podium-1" :
      r.position === 2 ? "podium podium-2" :
      r.position === 3 ? "podium podium-3" : "";

    const dotdClass = (dotdCode && r.code === dotdCode) ? "dotd" : "";
    const flClass = (flCode && r.code === flCode) ? "fastestlap" : "";

    return `
      <tr class="${podiumClass} ${dotdClass} ${flClass}">
        <td class="col-pos">${escapeHTML(pos)}</td>
        <td class="col-driver">
          <span class="driver-name">${driver}</span>
          ${team ? `<span class="driver-team">${team}</span>` : ""}
          <span class="driver-code">${escapeHTML(r.code ?? "")}</span>
        </td>
        <td class="col-time">${timeOrStatus}</td>
        <td class="col-points">${escapeHTML(points)}</td>
      </tr>
    `;
  }).join("");

  $tbody.innerHTML = rowsHTML || `
    <tr><td colspan="4" class="empty">결과 데이터가 없습니다.</td></tr>
  `;

  $raceResult.hidden = false;
}

/* =========================
   Main render pipeline
========================= */
async function renderAll(season, round) {
  showMessage("");

  // 2단계
  const schedule = await loadSchedule(season);
  const scheduleRound = schedule.find(r => String(r.round) === String(round));
  renderRaceInfo(scheduleRound);

  // 3단계
  // 2026은 아직 없을 수 있으니(파일 없거나 rounds 없음) 안전 처리
  try {
    const rr = await loadRoundResult(season);
    const roundData = rr?.rounds?.[String(round)] ?? null;
    renderRoundResult(roundData);
  } catch (e) {
    // round_result 파일이 없으면 결과 영역 숨기고 메시지만 표시
    $raceResult.hidden = true;
    showMessage("해당 시즌의 결과 데이터 파일이 아직 없습니다.", "info");
  }
}

/* =========================
   Init
========================= */
async function init() {
  const seasons = getAvailableSeasons();
  const defaultSeason = seasons.at(-1); // 가장 최신 시즌
  if (!defaultSeason) return;

  $season.value = String(defaultSeason);

  // 라운드 옵션 생성
  buildRoundOptions(24);
  $round.disabled = false;

  const schedule = await loadSchedule(String(defaultSeason));
  const latestRound = getLatestFinishedRound(schedule);
  $round.value = String(latestRound);

  await renderAll(String(defaultSeason), String(latestRound));
}

/* =========================
   Events
========================= */
$season.addEventListener("change", async () => {
  const season = $season.value;

  $raceInfo.hidden = true;
  $raceResult.hidden = true;
  showMessage("");

  if (!season) {
    $round.disabled = true;
    $round.innerHTML = `<option value="">라운드를 선택하세요</option>`;
    return;
  }

  buildRoundOptions(24);
  $round.disabled = false;

  const schedule = await loadSchedule(season);
  const latestRound = getLatestFinishedRound(schedule);
  $round.value = String(latestRound);

  await renderAll(season, String(latestRound));
});

$round.addEventListener("change", async () => {
  const season = $season.value;
  const round = $round.value;
  if (!season || !round) return;
  await renderAll(season, round);
});

init().catch((e) => {
  console.error(e);
  showMessage("데이터 로딩 중 오류가 발생했습니다. 콘솔을 확인하세요.", "error");
});
