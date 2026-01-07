document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("season-select");
  const roundSelect = document.getElementById("round-select");
  const raceNameEl = document.getElementById("race-name");
  const raceDateEl = document.getElementById("race-date");
  const raceLocationEl = document.getElementById("race-location");
  const raceTrackEl = document.getElementById("race-track");
  const podiumUl = document.querySelector("#podium ul");
  const fullResultsTbody = document.querySelector("#full-results tbody");
  const standingsUpdateEl = document.getElementById("standings-update");

  let roundsData = [];

  // 시즌 선택 이벤트
  seasonSelect.addEventListener("change", () => {
    const season = seasonSelect.value;
    if (!season) {
      roundSelect.innerHTML = '<option value="">라운드를 선택하세요</option>';
      document.getElementById("race-details").style.display = "none";
      return;
    }

    // 해당 시즌 JSON 불러오기
    fetch(`${season}_result.json`)
      .then(res => res.json())
      .then(data => {
        roundsData = data.rounds;

        // 라운드 드롭다운 초기화
        roundSelect.innerHTML = '<option value="">라운드를 선택하세요</option>';

        roundsData.forEach(round => {
          const option = document.createElement("option");
          option.value = round.round;
          option.textContent = `Round ${round.round} - ${round.raceName}`;
          roundSelect.appendChild(option);
        });

        // 오늘 날짜 기준 가장 최근/다음 라운드 선택
        const today = new Date();
        let defaultRound = roundsData[0].round;
        for (let i = roundsData.length - 1; i >= 0; i--) {
          const raceDate = new Date(roundsData[i].dateTime);
          if (raceDate <= today) {
            defaultRound = roundsData[i].round;
            break;
          }
        }

        roundSelect.value = defaultRound;
        roundSelect.dispatchEvent(new Event("change"));
      });
  });

  // 라운드 선택 이벤트
  roundSelect.addEventListener("change", () => {
    const selectedRound = parseInt(roundSelect.value);
    const race = roundsData.find(r => r.round === selectedRound);

    if (!race) {
      document.getElementById("race-details").style.display = "none";
      return;
    }

    document.getElementById("race-details").style.display = "block";

    raceNameEl.textContent = race.raceName;
    raceDateEl.textContent = `날짜: ${race.date}`;
    raceLocationEl.textContent = `위치: ${race.location}`;
    raceTrackEl.src = race.trackImage;
    raceTrackEl.alt = `${race.raceName} 트랙 이미지`;

    // 포디움 채우기
    podiumUl.innerHTML = "";
    race.podium.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.position}. ${p.driver} (${p.team}) - ${p.time} / ${p.points}점`;
      podiumUl.appendChild(li);
    });

    // 전체 결과 채우기
    fullResultsTbody.innerHTML = "";
    race.fullResults.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.position}</td>
        <td>${r.driver}</td>
        <td>${r.team}</td>
        <td>${r.laps}</td>
        <td>${r.time}</td>
        <td>${r.points}</td>
      `;
      fullResultsTbody.appendChild(tr);
    });

    // 스탠딩 업데이트
    standingsUpdateEl.innerHTML = "<h3>스탠딩 업데이트</h3>";
    const driversUpdate = document.createElement("p");
    driversUpdate.textContent = "드라이버: " + race.standingsUpdate.drivers.map(d => `${d.driver}(${d.position}, ${d.change >=0 ? "+"+d.change : d.change})`).join(", ");
    const teamsUpdate = document.createElement("p");
    teamsUpdate.textContent = "팀: " + race.standingsUpdate.teams.map(t => `${t.team}(${t.position}, ${t.change >=0 ? "+"+t.change : t.change})`).join(", ");
    standingsUpdateEl.appendChild(driversUpdate);
    standingsUpdateEl.appendChild(teamsUpdate);
  });

  // 페이지 로드 시 기본 시즌 선택 (2025)
  seasonSelect.value = "2025";
  seasonSelect.dispatchEvent(new Event("change"));
});