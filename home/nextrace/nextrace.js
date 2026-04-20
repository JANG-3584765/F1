function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("next-race-box");

  let scheduleData = [];
  let countdownInterval;

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

  // 펼치기 버튼 이벤트 위임 (renderNextRace 재호출 시에도 단 1회 등록)
  box.addEventListener("click", e => {
    const btn = e.target.closest(".toggle-details-btn");
    if (!btn) return;
    const details = box.querySelector(".next-race-details");
    const isClosed = details.style.display === "none";
    details.style.display = isClosed ? "flex" : "none";
    btn.textContent = isClosed ? "▲ 접기" : "▼ 펼치기";
  });

  Promise.all([
    fetch(`${BASE_PATH}/data/2025_schedule.json`).then(res => res.json()),
    fetch(`${BASE_PATH}/data/2026_schedule.json`).then(res => res.json())
  ])
    .then(([data2025, data2026]) => {
      scheduleData = [...data2025, ...data2026];
      renderNextRace();
      setInterval(renderNextRace, 600000); // 10분마다 갱신
    })
    .catch(err => {
      console.error(err);
      box.innerHTML = "<p>데이터를 불러오는 데 실패했습니다.</p>";
    });

  function renderNextRace() {
    if (!scheduleData.length) return;

    const now = new Date();
    let nextSession = null;
    let nextRace = null;

    // 다음 세션 찾기
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
          // sessions가 object였을 경우를 대비해 표준 배열로 붙여서 사용
          nextRace = { ...race, sessions };
          break;
        }
      }
      if (nextSession) break;
    }

    if (!nextSession || !nextRace) {
      box.innerHTML = "<p>다가오는 세션이 없습니다.</p>";
      clearInterval(countdownInterval);
      return;
    }

    const raceStart = new Date(nextSession.start);
    const raceEnd =
      nextSession.end && nextSession.end !== "TBD" ? new Date(nextSession.end) : raceStart;

    // flag가 데이터에 있으면 우선 사용, 없으면 location 기반 fallback
    const flagEmoji =
      nextRace.flag ||
      flags[nextRace.location_ko || nextRace.location] ||
      "🏁";

    box.innerHTML = `
      <div class="next-race-header">
        <span class="flag">${flagEmoji}</span>
        <div class="race-countdown">로딩 중...</div>
        <button class="toggle-details-btn">▼ 펼치기</button>
      </div>

      <div class="next-race-details" style="display: none;">
        <div class="circuit-img">
          <img src="${escapeHtml(nextRace.circuit_image || "")}" alt="Circuit" />
          <div class="circuit-name">${escapeHtml(nextRace.circuit_ko || nextRace.circuit || "서킷 정보 없음")}</div>
        </div>

        <div class="race-info">
          <h3 class="race-title">${escapeHtml(nextRace.race_name_ko || nextRace.race_name)}</h3>
          <ul class="session-list">
            ${nextRace.sessions
              .filter(s => s && s.start && s.start !== "TBD")
              .map(s => {
                const start = new Date(s.start);
                const startStr =
                  start.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) +
                  " " +
                  start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

                return `
                  <li>
                    <span class="session-name">${escapeHtml(s.name)}</span>
                    <span class="session-time">${startStr}</span>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </div>
      </div>
    `;

    // Twemoji 적용
    if (window.twemoji) requestAnimationFrame(() => twemoji.parse(box));

    // 카운트다운
    const countdownEl = box.querySelector(".race-countdown");
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      const now = new Date();
      let diff = raceStart - now;

      if (diff <= 0 && now <= raceEnd) {
        countdownEl.textContent = "진행 중";
        return;
      }

      if (diff <= 0) {
        clearInterval(countdownInterval);
        renderNextRace();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * 1000 * 60 * 60 * 24;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * 1000 * 60;
      const seconds = Math.floor(diff / 1000);

      countdownEl.textContent = `${days}일  ${hours} : ${minutes} : ${seconds}`;
    }, 1000);
  }
});
