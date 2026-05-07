/**
 * Progresso — Language Context (React 19)
 *
 * Design decisions:
 * - Translations are bundled statically (offline-first, no CDN)
 * - Language preference persisted to localStorage
 * - Locale object exposed directly for full TypeScript type safety
 *   (use `loc.nav.train` instead of `t('nav.train')`)
 * - No unnecessary re-renders: context value memoized with useMemo
 * - Dexie.js / IndexedDB logic is NEVER imported or touched here
 */
import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { enUS, zhTW, type Locale, type LangCode, LANG_STORAGE_KEY, DEFAULT_LANG } from '../locales'

/* ── Locale map ─────────────────────────────────────────────── */
const LOCALES: Record<LangCode, Locale> = { 'en-US': enUS, 'zh-TW': zhTW }

/* ── Context type ───────────────────────────────────────────── */
interface LanguageContextValue {
  /** Current language code */
  lang: LangCode
  /** Fully typed locale object — use loc.section.key */
  loc: Locale
  /** Switch language and persist to localStorage */
  setLang: (lang: LangCode) => void
}

/* ── Context ────────────────────────────────────────────────── */
const LanguageContext = createContext<LanguageContextValue | null>(null)

/* ── Provider ───────────────────────────────────────────────── */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null
      return stored && stored in LOCALES ? stored : DEFAULT_LANG
    } catch {
      return DEFAULT_LANG
    }
  })

  const setLang = useCallback((next: LangCode) => {
    try { localStorage.setItem(LANG_STORAGE_KEY, next) } catch { /* storage full — silent */ }
    setLangState(next)
  }, [])

  /* Memoized so consumers only re-render when lang actually changes */
  const value = useMemo<LanguageContextValue>(
    () => ({ lang, loc: LOCALES[lang], setLang }),
    [lang, setLang]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

/* ── Hook ───────────────────────────────────────────────────── */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
