import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../service/translations'

const LanguageContext = createContext()

export const LANGUAGES = {
  EN: 'en',
  RU: 'ru',
  UZ: 'uz'
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language')
    return savedLanguage || 'ru'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = key => {
    return translations[language][key] || key
  }

  const changeLanguage = lang => {
    if (Object.values(LANGUAGES).includes(lang)) {
      setLanguage(lang)
    }
  }

  const value = {
    language,
    changeLanguage,
    t,
    LANGUAGES
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
