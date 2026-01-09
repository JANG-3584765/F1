// nextrace.js (STEP 1: HTML 구조 유지 리팩터링)
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("next-race-box");

  // 상태
  let scheduleData = [];
  let countdownInterval = null;
  let isExpanded = false;

  // DOM 캐싱
  const flagEl = box.querySelector(".flag-img");
  const titleEl = box.querySelector(".race-title");
  const countdownEl = box.querySelector(".race-countdown");
  const toggleBtn = box.querySelector(".toggle-details-btn");

  const detailsEl = box.querySelector(".race-details");
  const circuitImgEl = box.querySelector(".circuit-img img");
  const sessionListEl = box.querySelector(".session-list");

  // 한국어 기준 국가 깃발
  const flags = {
    "호주": "🇦🇺", "중국": "🇨🇳", "일본": "🇯🇵",
    "바레인": "🇧🇭", "사우디아라비아": "🇸🇦",
    "마이애미": "🇺🇸", "캐나다": "🇨🇦",
    "모나코": "🇲🇨", "스페인": "🇪🇸", "오스트리아": "🇦🇹",
    "영국": "🇬🇧", "벨기에": "🇧🇪", "헝가리": "🇭🇺",
    "네덜란드": "🇳🇱", "이탈리아": "🇮🇹", "아제르바이잔": "🇦🇿",
    "싱가포르": "🇸🇬", "미국": "🇺🇸", "멕시코": "🇲🇽",
    "브라질": "🇧🇷", "라스베이거스": "🇺🇸",
    "카타르": "🇶🇦", "아부다비": "🇦🇪", "아랍에미리트": "🇦🇪"
  };

  const BASE_PATH = "/F1";

  // 데이터 로드
  Promise.all([
    fetch(`${BASE_PATH}/data/2025_schedule.json`).then(res => res.json()),
    fetch(`${BASE_PATH}/data/2026_schedule.json`).then(res => res.json())
  ])
    .then(([data2025, data2026]) => {
      scheduleData = [...data2025, ...data2026];
      renderNextRace();
      setInterval(renderNextRace, 600000); // 10분 갱신
    })
    .catch(err => {
      console.error(err);
      titleEl.textContent = "데이터 로드 실패";
    });

  // 다음 세션 렌더링
  function renderNextRace() {
    if (!scheduleData.length) return;

    const now = new Date();
    let nextSession = null;
    let nextRace = null;

    for (const race of scheduleData) {
      const sessions = Array.isArray(race.sessions)
        ? race.sessions
        : Object.entries(race.sessions).map(([name, info]) => ({ name, ...info }));

      for (const session of sessions) {
        if (!session.start || session.start === "TBD") continue;
        const start = new Date(session.start);
        const end = session.end && session.end !== "TBD" ? new Date(session.end) : start;

        if (now <= end) {
          nextSession = session;
          nextRace = { ...race, sessions };
          break;
        }
      }
      if (nextSession) break;
    }

    if (!nextSession) {
      titleEl.textContent = "다가오는 세션 없음";
      countdownEl.textContent = "";
      clearInterval(countdownInterval);
      return;
    }

    renderBasicInfo(nextRace, nextSession);
    renderSessionList(nextRace);
    startCountdown(nextSession);
  }

  // 기본 정보 렌더링
  function renderBasicInfo(race, session) {
    const flag = flags[race.location_ko || race.location] || "🏁";
    flagEl.textContent = flag;

    titleEl.textContent = race.race_name_ko || race.race_name || "다음 경기";

    if (race.circuit_image) {
      circuitImgEl.src = race.circuit_image;
      circuitImgEl.alt = race.circuit_ko || race.circuit || "Circuit";
    }
  }

  // 세션 리스트 렌더링
  function renderSessionList(race) {
    sessionListEl.innerHTML = "";

    race.sessions.forEach(s => {
      if (!s.start || s.start === "TBD") return;

      const start = new Date(s.start);
      const dateStr =
        start.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) +
        " " +
        start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

      const li = document.createElement("li");
      li.textContent = `${s.name}: ${dateStr}`;
      sessionListEl.appendChild(li);
    });
  }

  // 카운트다운
  function startCountdown(session) {
    const start = new Date(session.start);
    const end = session.end && session.end !== "TBD" ? new Date(session.end) : start;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      const now = new Date();
      let diff = start - now;

      if (diff <= 0 && now <= end) {
        countdownEl.textContent = "진행 중";
        return;
      }

      if (diff <= 0) {
        clearInterval(countdownInterval);
        renderNextRace();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff %= 1000 * 60 * 60 * 24;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff %= 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      countdownEl.textContent = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
    }, 1000);
  }

  // 토글 이벤트 (상태 유지)
  toggleBtn.addEventListener("click", () => {
    isExpanded = !isExpanded;
    detailsEl.style.display = isExpanded ? "flex" : "none";
    toggleBtn.textContent = isExpanded ? "▲ 접기" : "▼ 펼치기";
  });
});
