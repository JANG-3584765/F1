/* =========================
   video.js
   - 시즌 드롭다운
   - 라운드 드롭다운
   - 소스 탭 필터
   - 영상 그리드 렌더링
   ========================= */

/** 설정 */
const DATA_URL = "./video.json"; // ✅ 여기에 네 JSON 파일 경로를 넣어줘 (예: ./videos_2025.json)

/** DOM */
const $seasonBtn = document.querySelector("#season-button");
const $seasonList = document.querySelector("#season-list");

const $roundBtn = document.querySelector("#round-button");
const $roundList = document.querySelector("#round-list");

const $tabs = document.querySelectorAll(".tab-btn");
const $grid = document.querySelector("#videoGrid");

/** 상태 */
const state = {
  dataBySeason: {},        // { [seasonNumber]: { season, rounds } }
  seasons: [],             // [2025, 2026, ...]
  season: null,            // number
  round: "all",            // "all" | number
  source: "all"            // "all" | "official" | "coupang" | "influencer"
};

/* -------------------------
   유틸
------------------------- */
function toSeasonNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortNumericAsc(a, b) {
  return Number(a) - Number(b);
}

function closeAllDropdowns() {
  $seasonList.classList.remove("open");
  $roundList.classList.remove("open");
}

function toggleDropdown($list) {
  const isOpen = $list.classList.contains("open");
  closeAllDropdowns();
  if (!isOpen) $list.classList.add("open");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------------
   데이터 로드/정규화
------------------------- */
/**
 * 지원 포맷 1 (단일 시즌)
 * {
 *   "season": 2025,
 *   "rounds": { "1": { "city": "...", "videos": [...] }, ... }
 * }
 *
 * 지원 포맷 2 (멀티 시즌)
 * {
 *   "seasons": {
 *     "2025": { "season": 2025, "rounds": {...} },
 *     "2026": { "season": 2026, "rounds": {...} }
 *   }
 * }
 */
function normalizeData(raw) {
  const map = {};

  if (raw && raw.seasons && typeof raw.seasons === "object") {
    for (const [k, v] of Object.entries(raw.seasons)) {
      const sn = toSeasonNumber(v?.season ?? k);
      if (!sn || !v?.rounds) continue;
      map[sn] = { season: sn, rounds: v.rounds };
    }
  } else if (raw && raw.season && raw.rounds) {
    const sn = toSeasonNumber(raw.season);
    if (sn) map[sn] = { season: sn, rounds: raw.rounds };
  }

  const seasons = Object.keys(map).map(Number).sort(sortNumericAsc);
  return { map, seasons };
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Data fetch failed: ${res.status}`);
  const raw = await res.json();

  const { map, seasons } = normalizeData(raw);
  if (!seasons.length) throw new Error("Invalid data format: no seasons found.");

  state.dataBySeason = map;
  state.seasons = seasons;

  // 기본 시즌: 가장 최신(큰 값)
  state.season = seasons[seasons.length - 1];
  state.round = "all";
  state.source = "all";
}

/* -------------------------
   드롭다운 UI 생성
------------------------- */
function renderSeasonDropdown() {
  $seasonList.innerHTML = "";

  state.seasons.forEach((sn) => {
    const li = document.createElement("li");
    li.className = "dropdown-item";
    li.textContent = `${sn} 시즌`;
    li.dataset.value = String(sn);
    $seasonList.appendChild(li);
  });

  $seasonBtn.textContent = `${state.season} 시즌 ▼`;
}

function getRoundsObject() {
  const seasonObj = state.dataBySeason[state.season];
  return seasonObj?.rounds ?? {};
}

function renderRoundDropdown() {
  $roundList.innerHTML = "";

  // "전체 라운드"
  {
    const liAll = document.createElement("li");
    liAll.className = "dropdown-item";
    liAll.textContent = "전체 라운드";
    liAll.dataset.value = "all";
    $roundList.appendChild(liAll);
  }

  const roundsObj = getRoundsObject();
  const roundKeys = Object.keys(roundsObj).sort(sortNumericAsc);

  roundKeys.forEach((rk) => {
    const rNum = Number(rk);
    const city = roundsObj[rk]?.city ?? "";
    const li = document.createElement("li");
    li.className = "dropdown-item";
    li.textContent = `Round ${rNum} · ${city}`;
    li.dataset.value = String(rNum);
    $roundList.appendChild(li);
  });

  // 버튼 라벨 갱신
  if (state.round === "all") {
    $roundBtn.textContent = `전체 라운드 ▼`;
  } else {
    const rKey = String(state.round);
    const city = roundsObj[rKey]?.city ?? "";
    $roundBtn.textContent = `Round ${state.round} · ${city} ▼`;
  }
}

/* -------------------------
   탭(소스) UI
------------------------- */
function setActiveTab(source) {
  state.source = source;

  $tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === source);
  });
}

/* -------------------------
   데이터 -> 렌더링 대상 추출
------------------------- */
function collectVideos() {
  const roundsObj = getRoundsObject();

  const roundKeys = Object.keys(roundsObj).sort(sortNumericAsc);

  // 라운드 필터
  const selectedRoundKeys =
    state.round === "all"
      ? roundKeys
      : roundKeys.filter((k) => Number(k) === Number(state.round));

  // video 객체에 round/city를 붙여서 반환
  let videos = [];
  for (const rk of selectedRoundKeys) {
    const city = roundsObj[rk]?.city ?? "";
    const list = Array.isArray(roundsObj[rk]?.videos) ? roundsObj[rk].videos : [];
    const rNum = Number(rk);

    videos.push(
      ...list.map((v) => ({
        ...v,
        round: rNum,
        city
      }))
    );
  }

  // 소스 탭 필터
  if (state.source !== "all") {
    videos = videos.filter((v) => v.source === state.source);
  }

  // 라운드/아이디 기준 정렬(필요시)
  videos.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return String(a.id).localeCompare(String(b.id));
  });

  return videos;
}

/* -------------------------
   그리드 렌더링
------------------------- */
function renderGrid() {
  const videos = collectVideos();

  if (!videos.length) {
    $grid.innerHTML = `<div class="empty">해당 조건에 맞는 영상이 없습니다.</div>`;
    return;
  }

  const html = videos
    .map((v) => {
      const title = escapeHtml(v.title);
      const provider = escapeHtml(v.provider ?? "");
      const roundLabel = `R${v.round} · ${escapeHtml(v.city)}`;

      // videoUrl이 비어 있으면 "준비중" 카드 처리
      const url = String(v.videoUrl ?? "").trim();
      const isReady = !!url;

      const iframe = isReady
        ? `<iframe
            src="${escapeHtml(url)}"
            title="${title}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>`
        : `<div class="video-placeholder">영상 링크 준비 중</div>`;

      return `
        <article class="video-card" data-round="${v.round}" data-source="${escapeHtml(v.source)}">
          <div class="video-embed">${iframe}</div>
          <div class="video-meta">
            <div class="video-badges">
              <span class="badge badge-round">${roundLabel}</span>
              <span class="badge badge-source">${escapeHtml(v.source)}</span>
            </div>
            <h3 class="video-title">${title}</h3>
            <div class="video-provider">${provider}</div>
          </div>
        </article>
      `;
    })
    .join("");

  $grid.innerHTML = html;

  // Twemoji (선택)
  if (window.twemoji) {
    window.twemoji.parse(document.body);
  }
}

