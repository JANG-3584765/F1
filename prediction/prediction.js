document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "season_prediction";

  // 로컬스토리지에서 기존 데이터 불러오기 (없으면 초기화)
  let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!savedData || typeof savedData !== "object") savedData = {};

  // =====================
  // week(카드) 단위로 초기화
  // =====================
  document.querySelectorAll(".prediction-card").forEach(cardSection => {
    // 이 카드가 담당하는 week 찾기 (카드 내부 첫 prediction-options 기준)
    const firstOptions = cardSection.querySelector(".prediction-options");
    if (!firstOptions) return;

    const week = firstOptions.dataset.week;

    // 같은 week의 options 박스(= top + more 등) 전부 수집
    const optionsBoxes = Array.from(cardSection.querySelectorAll(`.prediction-options[data-week="${week}"]`));
    if (optionsBoxes.length === 0) return;

    // 타입 판별 (같은 week 안에서는 동일 타입이어야 정상)
    const isRank = optionsBoxes.some(b => b.classList.contains("rank-options"));
    const isMulti = optionsBoxes.some(b => b.classList.contains("multi-options"));

    // multi-options의 max는 보통 1개 박스에만 있으니, 첫 박스에서 가져옴
    const maxSelect = Number(optionsBoxes.find(b => b.dataset.max)?.dataset.max) || 1;

    const submitBtn = cardSection.querySelector(".btn-submit");
    if (!submitBtn) return;

    // weekData 초기화
    const weekDataRaw = savedData[week];
    const weekData = (weekDataRaw && typeof weekDataRaw === "object" && "values" in weekDataRaw)
      ? weekDataRaw
      : { values: [], locked: false };

    let selected = Array.isArray(weekData.values) ? [...weekData.values] : [];
    let locked = !!weekData.locked;

    // 초기 선택 복원(모든 optionsBoxes에 동기화)
    syncSelectedUI();
    syncRankPickedUI();

    if (locked) applyLockUI();
    updateSubmitState();

    // =====================
    // 이벤트: 카드 내부에서 위임 처리
    // =====================
    cardSection.addEventListener("click", (e) => {
      const card = e.target.closest(".option-card");
      if (!card) return;
      // 이 카드가 이 week의 옵션인지 확인
      const box = card.closest(`.prediction-options[data-week="${week}"]`);
      if (!box) return;

      if (locked) return;

      const value = card.dataset.value;

      if (isRank) handleRank(value);
      else if (isMulti) handleMulti(value);
      else handleSingle(value);

      syncSelectedUI();
      syncRankPickedUI();
      updateSubmitState();
      save();
    });

    // 선택 완료 버튼
    submitBtn.addEventListener("click", () => {
      if (!isSelectionComplete()) return;

      locked = true;
      save();
      applyLockUI();
    });

    // =====================
    // 선택 로직 (UI는 따로 syncSelectedUI에서)
    // =====================
    function handleRank(value) {
      if (selected.includes(value)) {
        selected = selected.filter(v => v !== value);
        return;
      }
      if (selected.length >= 3) return;
      selected.push(value);
    }

    function handleSingle(value) {
      selected = [value];
    }

    function handleMulti(value) {
      if (selected.includes(value)) {
        selected = selected.filter(v => v !== value);
        return;
      }
      if (selected.length >= maxSelect) return;
      selected.push(value);
    }

    // =====================
    // 완료 조건 / 버튼 상태
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
    // UI 동기화 (top/more 모두 반영)
    // =====================
    function syncSelectedUI() {
      optionsBoxes.forEach(box => {
        box.querySelectorAll(".option-card").forEach(c => {
          const v = c.dataset.value;
          c.classList.toggle("selected", selected.includes(v));
        });
      });
    }

    // rank-picked 슬롯(있으면) 업데이트
    function syncRankPickedUI() {
      const picked = cardSection.querySelector(`.rank-picked[data-week="${week}"]`);
      if (!picked) return;
      if (!isRank) return;

      const slots = picked.querySelectorAll(".picked-slot");
      slots.forEach((slot, idx) => {
        const nameEl = slot.querySelector(".picked-name");
        if (!nameEl) return;

        const v = selected[idx];
        if (!v) {
          nameEl.textContent = "-";
          return;
        }

        // 현재 선택된 value에 해당하는 카드의 텍스트를 찾아 표시(어느 박스든 상관없음)
        const cardEl = cardSection.querySelector(`.option-card[data-value="${v}"]`);
        nameEl.textContent = cardEl ? cardEl.textContent.trim() : v;
      });
    }

    // =====================
    // 잠금 UI (week 전체 적용)
    // =====================
    function applyLockUI() {
      cardSection.classList.add("locked");
      submitBtn.textContent = "확정됨";
      submitBtn.disabled = true;

      optionsBoxes.forEach(box => {
        box.querySelectorAll(".option-card").forEach(c => c.classList.add("locked"));
      });
    }

    // =====================
    // 저장
    // =====================
    function save() {
      savedData[week] = { values: selected, locked };
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

      // 선택/잠금 UI 초기화
      document.querySelectorAll(".prediction-options .option-card").forEach(card => {
        card.classList.remove("selected", "locked");
      });

      // rank-picked 초기화
      document.querySelectorAll(".rank-picked .picked-name").forEach(el => {
        el.textContent = "-";
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