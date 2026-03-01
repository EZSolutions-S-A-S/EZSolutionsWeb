import es from './locales/es.json';
import en from './locales/en.json';

export type Language = 'es' | 'en';

interface I18nStore {
  currentLang: Language;
  translations: { es: typeof es; en: typeof en };
  listeners: Set<(lang: Language) => void>;
}

const store: I18nStore = {
  currentLang: (localStorage.getItem('lang') || 'es') as Language,
  translations: { es, en },
  listeners: new Set(),
};

export function setLanguage(lang: Language) {
  if (store.currentLang === lang) return;
  
  store.currentLang = lang;
  localStorage.setItem('lang', lang);
  
  // Notificar a todos los listeners
  store.listeners.forEach(callback => callback(lang));
  
  // Actualizar todos los elementos con data-i18n-key
  updatePageTranslations(lang);
}

export function getLanguage(): Language {
  return store.currentLang;
}

export function getText(key: string, lang?: Language): string {
  const targetLang = lang || store.currentLang;
  const keys = key.split('.');
  let val: any = store.translations[targetLang];
  
  for (const k of keys) {
    val = val?.[k];
  }
  
  return val || key;
}

export function subscribe(callback: (lang: Language) => void): () => void {
  store.listeners.add(callback);
  return () => store.listeners.delete(callback);
}

function updatePageTranslations(lang: Language) {
  // Actualizar todos los elementos con data-i18n-key
  const elements = document.querySelectorAll('[data-i18n-key]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    if (key) {
      el.textContent = getText(key, lang);
    }
  });
  
  // Actualizar atributos data-i18n-attr
  const attrsElements = document.querySelectorAll('[data-i18n-attr]');
  attrsElements.forEach(el => {
    const attrs = JSON.parse(el.getAttribute('data-i18n-attr') || '{}');
    Object.entries(attrs).forEach(([attr, key]: [string, any]) => {
      el.setAttribute(attr, getText(key, lang));
    });
  });
  
  // Actualizar botones de idioma
  const langButtons = document.querySelectorAll('[data-lang-switch]');
  langButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-lang-switch') === lang) {
      btn.classList.add('active');
    }
  });
}

// Inicializar las traducciones al cargar
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Cargar idioma guardado
    const savedLang = (localStorage.getItem('lang') || 'es') as Language;
    setLanguage(savedLang);
  });
}
