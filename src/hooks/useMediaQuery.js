import { useCallback, useSyncExternalStore } from 'react'

const supported = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/**
 * True when the CSS media query matches. False where matchMedia is
 * unavailable (jsdom, SSR) so components render their mobile branch.
 */
export default function useMediaQuery(query) {
  const subscribe = useCallback(
    onChange => {
      if (!supported()) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query]
  )
  const getSnapshot = () =>
    supported() ? window.matchMedia(query).matches : false
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
