document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("season-select");
  const roundSelect = document.getElementById("round-select");

  const raceNameEl = document.getElementById("race-name");
  const raceDateEl = document.getElementById("race-date");
  const raceLocationEl = document.getElementById("race-location");
  const raceExtraEl = document.getElementById("race-extra");
  const raceFlagEl = document.getElementById("race-flag");
  const raceTrackEl = document.getElementById("race-track");

  const podiumUl = document.querySelector("#podium ul");
  const fullResultsTbody = document.querySelector("#full-results tbody");
  const standingsUpdateEl = document.getElementById("standings-update");

  let roundsData = [];

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
  
  /* 시즌 선택, 라운드 드롭다운 생성 */
  seasonSelect.addEventListener("change", () => {
    const season = seasonSelect.value;

    if (!season) {
      roundSelect.innerHTML = `<option value="">라운드를 선택하세요</option>`;
      document.getElementById("race-details").style.display = "none";
      return;
    }

    fetch(`./${season}_result.json`)
      .then(res => res.json())
      .then(data => {
        roundsData = data;

        roundSelect.innerHTML = `<option value="">라운드를 선택하세요</option>`;

        roundsData.forEach(round => {
          const option = document.createElement("option");
          option.value = round.round;
          option.textContent = `Round ${round.round} - ${round.race.shortName}`;
          roundSelect.appendChild(option);
        });

        // 오늘 날짜 기준 가장 최근 라운드 자동 선택
        const today = new Date();
        let defaultRound = roundsData[0].round;

        for (let i = roundsData.length - 1; i >= 0; i--) {
          const raceDate = new Date(roundsData[i].race.dateTime);
          if (raceDate <= today) {
            defaultRound = roundsData[i].round;
            break;
          }
        }

        roundSelect.value = defaultRound;
        roundSelect.dispatchEvent(new Event("change"));
      })
      .catch(err => {
        console.error("결과 JSON 로드 실패", err);
      });
  });

  /* 라운드 선택 */
  roundSelect.addEventListener("change", () => {
    const selectedRound = parseInt(roundSelect.value, 10);
    const raceData = roundsData.find(r => r.round === selectedRound);

    if (!raceData) {
      document.getElementById("race-details").style.display = "none";
      return;
    }

    document.getElementById("race-details").style.display = "block";

    /* 레이스 기본 정보 */
    raceNameEl.textContent = raceData.race.name;
    raceDateEl.textContent = `날짜: ${new Date(raceData.race.dateTime).toLocaleDateString("ko-KR")}`;
    raceLocationEl.textContent = `위치: ${raceData.race.location}`;
    raceExtraEl.textContent = raceData.extraInfo;
    raceFlagEl.textContent = raceData.race.flag;

    raceTrackEl.src = raceData.trackImage;
    raceTrackEl.alt = `${raceData.race.shortName} 트랙 이미지`;

    /* 포디움 (fullResults 상위 3명) */
    podiumUl.innerHTML = "";
    raceData.fullResults
      .filter(r => r.position <= 3)
      .forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.position}. ${p.driver} (${p.team}) - ${p.time}`;
        podiumUl.appendChild(li);
      });

    /* 전체 결과 테이블 */
    fullResultsTbody.innerHTML = "";

    raceData.fullResults.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.position}</td>
        <td>${r.driver}</td>
        <td>${r.team}</td>
        <td>${r.laps}</td>
        <td>${r.time}</td>
        <td>${r.gap ?? "-"}</td>
        <td>${r.points}</td>
        <td>${r.status}</td>
      `;
      fullResultsTbody.appendChild(tr);
    });

    /* 챔피언십 스탠딩 TOP 5 */
    standingsUpdateEl.innerHTML = "";

    const driverTitle = document.createElement("h3");
    driverTitle.textContent = "드라이버 챔피언십 TOP 5";
    standingsUpdateEl.appendChild(driverTitle);

    const driverList = document.createElement("ul");
    raceData.championshipStandings.drivers.top.forEach(d => {
      const li = document.createElement("li");
      li.textContent = `${d.position}. ${d.driver} (${d.team}) - ${d.points}점`;
      driverList.appendChild(li);
    });
    standingsUpdateEl.appendChild(driverList);

    const teamTitle = document.createElement("h3");
    teamTitle.textContent = "컨스트럭터 챔피언십 TOP 5";
    standingsUpdateEl.appendChild(teamTitle);

    const teamList = document.createElement("ul");
    raceData.championshipStandings.constructors.top.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.position}. ${t.team} - ${t.points}점`;
      teamList.appendChild(li);
    });
    standingsUpdateEl.appendChild(teamList);
  });

  /* 초기 로드 (2025) */
  seasonSelect.value = "2025";
  seasonSelect.dispatchEvent(new Event("change"));
});
