document.addEventListener("DOMContentLoaded", () => {

  const quoteOverlay = document.getElementById("quote-overlay");
  const quoteCloseBtn = document.getElementById("quote-close-btn");
  const openQuoteBtns = document.querySelectorAll(".open-quote-modal, #openQuoteModal");
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

    form.closest('.quote-modal').scrollTo(0, 0);

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

  if (openQuoteBtns.length > 0) {
    openQuoteBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        quoteOverlay.classList.add("active");
      });
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

        // Si es un select hidden dentro de CustomSelect, aplicar error al trigger
        if (field.tagName === 'SELECT' && field.style.display === 'none') {
          const wrapper = field.closest('.custom-select-wrapper');
          if (wrapper) {
            const trigger = wrapper.querySelector('.custom-select__trigger');
            if (trigger) {
              trigger.classList.add("field-error");
            }
          }
        } else {
          field.classList.add("field-error");
        }

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

    // Recopilar datos del formulario
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      project_type: formData.get('project_type'),
      description: formData.get('description'),
      budget: formData.get('budget'),
    };

    // Mostrar pantalla de carga
    const loadingScreen = document.getElementById('quote-loading');
    if (loadingScreen) {
      loadingScreen.classList.add('active');
    }

    // Enviar email a través de Resend
    fetch('/api/send-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          // Mostrar pantalla de éxito
          const successScreen = document.getElementById('quote-success');
          
          if (successScreen) {
            successScreen.classList.add('active');
          }
          
          // Ocultar loading
          if (loadingScreen) {
            loadingScreen.classList.remove('active');
          }
          
          // Cerrar modal después de 4 segundos
          setTimeout(() => {
            if (successScreen) {
              successScreen.classList.remove('active');
            }
            if (loadingScreen) {
              loadingScreen.classList.remove('active');
            }
            quoteOverlay.classList.remove("active");
            resetForm();
          }, 4000);
        } else {
          throw new Error(result.error || 'Error al enviar cotización');
        }
      })
      .catch(error => {
        // Ocultar pantalla de carga
        if (loadingScreen) {
          loadingScreen.classList.remove('active');
        }
        if (formAlert && formAlertText) {
          formAlert.classList.add("active");
          formAlertText.innerHTML = `
            <span class="form-alert-icon">✗</span>
            <div class="form-alert-text">
              <div class="form-alert-title">Error al enviar</div>
              <div class="form-alert-message">Hubo un problema. Intenta de nuevo.</div>
            </div>
          `;
          formAlert.style.borderColor = '#ef4444';
          formAlert.style.backgroundColor = '#fef2f2';
        }
      });
  });

  form.querySelectorAll("input, textarea, select").forEach(field => {
    field.addEventListener("input", () => {
      // Si es un select hidden dentro de CustomSelect, remover error del trigger
      if (field.tagName === 'SELECT' && field.style.display === 'none') {
        const wrapper = field.closest('.custom-select-wrapper');
        if (wrapper) {
          const trigger = wrapper.querySelector('.custom-select__trigger');
          if (trigger) {
            trigger.classList.remove("field-error");
          }
        }
      } else {
        field.classList.remove("field-error");
      }

      const parent = field.parentElement;
      if (!parent) return;

      const error = parent.querySelector(".error-message");
      if (error) error.remove();
    });
  });

});