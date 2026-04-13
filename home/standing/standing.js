document.addEventListener("DOMContentLoaded", () => {
  fetch(`${BASE_PATH}/ranking/season/2026.json`)
    .then(res => res.json())
    .then(data => {
      const driverTop3 = data.drivers.slice(0, 3).map(d => ({
        name: d.name,
        points: d.points,
        img: `${BASE_PATH}/images/home/standing/driver/${d.name}.png`
      }));

      const constructorTop3 = data.teams.slice(0, 3).map(t => ({
        name: t.team,
        points: t.points,
        img: `${BASE_PATH}/images/home/standing/constructor/${t.team}.jpg`
      }));

      window._standingData = { driver: driverTop3, constructor: constructorTop3 };

      renderPodium("driver");

      document.querySelectorAll(".standing-tabs .tab").forEach(tab => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".standing-tabs .tab").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          renderPodium(tab.dataset.type);
        });
      });
    })
    .catch(err => console.error("Standing data load error:", err));
});

function renderPodium(type) {
  const container = document.getElementById("podium-container");
  container.innerHTML = "";

  const data = window._standingData?.[type];
  if (!data) return;

  data.forEach((item, index) => {
    const slide = document.createElement("div");
    slide.className = `podium-card rank-${index + 1}`;
    slide.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="podium-name">${item.name}</div>
      <div class="podium-points">${item.points} pts</div>
    `;
    container.appendChild(slide);
  });
}
