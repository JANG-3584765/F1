// 예시 경기 데이터 (schedule.js와 연동 가능)
const races = [
  { round: 1, location: "Australia", title: "AUSTRALIAN GP 2025", date: "14-16 Mar", drivers: ["NOR", "VER", "RUS", "PIA", "LEC"] },
  { round: 2, location: "China", title: "CHINESE GP 2025", date: "21-23 Mar", drivers: ["PIA", "NOR", "RUS", "VER", "LEC"] },
  { round: 3, location: "Japan", title: "JAPANESE GP 2025", date: "04-06 Apr", drivers: ["VER", "NOR", "PIA", "RUS", "LEC"] }
  // 나머지 라운드도 추가 가능
];

const predictionList = document.getElementById("prediction-list");

races.forEach(race => {
  const card = document.createElement("div");
  card.classList.add("prediction-card");
  card.innerHTML = `
    <h2>${race.title}</h2>
    <p>${race.date} | ${race.location}</p>
    <form data-round="${race.round}">
      <label>1위:
        <select name="first" required>
          <option value="">선택</option>
          ${race.drivers.map(d => `<option value="${d}">${d}</option>`).join("")}
        </select>
      </label>
      <label>2위:
        <select name="second" required>
          <option value="">선택</option>
          ${race.drivers.map(d => `<option value="${d}">${d}</option>`).join("")}
        </select>
      </label>
      <label>3위:
        <select name="third" required>
          <option value="">선택</option>
          ${race.drivers.map(d => `<option value="${d}">${d}</option>`).join("")}
        </select>
      </label>
      <button type="submit">제출</button>
    </form>
    <p class="prediction-result"></p>
  `;

  // 제출 이벤트
  const form = card.querySelector("form");
  const result = card.querySelector(".prediction-result");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const first = form.first.value;
    const second = form.second.value;
    const third = form.third.value;

    result.textContent = `예측 제출 완료: 1위 ${first}, 2위 ${second}, 3위 ${third}`;
  });

  predictionList.appendChild(card);
});
