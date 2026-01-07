document.addEventListener("DOMContentLoaded", () => {
  const seasonButton = document.getElementById("season-button");
  const seasonList = document.getElementById("season-list");
  const seasonContent = document.getElementById("season-content");

  let scheduleData = [];

  const flags = {
    "호주":"🇦🇺","중국":"🇨🇳","일본":"🇯🇵","바레인":"🇧🇭","사우디아라비아":"🇸🇦",
    "마이애미":"🇺🇸","캐나다":"🇨🇦","모나코":"🇲🇨","스페인":"🇪🇸","오스트리아":"🇦🇹",
    "영국":"🇬🇧","벨기에":"🇧🇪","헝가리":"🇭🇺","네덜란드":"🇳🇱","이탈리아":"🇮🇹",
    "아제르바이잔":"🇦🇿","싱가포르":"🇸🇬","미국":"🇺🇸","멕시코":"🇲🇽","브라질":"🇧🇷",
    "라스베이거스":"🇺🇸","카타르":"🇶🇦","아랍에미리트":"🇦🇪","아부다비":"🇦🇪"
  };

  /* ---------------- 데이터 로드 ---------------- */
  Promise.all([
    fetch("/F1/data/2025_schedule.json").then(r => r.json()),
    fetch("/F1/data/2026_schedule.json").then(r => r.json())
  ])
    .then(([data2025, data2026]) => {
      scheduleData = [...data2025, ...data2026];

      const seasons = [...new Set(scheduleData.map(r => r.season))].sort();
      renderSeasonList(seasons);
      renderSeason(seasons[0]);
    })
    .catch(err => {
      console.error(err);
      seasonContent.textContent = "데이터를 불러오지 못했습니다.";
    });

  /* ---------------- 시즌 드롭다운 ---------------- */
  function renderSeasonList(seasons) {
    seasonList.innerHTML = "";

    seasons.forEach(season => {
      const li = document.createElement("li");
      li.textContent = `${season} 시즌`;

      li.addEventListener("click", () => {
        renderSeason(season);
        seasonButton.textContent = `${season} 시즌 ▼`;
        seasonList.style.display = "none";
      });

      seasonList.appendChild(li);
    });

    seasonButton.addEventListener("click", () => {
      seasonList.style.display =
        seasonList.style.display === "block" ? "none" : "block";
    });
  }

  /* ---------------- 시즌별 렌더 ---------------- */
  function renderSeason(season) {
    seasonContent.innerHTML = "";

    scheduleData
      .filter(r => r.season === season)
      .forEach(race => {
        const raceBar = document.createElement("div");
        raceBar.className = "race-bar";

        /* ---------- 날짜 계산 (핵심 수정 부분) ---------- */
        const startStr =
          race.sessions?.[0]?.start || race.sessions?.[0]?.start_date;
        const endStr =
          race.sessions?.at(-1)?.end || race.sessions?.at(-1)?.end_date;

        const start = startStr ? new Date(startStr) : null;
        const end = endStr ? new Date(endStr) : null;

        /* ---------- 왼쪽 ---------- */
        const left = document.createElement("div");
        left.className = "race-left";

        const roundDate = document.createElement("div");
        roundDate.className = "round-date";
        roundDate.textContent = `Round ${race.round} (${
          start && end && !isNaN(start) && !isNaN(end)
            ? `${start.getMonth() + 1}/${start.getDate()}~${end.getMonth() + 1}/${end.getDate()}`
            : "TBD"
        })`;

        const flagDiv = document.createElement("div");
        flagDiv.className = "flag";
        const countryFlag = flags[race.location] || "🏁";
        flagDiv.innerHTML = window.twemoji
          ? twemoji.parse(countryFlag)
          : countryFlag;

        const locationDiv = document.createElement("div");
        locationDiv.className = "location";
        locationDiv.textContent = `${race.location}, ${race.city || ""}`;

        left.append(roundDate, flagDiv, locationDiv);

        /* ---------- 오른쪽 ---------- */
        const right = document.createElement("div");
        right.className = "race-right";

        const raceName = document.createElement("div");
        raceName.className = "race-name";
        raceName.textContent = race.race_name;

        const circuit = document.createElement("div");
        circuit.className = "circuit";
        circuit.textContent = race.circuit;

        right.append(raceName, circuit);

        /* ---------- 세션 ---------- */
        const sessionList = document.createElement("div");
        sessionList.className = "session-list";

        race.sessions.forEach(s => {
          const sDiv = document.createElement("div");
          sDiv.className = "session-item";

          const sessionStart = s.start || s.start_date;
          sDiv.textContent = `${s.name}: ${
            sessionStart && !isNaN(new Date(sessionStart))
              ? new Date(sessionStart).toLocaleString()
              : "TBD"
          }`;

          sessionList.appendChild(sDiv);
        });

        raceBar.addEventListener("click", () => {
          sessionList.classList.toggle("open");
        });

        raceBar.append(left, right, sessionList);
        seasonContent.appendChild(raceBar);
      });
  }
});
