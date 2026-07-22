import type { UndoEntry } from '../../types'

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

export function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function loadUndoHistory(): { undoStack: UndoEntry[]; redoStack: UndoEntry[] } {
  const data = loadJson<{ undoStack?: UndoEntry[]; redoStack?: UndoEntry[] }>('pdx_undo', {})
  return { undoStack: data.undoStack || [], redoStack: data.redoStack || [] }
}

export function saveUndoHistory(undoStack: UndoEntry[], redoStack: UndoEntry[]) {
  saveJson('pdx_undo', { undoStack: undoStack.slice(-100), redoStack: redoStack.slice(-100) })
}

export type SetState = (partial: Partial<any> | ((state: any) => Partial<any>)) => void
export type GetState = () => any

export type SliceCreator<T> = (set: SetState, get: GetState) => T
