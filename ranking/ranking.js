// 탭 전환
document.querySelectorAll('.standings-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.standings-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const type = tab.dataset.type;
    document.getElementById('drivers-standings').style.display = (type === 'drivers') ? 'block' : 'none';
    document.getElementById('constructors-standings').style.display = (type === 'constructors') ? 'block' : 'none';
  });
});