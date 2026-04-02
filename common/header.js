(function () {
  // 1. 헤더 HTML 로드 + /F1/ 경로 교체
  fetch(`${BASE_PATH}/common/header.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('header-container').innerHTML =
        html.replaceAll('/F1/', BASE_PATH + '/');
    })
    .catch(err => console.error('Header load error:', err));

  // 2. 메뉴 이벤트 위임 (헤더 로드 전에도 등록 가능)
  const sideMenu = () => document.getElementById('sideMenu');

  const openMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
    const btn = document.querySelector('#header-container .hamburger-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  };

  const closeMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    menu.classList.remove('open');
    document.body.style.overflow = '';
    const btn = document.querySelector('#header-container .hamburger-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  };

  const toggleMenu = () => {
    const menu = sideMenu();
    if (!menu) return;
    if (menu.classList.contains('open')) closeMenu();
    else openMenu();
  };

  document.addEventListener('click', (e) => {
    const hamburger = e.target.closest('#header-container .hamburger-btn');
    if (hamburger) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
      return;
    }
    const closeBtn = e.target.closest('#sideMenu .close-menu');
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      return;
    }
  }, true);

  document.addEventListener('click', (e) => {
    const menu = sideMenu();
    if (!menu || !menu.classList.contains('open')) return;
    const clickedInsideMenu = menu.contains(e.target);
    const clickedHamburger = !!e.target.closest('#header-container .hamburger-btn');
    if (!clickedInsideMenu && !clickedHamburger) closeMenu();
  }, true);

  document.addEventListener('keydown', (e) => {
    const menu = sideMenu();
    if (e.key === 'Escape' && menu?.classList.contains('open')) closeMenu();
  });
})();
