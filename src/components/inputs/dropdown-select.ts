declare global {
  interface Window {
    hasSelectGlobalListener?: boolean;
  }
}

export function setupCustomSelects() {
  const wrappers = document.querySelectorAll('.custom-select-wrapper');

  wrappers.forEach((wrapper) => {
    // Evitar doble inicialización
    if (wrapper.hasAttribute('data-initialized')) return;
    wrapper.setAttribute('data-initialized', 'true');

    const select = wrapper.querySelector('.custom-select');
    const trigger = wrapper.querySelector('.custom-select__trigger');
    const options = wrapper.querySelectorAll('.custom-option');
    const hiddenSelect = wrapper.querySelector('select') as HTMLSelectElement | null;
    const triggerText = trigger?.querySelector('span');

    if (!select || !trigger || !hiddenSelect || !triggerText) return;

    // Toggle dropdown
    trigger.addEventListener('click', (e: Event) => {
      // Close other open selects
      document.querySelectorAll('.custom-select').forEach((s) => {
        if (s !== select) s.classList.remove('open');
      });
      select.classList.toggle('open');
      e.stopPropagation();
    });

    // Select option
    options.forEach((option) => {
      option.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        select.classList.remove('open');

        // Remove selected class from siblings
        options.forEach((opt) => opt.classList.remove('selected'));

        // Add selected to clicked option
        option.classList.add('selected');

        // Update UI text
        const value = option.getAttribute('data-value') || '';
        if (triggerText) {
          triggerText.textContent = option.textContent;
          triggerText.style.color = '#111827';
          // Mark as custom value so i18n doesn't overwrite it
          triggerText.setAttribute('data-custom-value', 'true');
          triggerText.removeAttribute('data-i18n-key');
        }

        // Update hidden select value
        hiddenSelect.value = value;

        // Dispatch change event
        hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  // Delegación de evento para cerrar al hacer clic fuera (Solo una vez)
  if (!window.hasSelectGlobalListener) {
    document.addEventListener('click', (e: Event) => {
      const openSelects = document.querySelectorAll('.custom-select.open');
      openSelects.forEach((select) => {
        if (!select.contains(e.target as Node)) {
          select.classList.remove('open');
        }
      });
    });
    window.hasSelectGlobalListener = true;
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', setupCustomSelects);

// Also run when Astro swaps pages (if using View Transitions)
document.addEventListener('astro:page-load', setupCustomSelects);
