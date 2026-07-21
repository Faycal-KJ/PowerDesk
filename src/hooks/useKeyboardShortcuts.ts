import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { pluginManager } from '../plugins/pluginManager'

function matchShortcut(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split('+').map((s) => s.trim())
  const hasCtrl = parts.includes('ctrl')
  const hasShift = parts.includes('shift')
  const hasAlt = parts.includes('alt')
  const key = parts.find((p) => !['ctrl', 'shift', 'alt'].includes(p))
  if (hasCtrl !== (e.ctrlKey || e.metaKey)) return false
  if (hasShift !== e.shiftKey) return false
  if (hasAlt !== e.altKey) return false
  if (key && e.key.toLowerCase() !== key) return false
  return true
}

export function useKeyboardShortcuts(
  setSearchMode: (mode: 'search' | 'command') => void,
  setSearchOpen: (v: boolean | ((v: boolean) => boolean)) => void,
) {
  const filesRef = useRef(useStore.getState().files)
  const focusedFileIndexRef = useRef(useStore.getState().focusedFileIndex)
  const clipboardOpenRef = useRef(useStore.getState().clipboardOpen)
  const profilesOpenRef = useRef(useStore.getState().profilesOpen)
  const favoriteBarOpenRef = useRef(useStore.getState().favoriteBarOpen)
  const commandHistoryOpenRef = useRef(useStore.getState().commandHistoryOpen)
  const favoriteCommandsOpenRef = useRef(useStore.getState().favoriteCommandsOpen)
  const syncEnabledRef = useRef(useStore.getState().syncEnabled)

  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      filesRef.current = state.files
      focusedFileIndexRef.current = state.focusedFileIndex
      clipboardOpenRef.current = state.clipboardOpen
      profilesOpenRef.current = state.profilesOpen
      favoriteBarOpenRef.current = state.favoriteBarOpen
      commandHistoryOpenRef.current = state.commandHistoryOpen
      favoriteCommandsOpenRef.current = state.favoriteCommandsOpen
      syncEnabledRef.current = state.syncEnabled
    })
    return unsub
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

    const pluginShortcuts = pluginManager.getShortcuts()
    for (const binding of pluginShortcuts) {
      if (matchShortcut(e, binding.keys)) {
        e.preventDefault()
        binding.action()
        return
      }
    }

    const s = useStore.getState()
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setSearchMode('command')
      setSearchOpen(true)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault()
      setSearchMode('search')
      setSearchOpen((v) => !v)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      s.undo()
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      s.redo()
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault()
      s.setClipboardOpen(!clipboardOpenRef.current)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
      e.preventDefault()
      s.setProfilesOpen(!profilesOpenRef.current)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
      e.preventDefault()
      s.setFavoriteBarOpen(!favoriteBarOpenRef.current)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault()
      s.setCommandHistoryOpen(!commandHistoryOpenRef.current)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      s.setFavoriteCommandsOpen(!favoriteCommandsOpenRef.current)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      s.setSyncEnabled(!syncEnabledRef.current)
    } else if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      const idx = focusedFileIndexRef.current >= 0 ? focusedFileIndexRef.current : 0
      const files = filesRef.current
      if (files.length > 0 && idx < files.length) {
        s.setPreviewFile(files[idx])
      }
    } else if (e.key === 'Escape') {
      if (s.selectedPathsForContext.length > 0) {
        s.setSelectedPathsForContext([])
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      const files = filesRef.current
      if (files.length > 0) {
        s.setSelectedPathsForContext(files.map((f) => f.path))
      }
    }
  }, [setSearchMode, setSearchOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
