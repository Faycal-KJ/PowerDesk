import type { UndoEntry } from '../../types'
import { loadUndoHistory, saveUndoHistory } from './helpers'
import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'

export interface UndoSlice {
  undoStack: UndoEntry[]
  redoStack: UndoEntry[]
  undoHistoryOpen: boolean
  setUndoHistoryOpen: (v: boolean) => void
  pushUndo: (entry: Omit<UndoEntry, 'id' | 'timestamp'>) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
}

export const createUndoSlice = (set: SetState, get: GetState): UndoSlice => ({
  ...loadUndoHistory(),
  undoHistoryOpen: false,
  setUndoHistoryOpen: (v) => set({ undoHistoryOpen: v }),

  pushUndo: (entry) => {
    const full: UndoEntry = {
      ...entry,
      id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    }
    set((s: any) => {
      const undoStack = [...s.undoStack, full]
      const redoStack: UndoEntry[] = []
      saveUndoHistory(undoStack, redoStack)
      return { undoStack, redoStack }
    })
  },

  undo: async () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return
    const entry = undoStack[undoStack.length - 1]
    const api = getApi()
    if (!api) return

    let success = false
    try {
      switch (entry.type) {
        case 'delete': {
          const r = await api.restoreFromTrash(entry.data.trashPath, entry.data.path)
          success = !!r?.success
          break
        }
        case 'rename': {
          await api.fileRename(entry.data.newPath, entry.data.oldPath)
          success = true
          break
        }
        case 'move': {
          await api.fileRename(entry.data.newPath, entry.data.oldPath)
          success = true
          break
        }
        case 'copy': {
          await api.fileDelete(entry.data.destPath)
          success = true
          break
        }
        case 'replace': {
          try { await api.fileDelete(entry.data.destPath) } catch {}
          const r = await api.restoreFromTrash(entry.data.destTrashPath, entry.data.destPath)
          success = !!r?.success
          break
        }
        case 'tag': {
          await api.setItemMeta(entry.data.dirPath, entry.data.fileName, { tags: entry.data.oldTags })
          get().updateFileMeta(entry.data.fileName, { tags: entry.data.oldTags })
          success = true
          break
        }
        case 'color': {
          await api.setItemMeta(entry.data.dirPath, entry.data.fileName, { color: entry.data.oldColor })
          get().updateFileMeta(entry.data.fileName, { color: entry.data.oldColor })
          success = true
          break
        }
        case 'compress': {
          await api.fileDelete(entry.data.zipPath)
          success = true
          break
        }
        case 'create-folder': {
          await api.fileDelete(entry.data.path)
          success = true
          break
        }
        case 'create-file': {
          await api.fileDelete(entry.data.path)
          success = true
          break
        }
      }
    } catch {}

    if (success) {
      set((s: any) => {
        const undoStack = s.undoStack.slice(0, -1)
        const redoStack = [...s.redoStack, entry]
        saveUndoHistory(undoStack, redoStack)
        return { undoStack, redoStack }
      })
      get().refresh()
    }
  },

  redo: async () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return
    const entry = redoStack[redoStack.length - 1]
    const api = getApi()
    if (!api) return

    let success = false
    try {
      switch (entry.type) {
        case 'delete': {
          const r = await api.trashFile(entry.data.path)
          if (r?.success) {
            entry.data.trashPath = r.trashPath
            success = true
          }
          break
        }
        case 'rename': {
          await api.fileRename(entry.data.oldPath, entry.data.newPath)
          success = true
          break
        }
        case 'move': {
          await api.fileRename(entry.data.oldPath, entry.data.newPath)
          success = true
          break
        }
        case 'copy': {
          await api.fileCopy(entry.data.srcPath, entry.data.destPath)
          success = true
          break
        }
        case 'replace': {
          const trashR = await api.trashFile(entry.data.destPath)
          if (trashR?.success) {
            entry.data.destTrashPath = trashR.trashPath
            await api.fileCopy(entry.data.srcPath, entry.data.destPath)
            success = true
          }
          break
        }
        case 'tag': {
          await api.setItemMeta(entry.data.dirPath, entry.data.fileName, { tags: entry.data.newTags })
          get().updateFileMeta(entry.data.fileName, { tags: entry.data.newTags })
          success = true
          break
        }
        case 'color': {
          await api.setItemMeta(entry.data.dirPath, entry.data.fileName, { color: entry.data.newColor })
          get().updateFileMeta(entry.data.fileName, { color: entry.data.newColor })
          success = true
          break
        }
        case 'compress': {
          await api.compressFiles(entry.data.sourcePaths, entry.data.zipPath)
          success = true
          break
        }
        case 'create-folder': {
          const dir = entry.data.path.substring(0, entry.data.path.lastIndexOf('\\') !== -1 ? entry.data.path.lastIndexOf('\\') : entry.data.path.lastIndexOf('/'))
          await api.createFolder(dir, entry.data.name)
          success = true
          break
        }
        case 'create-file': {
          const dir = entry.data.path.substring(0, entry.data.path.lastIndexOf('\\') !== -1 ? entry.data.path.lastIndexOf('\\') : entry.data.path.lastIndexOf('/'))
          await api.createFile(dir, entry.data.name)
          success = true
          break
        }
      }
    } catch {}

    if (success) {
      set((s: any) => {
        const redoStack = s.redoStack.slice(0, -1)
        const undoStack = [...s.undoStack, entry]
        saveUndoHistory(undoStack, redoStack)
        return { undoStack, redoStack }
      })
      get().refresh()
    }
  },
})
