// news_generate.js (Node.js용)
// 실행: node news_generate.js

const fs = require('fs');

const sources = [
  { sourceClass: "official",  source: "Formula1.com" },
  { sourceClass: "media",     source: "Autosport" },
  { sourceClass: "reporter",  source: "Albert Fabrega" },
  { sourceClass: "rumor",     source: "F1 Gossip X" }
];

const titles = [
  "팀 A, 새로운 공력 패키지 공개",
  "드라이버 B, 다음 시즌 계약 조건 논의 중",
  "FIA, 경기 규정 일부 조항 수정 발표",
  "팀 C, 파워유닛 업그레이드 계획 유출",
  "드라이버 D, 예선 페이스 상승 원인 분석",
  "스프린트 레이스 형식 변경 가능성 제기",
  "팀 E, 리어윙 실험적 디자인 시험"
];

const summaries = [
  "관계자들은 이번 업데이트가 다음 경기에서 큰 효과를 보일 것이라고 전망했다.",
  "여러 언론에서 이 움직임을 주의 깊게 지켜보고 있다.",
  "이번 발표는 시즌 중반 전략에 중요한 영향을 줄 것으로 보인다.",
  "테스트 결과에 따라 추가 개선이 이루어질 수 있다.",
  "아직 공식 확인은 없지만, 패독 내부에서 여러 말이 오가고 있다."
];

const tagsPool = ["team", "driver", "tech", "reg", "rumor"];
const cardTypes = ["analysis", "short"];

// YYYY-MM-DD 랜덤 날짜 생성
function randomDate() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  const t = new Date(start + Math.random() * (end - start));
  return t.toISOString();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNews(count = 20) {
  const list = [];

  for (let i = 1; i <= count; i++) {
    const src = pick(sources);

    list.push({
      id: i,
      sourceClass: src.sourceClass,
      source: src.source,
      title: pick(titles),
      image: `https://picsum.photos/800/450?random=${i}`,
      summary: pick(summaries),
      tags: [pick(tagsPool), pick(tagsPool)],
      pubDate: randomDate(),
      confidence: Math.random().toFixed(2),
      cardType: pick(cardTypes)
    });
  }

  return list;
}

const data = generateNews(20);
fs.writeFileSync('news.json', JSON.stringify(data, null, 2), 'utf-8');

console.log("✔ news.json 생성 완료!");