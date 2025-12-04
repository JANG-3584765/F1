// 🔹 header 메뉴 초기화
function initHeaderMenu() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  const hamburgerBtn = headerContainer.querySelector(".hamburger-btn");
  const sideMenu = headerContainer.querySelector("#sideMenu");
  const closeMenuBtn = headerContainer.querySelector(".close-menu");

  if (!hamburgerBtn || !sideMenu || !closeMenuBtn) {
    console.warn("header.js: 필요한 요소를 찾을 수 없습니다.");
    return;
  }

  // 메뉴 열기
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu.classList.add("open");
  });

  // 메뉴 닫기
  closeMenuBtn.addEventListener("click", () => {
    sideMenu.classList.remove("open");
  });

  // 메뉴 외부 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (
      sideMenu.classList.contains("open") &&
      !sideMenu.contains(e.target) &&
      e.target !== hamburgerBtn
    ) {
      sideMenu.classList.remove("open");
    }
  });
}

// 🔹 fetch 완료 후 실행
const headerContainer = document.getElementById("header-container");
if (headerContainer) {
  // index.html에서 fetch로 header 넣은 직후 이 script가 실행되도록
  initHeaderMenu();
}