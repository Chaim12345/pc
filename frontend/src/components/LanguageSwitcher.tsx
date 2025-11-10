import React from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    // Update document direction for RTL languages
    if (langCode === 'he') {
      document.documentElement.setAttribute('dir', 'rtl')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
    }
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  return (
    <div className="relative group">
      <button
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[var(--vibe-bg-secondary)] hover:bg-[var(--vibe-bg-hover)] text-[var(--vibe-primary-text)] transition-colors border border-[var(--vibe-border-light)]"
        aria-label="Change language"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[var(--vibe-bg-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
              i18n.language === lang.code ? 'bg-[var(--vibe-bg-selected)]' : ''
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm text-[var(--vibe-primary-text)]">{lang.name}</span>
            {i18n.language === lang.code && (
              <svg className="w-4 h-4 ml-auto text-[var(--vibe-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

