const driverTop3 = [
  { name: "막스 베르스타펜", points: 421, img: "./images/home/standing/driver/막스 베르스타펜.png" },
  { name: "랜도 노리스", points: 423, img: "./images/home/standing/driver/랜도 노리스.png" },
  { name: "오스카 피아스트리", points: 410, img: "./images/home/standing/driver/오스카 피아스트리.png" }
];

const constructorTop3 = [
  { name: "메르세데스", points: 469, img: "./images/home/standing/constructor/메르세데스.jpg" },
  { name: "맥라렌", points: 833, img: "./images/home/standing/constructor/맥라렌.jpg" },
  { name: "레드불", points: 451, img: "./images/home/standing/constructor/레드불 레이싱.jpg" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderPodium("driver");

  document.querySelectorAll(".standing-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".standing-tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderPodium(tab.dataset.type);
    });
  });
});

function renderPodium(type) {
  const container = document.getElementById("podium-container");
  container.innerHTML = "";

  const data = type === "driver" ? driverTop3 : constructorTop3;

  data.forEach((item, index) => {
    const slide = document.createElement("div");
    slide.className = `podium-card rank-${index+1}`;
    slide.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="podium-name">${item.name}</div>
      <div class="podium-points">${item.points} pts</div>
    `;
    container.appendChild(slide);
  });
}