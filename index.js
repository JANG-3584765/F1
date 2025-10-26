const raceSchedule = [
  { round: 20, name: "Mexico", circuit: "Autódromo Hermanos Rodríguez", date: "2025-10-24", image: "images/에르노마스로드리게스.png" },
  { round: 21, name: "Brazil", circuit: "Interlagos", date: "2025-11-07", image: "images/상파울루.png" },
  { round: 22, name: "Las Vegas", circuit: "Las Vegas Strip Circuit", date: "2025-11-20", image: "images/라스베가스.png" },
  { round: 23, name: "Qatar", circuit: "Lusail International Circuit", date: "2025-11-28", image: "images/카타르.png" },
  { round: 24, name: "Abu Dhabi", circuit: "Yas Marina Circuit", date: "2025-12-05", image: "images/아부다비.png" }
];

const today = new Date();
const nextRace = raceSchedule.find(race => new Date(race.date) > today);
const section = document.getElementById("next-race");

if (nextRace) {
  section.innerHTML = `
    <h2>🏁 Coming Up Next</h2>
    <h3>ROUND ${nextRace.round} - ${nextRace.name} GP</h3>
    <p>${nextRace.circuit}</p>
    <p>📅 ${new Date(nextRace.date).toLocaleDateString('ko-KR')} 개막</p>
    <img src="${nextRace.image}" alt="${nextRace.name} Circuit">
  `;
} else {
  section.innerHTML = `
    <h2>🏁 The 2025 Season Has Ended</h2>
    <p>See you next year!</p>
  `;
}
