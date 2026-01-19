// ============================
// video.js (No-Embed / New Tab Open)
// - JSON: { season, rounds: { "1": { city, videos: [...] }, ... } }
// - videos[].source: "official" | "coupang" | "influencer"
// - videos[].videoUrl: youtu.be / watch / shorts 어떤 형태든 OK (썸네일만 추출)
// ============================

const DATA_URL = "./video.json"; // ✅ 파일명이 다르면 여기만 수정

// 상태
let selectedSeason = 2025;        // number
let selectedRound = "all";        // "all" | number
let selectedSource = "all";       // "all" | "official" | "coupang" | "influencer"

// 데이터
let dataBySeason = {};            // { [seasonNumber]: { season, rounds } }
let seasons = [];                 // [2025, 2026...]

// DOM
const $seasonBtn = document.getElementById("season-button");
const $seasonList = document.getElementById("season-list");

const $roundBtn = document.getElementById("round-button");
const $roundList = document.getElementById("round-list");

const $tabs = document.querySelectorAll(".tab-btn");
const $grid = document.getElementById("videoGrid");

// ----------------------------
// 유틸
// ----------------------------
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function sortNumAsc(a, b) {
  return Number(a) - Number(b);
}
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 드롭다운 제어 (CSS에서 .show로 토글한다고 가정)
function closeDropdowns() {
  $seasonList.classList.remove("show");
  $roundList.classList.remove("show");
}
function toggleDropdown($list) {
  const isOpen = $list.classList.contains("show");
  closeDropdowns();
  if (!isOpen) $list.classList.add("show");
}

// ----------------------------
// YouTube 썸네일 추출
// ----------------------------
function getYoutubeId(url) {
  const u = String(url || "").trim();
  if (!u) return "";

  // youtu.be/VIDEO_ID
  let m = u.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  if (m?.[1]) return m[1];

  // youtube.com/watch?v=VIDEO_ID
  m = u.match(/[?&]v=([0-9A-Za-z_-]{11})/);
  if (m?.[1]) return m[1];

  // youtube.com/shorts/VIDEO_ID
  m = u.match(/youtube\.com\/shorts\/([0-9A-Za-z_-]{11})/);
  if (m?.[1]) return m[1];

  return "";
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

// ----------------------------
// 데이터 로드 + 정규화 (단일/멀티 시즌 둘 다 지원)
// ----------------------------
/*
지원 1: 단일 시즌 (너가 준 형태)
{
  "season": 2025,
  "rounds": { "1": {...}, ... }
}

지원 2: 멀티 시즌 (확장 대비)
{
  "seasons": {
    "2025": { "season": 2025, "rounds": {...} },
    "2026": { "season": 2026, "rounds": {...} }
  }
}
*/
function normalizeData(raw) {
  const map = {};

  if (raw?.seasons && typeof raw.seasons === "object") {
    for (const [k, obj] of Object.entries(raw.seasons)) {
      const sn = toNum(obj?.season ?? k);
      if (!sn || !obj?.rounds) continue;
      map[sn] = { season: sn, rounds: obj.rounds };
    }
  } else if (raw?.season && raw?.rounds) {
    const sn = toNum(raw.season);
    if (sn) map[sn] = { season: sn, rounds: raw.rounds };
  }

  const seasonArr = Object.keys(map).map(Number).sort(sortNumAsc);
  return { map, seasonArr };
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`video.json 로드 실패: ${res.status}`);
  const raw = await res.json();

  const { map, seasonArr } = normalizeData(raw);
  if (!seasonArr.length) throw new Error("JSON 형식이 올바르지 않습니다.");

  dataBySeason = map;
  seasons = seasonArr;

  // 기본 시즌: 최신(큰 값)
  selectedSeason = seasons[seasons.length - 1];
  selectedRound = "all";
  selectedSource = "all";
}

// ----------------------------
// 시즌 드롭다운
// ----------------------------
function initSeasonDropdown() {
  $seasonList.innerHTML = "";

  seasons.forEach((sn) => {
    const li = document.createElement("li");
    li.textContent = `${sn} 시즌`;
    li.dataset.value = String(sn);
    $seasonList.appendChild(li);
  });

  $seasonBtn.textContent = `${selectedSeason} 시즌 ▼`;

  $seasonBtn.addEventListener("click", () => toggleDropdown($seasonList));

  $seasonList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const sn = toNum(li.dataset.value);
    if (!sn) return;

    selectedSeason = sn;
    selectedRound = "all"; // 시즌 변경 시 라운드 초기화
    $seasonBtn.textContent = `${sn} 시즌 ▼`;

    closeDropdowns();
    buildRoundDropdown();
    render();
  });
}

