document.addEventListener("DOMContentLoaded", () => {
  fetch("/common/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("footer-container").innerHTML = html;
    })
    .catch(err => console.error("Footer load error:", err));
});