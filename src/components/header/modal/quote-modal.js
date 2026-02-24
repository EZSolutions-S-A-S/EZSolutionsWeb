document.addEventListener("DOMContentLoaded", () => {

  const quoteOverlay = document.getElementById("quote-overlay");
  const quoteCloseBtn = document.getElementById("quote-close-btn");
  const openQuoteBtn = document.getElementById("openQuoteModal");
  const form = document.getElementById("quote-form");
  const formAlert = document.getElementById("form-alert");
  const formAlertText = document.getElementById("form-alert-text");

  if (!quoteOverlay || !form) return;

  // Custom Select Logic is now handled inside the CustomSelect.astro component

  function resetForm() {
    form.reset();
    
    // Reset custom selects if they exist
    const customTriggers = form.querySelectorAll('.custom-select__trigger span');
    const customOptions = form.querySelectorAll('.custom-option');

    // Reset trigger text
    customTriggers.forEach(span => {
      // Find the placeholder from the first disabled option of the adjacent select
      const wrapper = span.closest('.custom-select-wrapper');
      const select = wrapper ? wrapper.querySelector('select') : null;
      // Use placeholder text if available, fallback to default text
      const placeholder = select && select.options[0] ? select.options[0].text : "Selecciona una opción";
      
      span.textContent = placeholder;
      span.style.color = "#61758A";
    });

    // Remove selected class
    customOptions.forEach(opt => opt.classList.remove('selected'));

    form.querySelectorAll(".field-error").forEach(el => {
      el.classList.remove("field-error");
    });

    form.querySelectorAll(".error-message").forEach(el => {
      el.remove();
    });

    if (formAlert) {
      formAlert.classList.remove("active");
    }
  }

  if (openQuoteBtn) {
    openQuoteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      quoteOverlay.classList.add("active");
    });
  }

  if (quoteCloseBtn) {
    quoteCloseBtn.addEventListener("click", () => {
      quoteOverlay.classList.remove("active");
      resetForm();
    });
  }

  quoteOverlay.addEventListener("click", (e) => {
    if (e.target === quoteOverlay) {
      quoteOverlay.classList.remove("active");
      resetForm();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && quoteOverlay.classList.contains("active")) {
      quoteOverlay.classList.remove("active");
      resetForm();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;
    let firstError = null;

    const requiredFields = form.querySelectorAll("[required]");

    form.querySelectorAll(".field-error").forEach(el => {
      el.classList.remove("field-error");
    });

    form.querySelectorAll(".error-message").forEach(el => {
      el.remove();
    });

    if (formAlert) {
      formAlert.classList.remove("active");
    }

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;

        if (!firstError) firstError = field;

        field.classList.add("field-error");

        const parent = field.parentElement;
        if (parent) {
          const error = document.createElement("div");
          error.className = "error-message";
          error.textContent = "Este campo es obligatorio";
          parent.appendChild(error);
        }
      }
    });

    if (!isValid) {
      if (formAlert && formAlertText) {
        formAlertText.textContent = "Por favor completa los campos obligatorios.";
        formAlert.classList.add("active");
      }

      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    form.submit();
  });

  form.querySelectorAll("input, textarea, select").forEach(field => {
    field.addEventListener("input", () => {
      field.classList.remove("field-error");

      const parent = field.parentElement;
      if (!parent) return;

      const error = parent.querySelector(".error-message");
      if (error) error.remove();
    });
  });

});