// ----------------------------
// 라운드 드롭다운
// ----------------------------
function buildRoundDropdown() {
  const roundsObj = dataBySeason[selectedSeason]?.rounds ?? {};
  const keys = Object.keys(roundsObj).sort(sortNumAsc);

  $roundList.innerHTML = "";

  // 전체 라운드
  const allLi = document.createElement("li");
  allLi.textContent = "전체 라운드";
  allLi.dataset.value = "all";
  $roundList.appendChild(allLi);

  // 라운드 목록
  keys.forEach((rk) => {
    const rNum = Number(rk);
    const city = roundsObj[rk]?.city ?? "";
    const li = document.createElement("li");
    li.textContent = `Round ${rNum} · ${city}`;
    li.dataset.value = String(rNum);
    $roundList.appendChild(li);
  });

  // 버튼 라벨
  if (selectedRound === "all") {
    $roundBtn.textContent = "전체 라운드 ▼";
  } else {
    const city = roundsObj[String(selectedRound)]?.city ?? "";
    $roundBtn.textContent = `Round ${selectedRound} · ${city} ▼`;
  }

  // 이벤트(한 번만 바인딩)
  if (!$roundBtn.dataset.bound) {
    $roundBtn.addEventListener("click", () => toggleDropdown($roundList));
    $roundBtn.dataset.bound = "1";
  }
  if (!$roundList.dataset.bound) {
    $roundList.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

      const val = li.dataset.value;
      selectedRound = val === "all" ? "all" : Number(val);

      const roundsObj2 = dataBySeason[selectedSeason]?.rounds ?? {};
      if (selectedRound === "all") {
        $roundBtn.textContent = "전체 라운드 ▼";
      } else {
        const city = roundsObj2[String(selectedRound)]?.city ?? "";
        $roundBtn.textContent = `Round ${selectedRound} · ${city} ▼`;
      }

      closeDropdowns();
      render();
    });
    $roundList.dataset.bound = "1";
  }
}

// ----------------------------
// 탭(소스) 필터
// ----------------------------
function initTabs() {
  $tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".tab-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      selectedSource = btn.dataset.filter || "all";
      render();
    });
  });
}

// ----------------------------
// 비디오 수집/필터
// ----------------------------
function collectVideos() {
  const roundsObj = dataBySeason[selectedSeason]?.rounds ?? {};
  const roundKeys = Object.keys(roundsObj).sort(sortNumAsc);

  const targetKeys =
    selectedRound === "all"
      ? roundKeys
      : roundKeys.filter((k) => Number(k) === Number(selectedRound));

  let list = [];
  for (const rk of targetKeys) {
    const roundNum = Number(rk);
    const city = roundsObj[rk]?.city ?? "";
    const videos = Array.isArray(roundsObj[rk]?.videos) ? roundsObj[rk].videos : [];

    list.push(
      ...videos.map((v) => ({
        ...v,
        round: roundNum,
        city
      }))
    );
  }

  if (selectedSource !== "all") {
    list = list.filter((v) => v.source === selectedSource);
  }

  // 정렬: 라운드 -> id
  list.sort((a, b) => (a.round - b.round) || String(a.id).localeCompare(String(b.id)));
  return list;
}

// ----------------------------
// 렌더링 (새창 열기 카드)
// ----------------------------
function sourceLabel(source) {
  if (source === "official") return "공식";
  if (source === "coupang") return "쿠팡";
  if (source === "influencer") return "인플루언서";
  return source || "";
}

function render() {
  const list = collectVideos();
  $grid.innerHTML = "";

  if (!list.length) {
    $grid.innerHTML = `<p style="color:#fff; text-align:center;">선택된 조건의 영상이 없습니다.</p>`;
    return;
  }

  list.forEach((v) => {
    const url = String(v.videoUrl || "").trim();
    const thumb = getYoutubeThumbnail(url);

    const title = escapeHtml(v.title);
    const provider = escapeHtml(v.provider);
    const badge = sourceLabel(v.source);
    const roundText = `Round ${v.round} · ${escapeHtml(v.city)}`;

    const card = document.createElement("div");
    card.className = "video-card";

    // url이 비어있으면(혹시) 클릭 불가 카드로 처리
    const linkOpen = url
      ? `href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"`
      : `href="javascript:void(0)" aria-disabled="true"`;

    card.innerHTML = `
      <a class="video-link" ${linkOpen}>
        <div class="video-thumb">
          ${
            thumb
              ? `<img src="${escapeHtml(thumb)}" alt="${title}" loading="lazy">`
              : `<div class="video-thumb-fallback">썸네일 없음</div>`
          }
          <span class="play-icon">▶</span>
        </div>
      </a>
      <div class="video-info">
        <span class="badge">${escapeHtml(badge)}</span>
        <h3>${title}</h3>
        <div class="team">${roundText}</div>
        <div class="provider">${provider}</div>
      </div>
    `;

    // hover 효과는 CSS로 처리 권장(기존처럼 JS로 scale 해도 됨)
    $grid.appendChild(card);
  });

  if (window.twemoji) window.twemoji.parse(document.body);
}

// ----------------------------
// 전역: 바깥 클릭/ESC로 드롭다운 닫기
// ----------------------------
document.addEventListener("click", (e) => {
  const inSeason = e.target.closest(".season-dropdown");
  const inRound = e.target.closest(".round-dropdown");
  if (!inSeason && !inRound) closeDropdowns();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDropdowns();
});

// ----------------------------
// 초기화
// ----------------------------
(async function init() {
  try {
    await loadData();
    initSeasonDropdown();
    buildRoundDropdown();
    initTabs();
    render();
  } catch (err) {
    console.error(err);
    $grid.innerHTML = `<p style="color:#fff; text-align:center;">데이터 로드에 실패했습니다.</p>`;
  }
})();
