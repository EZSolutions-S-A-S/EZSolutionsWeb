document.addEventListener("DOMContentLoaded", () => {

  const quoteOverlay = document.getElementById("quote-overlay");
  const quoteCloseBtn = document.getElementById("quote-close-btn");
  const openQuoteBtn = document.getElementById("openQuoteModal");
  const form = document.getElementById("quote-form");
  const formAlert = document.getElementById("form-alert");
  const formAlertText = document.getElementById("form-alert-text");

  if (!quoteOverlay || !form) return;

  // Custom Select Logic
  const customSelect = document.querySelector('.custom-select');
  const customSelectTrigger = customSelect?.querySelector('.custom-select__trigger');
  const customOptions = customSelect?.querySelector('.custom-options');
  const customOptionsList = customSelect?.querySelectorAll('.custom-option');
  const hiddenSelect = document.getElementById('project-type-select');
  const triggerText = customSelectTrigger?.querySelector('span');

  if (customSelect && customSelectTrigger && customOptions && hiddenSelect) {
    customSelectTrigger.addEventListener('click', (e) => {
        customSelect.classList.toggle('open');
    });

    customOptionsList.forEach(option => {
        option.addEventListener('click', function() {
            customSelect.classList.remove('open');
            
            customOptionsList.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            triggerText.textContent = this.textContent;
            triggerText.style.color = "#111827";

            hiddenSelect.value = this.getAttribute('data-value');
            
            const event = new Event('change');
            hiddenSelect.dispatchEvent(event);
        });
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });
  }

  function resetForm() {
    form.reset();
    
    if (triggerText) {
      triggerText.textContent = "Selecciona una opción";
      triggerText.style.color = "#61758A";
    }
    if (customOptionsList) {
      customOptionsList.forEach(opt => opt.classList.remove('selected'));
    }

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