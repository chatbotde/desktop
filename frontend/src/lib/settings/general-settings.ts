/**
 * General settings persisted from Settings → General (e.g. preferred response language).
 * Read via localStorage so AI paths pick up changes without coupling to React state.
 */

export const BUDDY_GENERAL_SETTINGS_STORAGE_KEY = "buddy_general_settings"

export interface BuddyGeneralSettings {
  language: string
}

export const DEFAULT_BUDDY_GENERAL_SETTINGS: BuddyGeneralSettings = {
  language: "english",
}

const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Chinese",
  japanese: "Japanese",
  korean: "Korean",
  russian: "Russian",
  portuguese: "Portuguese",
  hindi: "Hindi",
}

export function readBuddyGeneralSettings(): BuddyGeneralSettings {
  try {
    const raw = localStorage.getItem(BUDDY_GENERAL_SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_BUDDY_GENERAL_SETTINGS
    const parsed = JSON.parse(raw) as Partial<BuddyGeneralSettings>
    const lang =
      typeof parsed.language === "string" && parsed.language.trim()
        ? parsed.language.trim().toLowerCase()
        : DEFAULT_BUDDY_GENERAL_SETTINGS.language
    return { language: lang }
  } catch {
    return DEFAULT_BUDDY_GENERAL_SETTINGS
  }
}

/** Human-readable label for prompts, or null when default (English) / unknown. */
export function getPreferredResponseLanguageLabel(): string | null {
  const { language } = readBuddyGeneralSettings()
  if (!language || language === "english") return null
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1)
}

/**
 * Suffix appended to system prompts for text models (cloud + local).
 * Models may still fail for weak multilingual support; this is best-effort.
 */
export function getResponseLanguageSystemSuffix(): string | null {
  const label = getPreferredResponseLanguageLabel()
  if (!label) return null
  return (
    `LANGUAGE (user preference): Respond in ${label} for all assistant messages by default. ` +
    `If the user writes in a different language, follow their language. ` +
    `Keep code snippets, identifiers, URLs, and file paths unchanged.`
  )
}

/** Merge an optional base system string with the current language preference. */
export function mergeSystemPromptWithResponseLanguage(system?: string | null): string | undefined {
  const suffix = getResponseLanguageSystemSuffix()
  const base = system?.trim() ?? ""
  if (!suffix) return base || undefined
  if (!base) return suffix
  return `${base}\n\n${suffix}`
}

/** Extra instruction for Gemini Live (spoken + text in session). */
export function getLiveAssistantLanguageClause(): string {
  const label = getPreferredResponseLanguageLabel()
  if (!label) return ""
  return (
    `\n\nLANGUAGE PREFERENCE: Default spoken and written replies in this session should be in ${label}. ` +
    `If the user is clearly speaking another language, match them; otherwise use ${label}.`
  )
}
