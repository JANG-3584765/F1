const schedule = [
  { round: "TESTING", location: "Sakhir", title: "FORMULA 1 ARAMCO PRE-SEASON TESTING 2025", date: "26 - 28 Feb" },
  { round: 1, location: "Australia", title: "FORMULA 1 LOUIS VUITTON AUSTRALIAN GRAND PRIX 2025", date: "14 - 16 Mar", results: [ { pos: 1, driver: "NOR", time: "1:42:06.304" }, { pos: 2, driver: "VER", gap: "+0.895" }, { pos: 3, driver: "RUS", gap: "+8.481" } ] },
  { round: 2, location: "China", title: "FORMULA 1 HEINEKEN CHINESE GRAND PRIX 2025", date: "21 - 23 Mar", results: [ { pos: 1, driver: "PIA", time: "1:30:55.026" }, { pos: 2, driver: "NOR", gap: "+9.748" }, { pos: 3, driver: "RUS", gap: "+11.097" } ] },
  { round: 3, location: "Japan", title: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2025", date: "04 - 06 Apr", results: [ { pos: 1, driver: "VER", time: "1:22:06.983" }, { pos: 2, driver: "NOR", gap: "+1.423" }, { pos: 3, driver: "PIA", gap: "+2.129" } ] },
  { round: 4, location: "Bahrain", title: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2025", date: "11 - 13 Apr", results: [ { pos: 1, driver: "PIA", time: "1:35:39.435" }, { pos: 2, driver: "RUS", gap: "+15.499" }, { pos: 3, driver: "NOR", gap: "+16.273" } ] },
  { round: 5, location: "Saudi Arabia", title: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2025", date: "18 - 20 Apr", results: [ { pos: 1, driver: "PIA", time: "1:21:06.758" }, { pos: 2, driver: "VER", gap: "+2.843" }, { pos: 3, driver: "LEC", gap: "+8.104" } ] },
  { round: 6, location: "Miami", title: "FORMULA 1 CRYPTO.COM MIAMI GRAND PRIX 2025", date: "02 - 04 May", results: [ { pos: 1, driver: "PIA", time: "1:28:51.587" }, { pos: 2, driver: "NOR", gap: "+4.63" }, { pos: 3, driver: "RUS", gap: "+37.644" } ] },
  { round: 7, location: "Emilia-Romagna", title: "FORMULA 1 AWS GRAN PREMIO DEL MADE IN ITALY E DELL'EMILIA-ROMAGNA 2025", date: "16 - 18 May", results: [ { pos: 1, driver: "VER", time: "1:31:33.199" }, { pos: 2, driver: "NOR", gap: "+6.109" }, { pos: 3, driver: "PIA", gap: "+12.956" } ] },
  { round: 8, location: "Monaco", title: "FORMULA 1 TAG HEUER GRAND PRIX DE MONACO 2025", date: "23 - 25 May", results: [ { pos: 1, driver: "NOR", time: "1:40:33.843" }, { pos: 2, driver: "LEC", gap: "+3.131" }, { pos: 3, driver: "PIA", gap: "+3.658" } ] },
  { round: 9, location: "Spain", title: "FORMULA 1 ARAMCO GRAN PREMIO DE ESPAÑA 2025", date: "30 May - 01 Jun", results: [ { pos: 1, driver: "PIA", time: "1:32:57.375" }, { pos: 2, driver: "NOR", gap: "+2.471" }, { pos: 3, driver: "LEC", gap: "+10.455" } ] },
  { round: 10, location: "Canada", title: "FORMULA 1 PIRELLI GRAND PRIX DU CANADA 2025", date: "13 - 15 Jun", results: [ { pos: 1, driver: "RUS", time: "1:31:52.688" }, { pos: 2, driver: "VER", gap: "+0.228" }, { pos: 3, driver: "ANT", gap: "+1.014" } ] },
  { round: 11, location: "Austria", title: "FORMULA 1 MSC CRUISES AUSTRIAN GRAND PRIX 2025", date: "27 - 29 Jun", results: [ { pos: 1, driver: "NOR", time: "1:23:47.693" }, { pos: 2, driver: "PIA", gap: "+2.695" }, { pos: 3, driver: "LEC", gap: "+19.82" } ] },
  { round: 12, location: "Great Britain", title: "FORMULA 1 QATAR AIRWAYS BRITISH GRAND PRIX 2025", date: "04 - 06 Jul", results: [ { pos: 1, driver: "NOR", time: "1:37:15.735" }, { pos: 2, driver: "PIA", gap: "+6.812" }, { pos: 3, driver: "HUL", gap: "+34.742" } ] },
  { round: 13, location: "Belgium", title: "FORMULA 1 MOËT & CHANDON BELGIAN GRAND PRIX 2025", date: "25 - 27 Jul", results: [ { pos: 1, driver: "PIA", time: "1:25:22.601" }, { pos: 2, driver: "NOR", gap: "+3.415" }, { pos: 3, driver: "LEC", gap: "+20.185" } ] },
  { round: 14, location: "Hungary", title: "FORMULA 1 LENOVO HUNGARIAN GRAND PRIX 2025", date: "01 - 03 Aug", results: [ { pos: 1, driver: "NOR", time: "1:35:21.231" }, { pos: 2, driver: "PIA", gap: "+0.698" }, { pos: 3, driver: "RUS", gap: "+21.916" } ] },
  { round: 15, location: "Netherlands", title: "FORMULA 1 HEINEKEN DUTCH GRAND PRIX 2025", date: "29 - 31 Aug", results: [ { pos: 1, driver: "PIA", time: "1:38:29.849" }, { pos: 2, driver: "VER", gap: "+1.271" }, { pos: 3, driver: "HAD", gap: "+3.233" } ] },
  { round: 16, location: "Italy", title: "FORMULA 1 PIRELLI GRAN PREMIO D’ITALIA 2025", date: "05 - 07 Sep", results: [ { pos: 1, driver: "VER", time: "1:13:24.325" }, { pos: 2, driver: "NOR", gap: "+19.207" }, { pos: 3, driver: "PIA", gap: "+21.351" } ] },
  { round: 17, location: "Azerbaijan", title: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2025", date: "19 - 21 Sep", results: [ { pos: 1, driver: "VER", time: "1:33:26.408" }, { pos: 2, driver: "RUS", gap: "+14.609" }, { pos: 3, driver: "SAI", gap: "+19.199" } ] },
  { round: 18, location: "Singapore", title: "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2025", date: "03 - 05 Oct", results: [ { pos: 1, driver: "RUS", time: "1:40:22.367" }, { pos: 2, driver: "VER", gap: "+5.43" }, { pos: 3, driver: "NOR", gap: "+6.066" } ] },
  { round: 19, location: "United States", title: "FORMULA 1 MSC CRUISES UNITED STATES GRAND PRIX 2025", date: "17 - 19 Oct", results: [ { pos: 1, driver: "VER", time: "1:34:00.161" }, { pos: 2, driver: "NOR", gap: "+7.959" }, { pos: 3, driver: "LEC", gap: "+15.373" } ] },
  { round: 20, location: "Mexico", title: "FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2025", date: "24 - 26 Oct" },
  { round: 21, location: "Brazil", title: "FORMULA 1 MSC CRUISES GRANDE PRÊMIO DE SÃO PAULO 2025", date: "07 - 09 Nov" },
  { round: 22, location: "Las Vegas", title: "FORMULA 1 HEINEKEN LAS VEGAS GRAND PRIX 2025", date: "20 - 22 Nov" },
  { round: 23, location: "Qatar", title: "FORMULA 1 QATAR AIRWAYS QATAR GRAND PRIX 2025", date: "28 - 30 Nov" },
  { round: 24, location: "Abu Dhabi", title: "FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2025", date: "05 - 07 Dec" }
];

const container = document.getElementById("schedule-container");

schedule.forEach((race) => {
  const card = document.createElement("div");
  card.className = "schedule-card";

  card.innerHTML = `
    <h2>${race.round === "TESTING" ? "TESTING" : `ROUND ${race.round}`}</h2>
    <h3>${race.location}</h3>
    <p>${race.title}</p>
    <p><strong>${race.date}</strong></p>
    ${
      race.results
        ? `<div class="results">
            ${race.results
              .map(
                (r) =>
                  `<div>${r.pos}위: ${r.driver} ${
                    r.time ? `(${r.time})` : `${r.gap}`
                  }</div>`
              )
              .join("")}
          </div>`
        : ""
    }
  `;

  container.appendChild(card);
});
