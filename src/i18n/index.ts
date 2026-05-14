import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'
import pt from './pt.json'

const savedLang = localStorage.getItem('pep_language') ?? 'es'

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: savedLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

export default i18n
export const setLanguage = (lang: 'es' | 'en' | 'pt') => {
  localStorage.setItem('pep_language', lang)
  i18n.changeLanguage(lang)
}
