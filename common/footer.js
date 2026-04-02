fetch(`${BASE_PATH}/common/footer.html`)
  .then(res => res.text())
  .then(html => {
    document.getElementById('footer-container').innerHTML =
      html.replaceAll('/F1/', BASE_PATH + '/');
  })
  .catch(err => console.error('Footer load error:', err));
