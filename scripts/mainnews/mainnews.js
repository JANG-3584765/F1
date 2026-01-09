// STEP 1: 데이터 로딩 + id 기준 정렬 검증
document.addEventListener("DOMContentLoaded", () => {
  fetch("/F1/scripts/mainnews/mainnews.json")
    .then(res => {
      if (!res.ok) {
        throw new Error("JSON fetch 실패");
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("❌ data가 배열이 아님", data);
        return;
      }

      // id 오름차순 정렬 (1 → 5)
      const sortedById = [...data].sort((a, b) => a.id - b.id);

      console.log("mainnews.json 원본 데이터");
      console.table(data);

      console.log("id 기준 정렬 데이터 (1 → 5)");
      console.table(sortedById);

      console.log("총 기사 개수:", sortedById.length);
    })
    .catch(err => {
      console.error("메인 뉴스 STEP 1 오류:", err);
    });
});
