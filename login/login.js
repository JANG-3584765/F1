const pwInput = document.getElementById("password");
const togglePw = document.getElementById("togglePw");

togglePw.addEventListener("click", () => {
  const type = pwInput.type === "password" ? "text" : "password";
  pwInput.type = type;
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});
