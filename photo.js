const photos = [
  { url: "images/photo1.jpg", title: "Australian GP 2025", date: "14-16 Mar" },
  { url: "images/photo2.jpg", title: "Chinese GP 2025", date: "21-23 Mar" },
  { url: "images/photo3.jpg", title: "Japanese GP 2025", date: "04-06 Apr" },
  { url: "images/photo4.jpg", title: "Bahrain GP 2025", date: "11-13 Apr" }
];

const gallery = document.getElementById("photo-gallery");

photos.forEach(photo => {
  const card = document.createElement("div");
  card.classList.add("photo-card");
  card.innerHTML = `
    <img src="${photo.url}" alt="${photo.title}">
    <div class="photo-info">
      <h3>${photo.title}</h3>
      <p>${photo.date}</p>
    </div>
  `;
  gallery.appendChild(card);

  // 클릭 시 모달 열기
  card.querySelector("img").addEventListener("click", () => {
    modal.style.display = "block";
    modalImg.src = photo.url;
    modalCaption.textContent = `${photo.title} (${photo.date})`;
  });
});

// 모달 요소
const modal = document.getElementById("photo-modal");
const modalImg = document.getElementById("modal-img");
const modalCaption = document.getElementById("modal-caption");
const closeBtn = document.querySelector(".photo-modal .close");

// 모달 닫기
closeBtn.onclick = function() {
  modal.style.display = "none";
}

// 모달 외부 클릭 시 닫기
modal.onclick = function(e) {
  if(e.target === modal) {
    modal.style.display = "none";
  }
}
