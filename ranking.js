// 드라이버 순위 데이터
const drivers = [
  { rank: 1, name: "오스카 피아스트리", team: "맥라렌", points: 346 },
  { rank: 2, name: "랜도 노리스", team: "맥라렌", points: 332 },
  { rank: 3, name: "막스 베르스타펜", team: "레드불 레이싱", points: 306 },
  { rank: 4, name: "조지 러셀", team: "메르세데스", points: 252 },
  { rank: 5, name: "샤를 르클레르", team: "페라리", points: 192 },
  { rank: 6, name: "루이스 해밀턴", team: "페라리", points: 142 },
  { rank: 7, name: "안드레아 키미 안토넬리", team: "메르세데스", points: 89 },
  { rank: 8, name: "알렉산더 알본", team: "윌리엄스", points: 73 },
  { rank: 9, name: "니코 휠켄베르크", team: "킥 자우버", points: 41 },
  { rank: 10, name: "아이작 하자르", team: "레이싱 불스", points: 39 },
  { rank: 11, name: "카를로스 사인츠", team: "윌리엄스", points: 38 },
  { rank: 12, name: "페르난도 알론소", team: "애스턴 마틴 아람코", points: 37 },
  { rank: 13, name: "랜스 스트롤", team: "애스턴 마틴 아람코", points: 32 },
  { rank: 14, name: "리암 로슨", team: "레이싱 불스", points: 30 },
  { rank: 15, name: "에스테반 오콘", team: "하스", points: 28 },
  { rank: 16, name: "츠노다 유키", team: "레드불 레이싱", points: 28 },
  { rank: 17, name: "피에르 가슬리", team: "알핀", points: 20 },
  { rank: 18, name: "올리버 베어먼", team: "하스", points: 20 },
  { rank: 19, name: "가브리에우 보르툴레투", team: "킥 자우버", points: 18 },
  { rank: 20, name: "프랑코 콜라핀토", team: "알핀", points: 0 },
  { rank: 21, name: "잭 두한", team: "알핀", points: 0 }
];

// 컨스트럭터 순위 데이터
const constructors = [
  { rank: 1, team: "맥라렌", drivers: "피아스트리 / 노리스", points: 678 },
  { rank: 2, team: "메르세데스", drivers: "러셀 / 안토넬리", points: 341 },
  { rank: 3, team: "페라리", drivers: "르클레르 / 해밀턴", points: 334 },
  { rank: 4, team: "레드불 레이싱", drivers: "베르스타펜 / 츠노다", points: 331 },
  { rank: 5, team: "윌리엄스", drivers: "알본 / 사인츠", points: 111 },
  { rank: 6, team: "레이싱 불스", drivers: "하자르 / 로슨", points: 72 },
  { rank: 7, team: "애스턴 마틴 아람코", drivers: "스트롤 / 알론소", points: 69 },
  { rank: 8, team: "킥 자우버", drivers: "휠켄베르크 / 보르툴레투", points: 59 },
  { rank: 9, team: "하스", drivers: "오콘 / 베어먼", points: 48 },
  { rank: 10, team: "알핀", drivers: "가슬리 / 콜라핀토", points: 20 }
];

// 테이블 채우기 함수
function populateTable(data, tableId) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  data.forEach(item => {
    const tr = document.createElement("tr");
    if (tableId === "drivers-table") {
      tr.innerHTML = `<td>${item.rank}</td><td>${item.name}</td><td>${item.team}</td><td>${item.points}</td>`;
    } else if (tableId === "constructors-table") {
      tr.innerHTML = `<td>${item.rank}</td><td>${item.team}</td><td>${item.drivers}</td><td>${item.points}</td>`;
    }
    tbody.appendChild(tr);
  });
}

// 페이지 로드 시 테이블 채우기
window.addEventListener("DOMContentLoaded", () => {
  populateTable(drivers, "drivers-table");
  populateTable(constructors, "constructors-table");
});
