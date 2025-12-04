document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("next-race-box");
  const flagEl = document.getElementById("race-flag");
  const timerEl = document.getElementById("race-timer");
  const imgEl = document.getElementById("race-img");
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

  // 2025, 2026 시즌 JSON 모두 불러오기
  Promise.all([
    fetch("/data/2025_schedule.json").then(res => res.json()),
    fetch("/data/2026_schedule.json").then(res => res.json())
  ])
  .then(([data2025, data2026]) => {
    scheduleData = [...data2025, ...data2026];
    updateNextRace();
    setInterval(updateNextRace, 60000); // 1분마다 갱신
  })
  .catch(err => {
    console.error(err);
    box.innerHTML = "<p>데이터를 불러오는 데 실패했습니다.</p>";
  });

  function updateNextRace() {
    if (!scheduleData.length) return;

    const now = new Date();
    let nextSession = null;
    let nextRace = null;

    // 다음 세션 찾기
    for (const race of scheduleData) {
      for (const session of race.sessions) {
        if (session.start_date === "TBD") continue;
        const start = new Date(session.start_date);
        const end = session.end_date && session.end_date !== "TBD" ? new Date(session.end_date) : start;
        if (now <= end) {
          nextSession = session;
          nextRace = race;
          break;
        }
      }
      if (nextSession) break;
    }

    if (!nextSession) {
      imgEl.src = "./images/placeholder.jpg";
      flagEl.textContent = "🏁";
      timerEl.textContent = "다가오는 세션이 없습니다.";
      clearInterval(countdownInterval);
      return;
    }

    const raceStart = new Date(nextSession.start_date);
    const raceEnd = nextSession.end_date && nextSession.end_date !== "TBD" ? new Date(nextSession.end_date) : raceStart;
    const flagEmoji = flags[nextRace.location_ko || nextRace.location] || "🏁";

    // 이미지, 국기 업데이트
    imgEl.src = nextRace.img; // JSON에 img 속성 필요
    flagEl.textContent = flagEmoji;

    // Twemoji 적용 (필요 시)
    if (window.twemoji) requestAnimationFrame(() => twemoji.parse(flagEl));

    // 기존 타이머 제거
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      const now = new Date();
      let diff = raceStart - now;

      if (diff <= 0 && now <= raceEnd) {
        timerEl.textContent = "진행 중";
        return;
      } else if (diff <= 0) {
        clearInterval(countdownInterval);
        updateNextRace();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * 1000 * 60 * 60 * 24;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * 1000 * 60;
      const seconds = Math.floor(diff / 1000);

      timerEl.textContent = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
    }, 1000);
  }
});
