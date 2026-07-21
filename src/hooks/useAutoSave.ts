import { useEffect, useRef } from 'react'
import { useStore } from '../stores/useStore'

export function useAutoSave(loadedRef: React.RefObject<boolean>) {
  const tabs = useStore((s) => s.tabs)
  const persistWorkspace = useStore((s) => s.persistWorkspace)

  useEffect(() => {
    if (!loadedRef.current) return
    const timer = setTimeout(() => persistWorkspace(), 300)
    return () => clearTimeout(timer)
  }, [tabs, persistWorkspace])
}
