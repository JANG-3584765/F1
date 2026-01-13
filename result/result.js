// result.js (type="module")
// ✅ 수정 포인트: 초기 라운드/시즌 선택을 "결과가 있는 가장 최근 라운드" 우선으로 결정
// - schedule은 최신 완료 판단에 사용
// - round_result는 실제 결과 존재 여부 판단에 사용
// - 2026 결과 파일이 없더라도 안전하게 동작

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
const SCHEDULE_PATH = (season) => `../data/${season}_schedule.json`;
const ROUND_RESULT_PATH = (season) => `./season/${season}.json`;

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

  // schedule: 배열 또는 { rounds: [...] } 모두 대응
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.rounds) ? raw.rounds : []);

  scheduleCache.set(season, list);
  return list;
}

async function loadRoundResult(season) {
  if (roundResultCache.has(season)) return roundResultCache.get(season);

  const res = await fetch(ROUND_RESULT_PATH(season));
  if (!res.ok) throw new Error(`round_result load fail: ${season}`);

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
   ✅ 결과가 있는 "가장 최근 라운드" 찾기
========================= */
function getLatestRoundWithResult(roundResultObj) {
  const rounds = roundResultObj?.rounds;
  if (!rounds || typeof rounds !== "object") return null;

  const keys = Object.keys(rounds)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // results 배열이 실제로 존재하는 마지막 라운드
  for (let i = keys.length - 1; i >= 0; i--) {
    const r = rounds[String(keys[i])];
    if (Array.isArray(r?.results) && r.results.length > 0) return keys[i];
  }
  return null;
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

  $raceFullname.textContent = `${raceName} (${city})`;
  $raceSubinfo.textContent = `${flag} ${location} · ${city}  |  ${circuit}`;

  const raceSession = findRaceSession(scheduleRound);
  $metaDate.textContent = formatDateFromISODateTime(raceSession?.start);

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

  if (status === "FINISHED") {
    if (row.position === 1 && row.time) return row.time;
    if (row.gap) return row.gap;
    if (row.time) return row.time;
    return "-";
  }
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

  const classified = results
    .filter((r) => Number.isFinite(Number(r.position)))
    .sort((a, b) => Number(a.position) - Number(b.position));

  const unclassified = results.filter((r) => !Number.isFinite(Number(r.position)));

  const merged = [...classified, ...unclassified].slice(0, 20);

  const rowsHTML = merged
    .map((r) => {
      const pos = r.position == null ? "-" : r.position;
      const driver = escapeHTML(r.name);
      const team = escapeHTML(r.team ?? "");
      const points = r.points ?? 0;
      const timeOrStatus = escapeHTML(getTimeOrStatus(r));

      const podiumClass =
        r.position === 1
          ? "podium podium-1"
          : r.position === 2
          ? "podium podium-2"
          : r.position === 3
          ? "podium podium-3"
          : "";

      const dotdClass = dotdCode && r.code === dotdCode ? "dotd" : "";
      const flClass = flCode && r.code === flCode ? "fastestlap" : "";

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
    })
    .join("");

  $tbody.innerHTML =
    rowsHTML ||
    `<tr><td colspan="4" class="empty">결과 데이터가 없습니다.</td></tr>`;

  $raceResult.hidden = false;
}

/* =========================
   Main render pipeline
========================= */
async function renderAll(season, round) {
  showMessage("");

  const schedule = await loadSchedule(season);
  const scheduleRound = schedule.find((r) => String(r.round) === String(round));
  renderRaceInfo(scheduleRound);

  try {
    const rr = await loadRoundResult(season);
    const roundData = rr?.rounds?.[String(round)] ?? null;
    renderRoundResult(roundData);
  } catch (e) {
    $raceResult.hidden = true;
    showMessage("해당 시즌의 결과 데이터 파일이 아직 없습니다.", "info");
  }
}

/* =========================
   ✅ 초기 선택 로직(개선)
   1) 최신 시즌부터 검사
   2) 해당 시즌에 round_result가 존재하면 "결과 있는 마지막 라운드" 선택
   3) round_result가 없으면 schedule 기준 latestFinishedRound 선택
========================= */
async function pickInitialSeasonAndRound() {
  const seasons = getAvailableSeasons();
  if (seasons.length === 0) return { season: null, round: null };

  // 최신 시즌부터
  for (let i = seasons.length - 1; i >= 0; i--) {
    const season = String(seasons[i]);

    // schedule은 필수(드롭다운/상단정보)
    let schedule = [];
    try {
      schedule = await loadSchedule(season);
    } catch {
      continue;
    }

    // 결과 파일이 있으면 결과 기반으로 라운드 결정
    try {
      const rr = await loadRoundResult(season);
      const latestWithResult = getLatestRoundWithResult(rr);

      if (latestWithResult != null) {
        return { season, round: String(latestWithResult) };
      }
    } catch {
      // 결과 파일 없음 → schedule 기반으로 fallback
    }

    const latestFinished = getLatestFinishedRound(schedule);
    return { season, round: String(latestFinished) };
  }

  return { season: null, round: null };
}

/* =========================
   Init
========================= */
async function init() {
  buildRoundOptions(24);
  $round.disabled = false;

  const picked = await pickInitialSeasonAndRound();
  if (!picked.season || !picked.round) {
    showMessage("시즌/라운드 데이터를 불러올 수 없습니다.", "error");
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

  // ✅ 시즌 변경 시: 해당 시즌에서 "결과 있는 마지막 라운드" 우선
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

  // fallback: schedule 기준
  const schedule = await loadSchedule(season);
  const latestFinished = getLatestFinishedRound(schedule);
  $round.value = String(latestFinished);

  await renderAll(season, String(latestFinished));
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
