document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "season_prediction";

  // 로컬스토리지에서 기존 데이터 불러오기 (없으면 초기화)
  let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!savedData || typeof savedData !== "object") savedData = {};

  // =====================
  // 카드 초기화 및 클릭 이벤트
  // =====================
  document.querySelectorAll(".prediction-options").forEach(optionsBox => {
    const week = optionsBox.dataset.week;

    const isRank = optionsBox.classList.contains("rank-options");
    const isMulti = optionsBox.classList.contains("multi-options");
    const maxSelect = Number(optionsBox.dataset.max) || 1;

    const cardSection = optionsBox.closest(".prediction-card");
    const submitBtn = cardSection.querySelector(".btn-submit");

    // 안전하게 weekData 초기화
    const weekDataRaw = savedData[week];
    const weekData = (weekDataRaw && typeof weekDataRaw === "object" && "values" in weekDataRaw)
      ? weekDataRaw
      : { values: [], locked: false };

    let selected = Array.isArray(weekData.values) ? [...weekData.values] : [];
    let locked = !!weekData.locked;

    // 초기 선택 복원
    selected.forEach(value => {
      const card = optionsBox.querySelector(`.option-card[data-value="${value}"]`);
      if (card) card.classList.add("selected");
    });

    if (locked) applyLockUI();
    updateSubmitState();

    // 카드 클릭 이벤트
    optionsBox.querySelectorAll(".option-card").forEach(card => {
      card.addEventListener("click", () => {
        if (locked) return;

        const value = card.dataset.value;

        if (isRank) handleRank(value, card);
        else if (isMulti) handleMulti(value, card);
        else handleSingle(value, card);

        updateSubmitState();
        save();
      });
    });

    // 선택 완료 버튼
    submitBtn.addEventListener("click", () => {
      if (!isSelectionComplete()) return;

      locked = true;
      save();
      applyLockUI();
    });

    // =====================
    // 선택 로직
    // =====================
    function handleRank(value, card) {
      if (selected.includes(value)) {
        selected = selected.filter(v => v !== value);
        card.classList.remove("selected");
        return;
      }
      if (selected.length >= 3) return;
      selected.push(value);
      card.classList.add("selected");
    }

    function handleSingle(value, card) {
      selected = [value];
      optionsBox.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    }

    function handleMulti(value, card) {
      if (selected.includes(value)) {
        selected = selected.filter(v => v !== value);
        card.classList.remove("selected");
        return;
      }
      if (selected.length >= maxSelect) return;
      selected.push(value);
      card.classList.add("selected");
    }

    // =====================
    // 버튼 상태 업데이트
    // =====================
    function isSelectionComplete() {
      if (isRank) return selected.length === 3;
      if (isMulti) return selected.length > 0;
      return selected.length === 1;
    }

    function updateSubmitState() {
      submitBtn.disabled = locked || !isSelectionComplete();
    }

    // =====================
    // 잠금 UI
    // =====================
    function applyLockUI() {
      cardSection.classList.add("locked");
      submitBtn.textContent = "확정됨";
      submitBtn.disabled = true;

      optionsBox.querySelectorAll(".option-card").forEach(c => c.classList.add("locked"));
    }

    // =====================
    // 저장
    // =====================
    function save() {
      savedData[week] = {
        values: selected,
        locked
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    }
  });

  // =====================
  // 전체 초기화 버튼
  // =====================
  const resetBtn = document.getElementById("reset-prediction");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!confirm("정말로 모든 선택을 초기화하시겠습니까?")) return;

      localStorage.removeItem(STORAGE_KEY);

      // 카드 선택 초기화
      document.querySelectorAll(".prediction-options .option-card").forEach(card => {
        card.classList.remove("selected", "locked");
      });

      // 버튼 초기화
      document.querySelectorAll(".prediction-card .btn-submit").forEach(btn => {
        btn.disabled = true;
        btn.textContent = "선택 완료";
      });

      // 카드 잠금 상태 제거
      document.querySelectorAll(".prediction-card").forEach(section => {
        section.classList.remove("locked");
      });

      alert("모든 선택이 초기화되었습니다.");
    });
  }
});