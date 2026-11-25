import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'reloop_theme'
const listeners = new Set()

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this visit.
  }
  listeners.forEach((notify) => notify())
}

function subscribe(notify) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

/** Light/dark theme shared by every component. Dark is the default and the
 *  choice is remembered per browser; index.html applies it before React loads. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)
  const toggleTheme = useCallback(() => setTheme(getTheme() === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggleTheme }
}
