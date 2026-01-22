function initHeaderMenu() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  // ✅ 중복 초기화 방지
  if (headerContainer.dataset.menuInited === "1") return;
  headerContainer.dataset.menuInited = "1";

  const hamburgerBtn = headerContainer.querySelector(".hamburger-btn");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenuBtn = sideMenu?.querySelector(".close-menu");

  if (!hamburgerBtn || !sideMenu || !closeMenuBtn) {
    console.warn("header.js: 필요한 요소를 찾을 수 없습니다.");
    headerContainer.dataset.menuInited = "0";
    return;
  }

  const openMenu = () => {
    sideMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    sideMenu.classList.remove("open");
    document.body.style.overflow = "";
  };

  // 메뉴 열기
  hamburgerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu();
  });

  // 메뉴 닫기
  closeMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
  });

  // 메뉴 외부 클릭 시 닫기
  document.addEventListener(
    "click",
    (e) => {
      if (!sideMenu.classList.contains("open")) return;

      const clickedHamburger = hamburgerBtn.contains(e.target); // ✅ 핵심
      const clickedInsideMenu = sideMenu.contains(e.target);

      if (!clickedInsideMenu && !clickedHamburger) closeMenu();
    },
    true // ✅ 캡처링으로 충돌 감소
  );
}

document.addEventListener("headerLoaded", () => {
  // 혹시 삽입 직후 안정화 타이밍을 위해 1프레임 미룸
  requestAnimationFrame(initHeaderMenu);
});