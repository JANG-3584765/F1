document.addEventListener("DOMContentLoaded", () => {
  fetch("/F1/common/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("footer-container").innerHTML = html;
    })
    .catch(err => console.error("Footer load error:", err));
});