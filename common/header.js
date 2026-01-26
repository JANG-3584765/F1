// header.js (delegation 기반: 타이밍 이슈 제거)

(function initHeaderDelegation() {
  const sideMenu = () => document.getElementById("sideMenu");

  const openMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    menu.classList.add("open");
    document.body.style.overflow = "hidden";

    const btn = document.querySelector("#header-container .hamburger-btn");
    if (btn) btn.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    menu.classList.remove("open");
    document.body.style.overflow = "";

    const btn = document.querySelector("#header-container .hamburger-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  };

  const toggleMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    if (menu.classList.contains("open")) closeMenu();
    else openMenu();
  };

  // ✅ 1) 햄버거/닫기 버튼: 이벤트 위임
  document.addEventListener(
    "click",
    (e) => {
      const hamburger = e.target.closest("#header-container .hamburger-btn");
      if (hamburger) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
        return;
      }

      const closeBtn = e.target.closest("#sideMenu .close-menu");
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        return;
      }
    },
    true
  );

  // ✅ 2) 메뉴 바깥 클릭 닫기
  document.addEventListener(
    "click",
    (e) => {
      const menu = sideMenu();
      if (!menu || !menu.classList.contains("open")) return;

      const clickedInsideMenu = menu.contains(e.target);
      const clickedHamburger = !!e.target.closest("#header-container .hamburger-btn");

      if (!clickedInsideMenu && !clickedHamburger) closeMenu();
    },
    true
  );

  // ✅ 3) ESC 닫기
  document.addEventListener("keydown", (e) => {
    const menu = sideMenu();
    if (e.key === "Escape" && menu?.classList.contains("open")) closeMenu();
  });

  // 초기 aria 상태(메뉴가 기본 닫힘 가정)
  const menu = sideMenu();
  if (menu) menu.setAttribute("aria-hidden", "true");
})();
