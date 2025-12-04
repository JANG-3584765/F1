document.getElementById("signupBtn").addEventListener("click", () => {
  const pw = document.getElementById("password").value;
  const pw2 = document.getElementById("passwordCheck").value;

  if (pw !== pw2) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  alert("회원가입 완료!");
});