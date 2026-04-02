// BASE_PATH: 로컬(라이브 서버)이면 '', GitHub Pages면 '/F1'
window.BASE_PATH = (() => {
  const { hostname, protocol } = location;
  if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') return '';
  const m = location.pathname.match(/^\/([\w.-]+)\//);
  return m ? '/' + m[1] : '';
})();