/* -------------------------
   이벤트 바인딩
------------------------- */
function bindEvents() {
  // 드롭다운 버튼
  $seasonBtn.addEventListener("click", () => toggleDropdown($seasonList));
  $roundBtn.addEventListener("click", () => toggleDropdown($roundList));

  // 시즌 선택
  $seasonList.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;

    const sn = toSeasonNumber(item.dataset.value);
    if (!sn) return;

    state.season = sn;
    state.round = "all"; // 시즌 바꾸면 라운드는 전체로 초기화
    closeAllDropdowns();

    renderSeasonDropdown();
    renderRoundDropdown();
    renderGrid();
  });

  // 라운드 선택
  $roundList.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;

    const val = item.dataset.value;
    state.round = val === "all" ? "all" : Number(val);

    closeAllDropdowns();
    renderRoundDropdown();
    renderGrid();
  });

  // 탭 필터
  $tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter || "all";
      setActiveTab(filter);
      renderGrid();
    });
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", (e) => {
    const insideSeason = e.target.closest(".season-dropdown");
    const insideRound = e.target.closest(".round-dropdown");
    if (!insideSeason && !insideRound) closeAllDropdowns();
  });

  // ESC 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDropdowns();
  });
}

/* -------------------------
   초기화
------------------------- */
(async function init() {
  try {
    await loadData();

    renderSeasonDropdown();
    renderRoundDropdown();
    setActiveTab("all");
    renderGrid();

    bindEvents();
  } catch (err) {
    console.error(err);
    $grid.innerHTML = `<div class="empty">데이터 로드에 실패했습니다.</div>`;
  }
})();
