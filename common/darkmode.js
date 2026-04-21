(function () {
  const BTN_ID = 'darkmode-toggle';

  function getTheme() {
    return document.documentElement.dataset.theme || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    syncBtn();
  }

  function syncBtn() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    const dark = getTheme() === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
  }

  // 클릭 위임 — 헤더 주입 전후 모두 동작
  document.addEventListener('click', function (e) {
    if (e.target.closest('#' + BTN_ID)) {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  // 헤더가 비동기로 주입된 후 버튼 아이콘 동기화
  document.addEventListener('DOMContentLoaded', function () {
    const hc = document.getElementById('header-container');
    if (!hc) return;
    const mo = new MutationObserver(function () {
      syncBtn();
      mo.disconnect();
    });
    mo.observe(hc, { childList: true });
  });
})();
