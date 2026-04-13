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
    "라스베이거스":"🇺🇸","카타르":"🇶🇦","아랍에미리트": "🇦🇪", "아부다비":"🇦🇪"
  };

  // --- 데이터 로드 ---
  Promise.all([
    fetch(`${BASE_PATH}/data/2025_schedule.json`).then(r => r.json()),
    fetch(`${BASE_PATH}/data/2026_schedule.json`).then(r => r.json())
  ])
  .then(([data2025, data2026]) => {
    scheduleData = [...data2025, ...data2026];

    const seasons = [...new Set(scheduleData.map(r => r.season))].sort();

    const defaultSeason = seasons.at(-1); // 가장 최신 시즌 (2026)

    renderSeasonList(seasons);
    renderSeason(defaultSeason);
    seasonButton.textContent = `${defaultSeason} 시즌 ▼`;
  })
  .catch(() => {
    seasonContent.textContent = "데이터를 불러오지 못했습니다.";
  });

  // --- 시즌 드롭다운 렌더 ---
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

  // --- 시즌별 레이스 렌더 ---
  function renderSeason(season) {
    seasonContent.innerHTML = "";

    scheduleData
      .filter(r => r.season === season)
      .forEach(race => {
        const raceBar = document.createElement("div");
        raceBar.className = "race-bar";

        // ----- 왼쪽 정보 -----
        const left = document.createElement("div");
        left.className = "race-left";

        const start =
          race.sessions[0].start !== "TBD"
            ? new Date(race.sessions[0].start)
            : null;

        const end =
          race.sessions.at(-1).end !== "TBD"
            ? new Date(race.sessions.at(-1).end)
            : null;

        const roundDate = document.createElement("div");
        roundDate.className = "round-date";
        roundDate.textContent = `Round ${race.round} (${
          start && end
            ? `${start.getMonth() + 1}/${start.getDate()}~${
                end.getMonth() + 1
              }/${end.getDate()}`
            : "TBD"
        })`;

        const flagDiv = document.createElement("div");
        flagDiv.className = "flag";
        const countryFlag = race.flag || flags[race.location_ko || race.location] || "🏁";
        flagDiv.innerHTML = window.twemoji
          ? twemoji.parse(countryFlag)
          : countryFlag;

        const locationDiv = document.createElement("div");
        locationDiv.className = "location";
        locationDiv.textContent = `${race.location_ko || race.location}, ${
          race.city || ""
        }`;

        left.append(roundDate, flagDiv, locationDiv);

        // ----- 오른쪽 정보 -----
        const right = document.createElement("div");
        right.className = "race-right";

        const raceName = document.createElement("div");
        raceName.className = "race-name";
        raceName.textContent = race.race_name_ko || race.race_name;

        const circuit = document.createElement("div");
        circuit.className = "circuit";
        circuit.textContent = race.circuit;

        right.append(raceName, circuit);

        // ----- 세션 리스트 -----
        const sessionList = document.createElement("div");
        sessionList.className = "session-list";

        race.sessions.forEach(s => {
          const sDiv = document.createElement("div");
          sDiv.className = "session-item";

          sDiv.textContent = `${s.name}: ${
            s.start && s.start !== "TBD"
              ? new Date(s.start).toLocaleString()
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