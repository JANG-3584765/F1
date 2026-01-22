// 🔹 header 메뉴 초기화 (안정화 버전)
function initHeaderMenu() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  // ✅ headerLoaded가 여러 번 와도 이벤트 중복 등록 방지
  if (headerContainer.dataset.menuInited === "1") return;
  headerContainer.dataset.menuInited = "1";

  const hamburgerBtn = headerContainer.querySelector(".hamburger-btn");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenuBtn = sideMenu?.querySelector(".close-menu");

  if (!hamburgerBtn || !sideMenu || !closeMenuBtn) {
    console.warn("header.js: 필요한 요소를 찾을 수 없습니다.");
    headerContainer.dataset.menuInited = "0"; // 다음 로드에서 재시도 가능
    return;
  }

  const setA11y = (isOpen) => {
    hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    sideMenu.setAttribute("aria-hidden", String(!isOpen));
  };

  const openMenu = () => {
    sideMenu.classList.add("open");
    document.body.style.overflow = "hidden";
    setA11y(true);
  };

  const closeMenu = () => {
    sideMenu.classList.remove("open");
    document.body.style.overflow = "";
    setA11y(false);
  };

  const toggleMenu = () => {
    if (sideMenu.classList.contains("open")) closeMenu();
    else openMenu();
  };

  // 메뉴 열기/토글
  hamburgerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // 메뉴 닫기
  closeMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  });

  // 메뉴 외부 클릭 시 닫기
  // ✅ 캡처링(true): 다른 스크립트가 버블 단계에서 stopPropagation 해도 안정적
  document.addEventListener(
    "click",
    (e) => {
      if (!sideMenu.classList.contains("open")) return;

      // ✅ 버튼 내부(텍스트/아이콘) 클릭도 햄버거 클릭으로 인식
      const clickedHamburger = hamburgerBtn.contains(e.target);
      const clickedInsideMenu = sideMenu.contains(e.target);

      if (!clickedInsideMenu && !clickedHamburger) closeMenu();
    },
    true
  );

  // ESC로 닫기(옵션이지만 UX만 개선, 디자인 영향 없음)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sideMenu.classList.contains("open")) closeMenu();
  });

  // 초기 접근성 상태
  setA11y(false);
}

// 🔹 header fetch 완료 후 실행
document.addEventListener("headerLoaded", () => {
  // 삽입 직후 레이아웃/DOM 안정화용
  requestAnimationFrame(initHeaderMenu);
});