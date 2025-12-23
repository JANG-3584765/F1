// 🔹 header 메뉴 초기화
function initHeaderMenu() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  const hamburgerBtn = headerContainer.querySelector(".hamburger-btn");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenuBtn = sideMenu?.querySelector(".close-menu");

  if (!hamburgerBtn || !sideMenu || !closeMenuBtn) {
    console.warn("header.js: 필요한 요소를 찾을 수 없습니다.");
    return;
  }

  // 메뉴 열기
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  });

  // 메뉴 닫기
  closeMenuBtn.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    document.body.style.overflow = "";
  });

  // 메뉴 외부 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (
      sideMenu.classList.contains("open") &&
      !sideMenu.contains(e.target) &&
      e.target !== hamburgerBtn
    ) {
      sideMenu.classList.remove("open");
      document.body.style.overflow = "";
    }
  });
}

// 🔹 header fetch 완료 후 실행
document.addEventListener("headerLoaded", () => {
  initHeaderMenu();
});