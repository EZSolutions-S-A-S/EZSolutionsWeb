import es from './locales/es.json';
import en from './locales/en.json';

export const i18n = {
  defaultLang: 'es',
  langs: { es, en },
};

export function t(key: string, lang: 'es' | 'en' = 'es'): string {
  const keys = key.split('.');
  let val: any = i18n.langs[lang];
  
  for (const k of keys) {
    val = val?.[k];
  }
  
  return val || key;
}
