// Translation lookup. Works from both setup() and plain JS helpers — Pinia
// is initialized at app boot so useAppStore() is safe to call anywhere by
// the time any component renders or any IPC fires.
//
//   const t = useT()
//   t('boardCompat.popup', 3, 'arduino-uno')
//
// Returns the English fallback if the key is missing in the active language.
// Returns the key path as a last-resort sentinel if neither language has it
// — visible in the UI so the missing string is obvious instead of silently
// rendering empty.

import { useAppStore } from '@/stores/app'
import messages from './messages'

export function useT() {
  const app = useAppStore()
  return function t(key, ...args) {
    const dict = messages[app.language] || messages.en
    let value = dict[key]
    if (value == null) value = messages.en[key]   // fallback to English
    if (typeof value === 'function') return value(...args)
    if (typeof value === 'string')   return value
    return key                                    // sentinel — visible mistake
  }
}
