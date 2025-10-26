// 샘플 영상 데이터
const videos = [
  {
    title: "2025 호주 그랑프리 하이라이트",
    thumbnail: "images/video1.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "맥라렌 인터뷰: 랜도 노리스",
    thumbnail: "images/video2.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "레드불 전략 분석",
    thumbnail: "images/video3.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "2025 바레인 그랑프리 리포트",
    thumbnail: "images/video4.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
];

// 영상 카드 생성
const videoList = document.getElementById("video-list");

videos.forEach(video => {
  const card = document.createElement("div");
  card.className = "video-card";
  card.innerHTML = `
    <img src="${video.thumbnail}" alt="${video.title}">
    <div class="video-title">${video.title}</div>
  `;
  // 클릭 시 유튜브 링크 새 탭으로 열기
  card.addEventListener("click", () => {
    window.open(video.url, "_blank");
  });
  videoList.appendChild(card);
});
