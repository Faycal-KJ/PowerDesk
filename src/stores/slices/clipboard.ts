import type { ClipboardEntry } from '../../types'
import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'

export interface ClipboardSlice {
  clipboardOpen: boolean
  setClipboardOpen: (v: boolean) => void
  clipboardHistory: ClipboardEntry[]
  addClipboardEntry: (entry: Omit<ClipboardEntry, 'id' | 'timestamp' | 'favorite'>) => void
  toggleClipboardFavorite: (id: string) => void
  removeClipboardEntry: (id: string) => void
  clearClipboardHistory: () => void
  copyClipboardEntry: (entry: ClipboardEntry) => void

  clipboardItems: string[]
  clipboardOp: 'copy' | 'cut' | null
  setClipboard: (paths: string[], op: 'copy' | 'cut') => Promise<void>
  pasteClipboard: (destDir: string) => Promise<void>
  pasteConflicts: Array<{ src: string; dest: string; name: string }> | null
  _pasteQueuedPairs: Array<{ src: string; dest: string; name: string }>
  _pasteDestDir: string
  _pastePerFileActions: Record<number, 'replace' | 'skip' | 'rename'>
  setPastePerFileAction: (idx: number, action: 'replace' | 'skip' | 'rename') => void
  resolvePasteConflicts: (resolution: { action: 'replace' | 'skip' | 'rename'; applyToAll?: boolean } | null) => Promise<void>
}

export const createClipboardSlice = (set: SetState, get: GetState): ClipboardSlice => ({
  clipboardOpen: false,
  setClipboardOpen: (v) => set({ clipboardOpen: v }),
  clipboardHistory: (() => {
    try { return JSON.parse(localStorage.getItem('pdx_clipboard') || '[]') } catch { return [] }
  })() as ClipboardEntry[],

  addClipboardEntry: (entry) => {
    set((s: any) => {
      const isDuplicate = s.clipboardHistory.some((e: any) => {
        if (e.type !== entry.type) return false
        if (entry.type === 'file') return JSON.stringify(e.filePaths) === JSON.stringify(entry.filePaths)
        return e.content === entry.content
      })
      if (isDuplicate) return s
      const full: ClipboardEntry = {
        ...entry,
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        favorite: false,
      }
      const clipboardHistory = [full, ...s.clipboardHistory].slice(0, 200)
      localStorage.setItem('pdx_clipboard', JSON.stringify(clipboardHistory))
      return { clipboardHistory }
    })
  },

  toggleClipboardFavorite: (id) => {
    set((s: any) => {
      const clipboardHistory = s.clipboardHistory.map((e: any) =>
        e.id === id ? { ...e, favorite: !e.favorite } : e
      )
      localStorage.setItem('pdx_clipboard', JSON.stringify(clipboardHistory))
      return { clipboardHistory }
    })
  },

  removeClipboardEntry: (id) => {
    set((s: any) => {
      const clipboardHistory = s.clipboardHistory.filter((e: any) => e.id !== id)
      localStorage.setItem('pdx_clipboard', JSON.stringify(clipboardHistory))
      return { clipboardHistory }
    })
  },

  clearClipboardHistory: () => {
    set((s: any) => {
      const onlyFavs = s.clipboardHistory.filter((e: any) => e.favorite)
      localStorage.setItem('pdx_clipboard', JSON.stringify(onlyFavs))
      return { clipboardHistory: onlyFavs }
    })
  },

  copyClipboardEntry: (entry) => {
    const api = getApi()
    if (!api) return
    if (entry.type === 'file' && entry.filePaths?.length) {
      api.setClipboard(entry.filePaths, 'copy')
      navigator.clipboard?.writeText(entry.fileNames?.join('\n') || '')
    } else {
      navigator.clipboard?.writeText(entry.content)
    }
  },

  clipboardItems: [],
  clipboardOp: null,
  pasteConflicts: null,
  _pasteQueuedPairs: [] as Array<{ src: string; dest: string; name: string }>,
  _pasteDestDir: '',
  _pastePerFileActions: {} as Record<number, 'replace' | 'skip' | 'rename'>,

  setPastePerFileAction: (idx, action) => set((s: any) => ({
    _pastePerFileActions: { ...s._pastePerFileActions, [idx]: action }
  })),

  setClipboard: async (paths, op) => {
    set({ clipboardItems: paths, clipboardOp: op })
    const api = getApi()
    if (api?.setClipboard) {
      await api.setClipboard(paths, op)
    }
    const fileNames = paths.map((p) => p.split('\\').pop() || p.split('/').pop() || '')
    get().addClipboardEntry({
      type: 'file',
      content: fileNames.join(', '),
      filePaths: paths,
      fileNames,
    })
    get().logCommand({ type: op, description: `${op === 'copy' ? 'Copy' : 'Cut'} ${fileNames.length} item(s)`, filePaths: paths, data: { fileNames } })
  },

  pasteClipboard: async (destDir) => {
    const { clipboardItems, clipboardOp } = get()
    if (!clipboardItems.length || !clipboardOp) return

    const api = getApi()
    if (!api) return

    const srcResults: Record<string, { exists: boolean }> = await api.checkFilesExist(clipboardItems)
    const validItems = clipboardItems.filter((src: string) => srcResults[src]?.exists)

    if (validItems.length === 0) return

    const pairs = validItems.map((src: string) => {
      const baseName = src.split('\\').pop() || src.split('/').pop() || ''
      return { src, dest: destDir + '\\' + baseName, name: baseName }
    })

    if (api?.checkFilesExist) {
      const existResults: Record<string, { exists: boolean }> = await api.checkFilesExist(pairs.map((p: { dest: string }) => p.dest))
      const conflicts = pairs.filter((p: { dest: string }) => existResults[p.dest]?.exists)
      if (conflicts.length > 0) {
        set({ pasteConflicts: conflicts, _pasteQueuedPairs: pairs, _pasteDestDir: destDir })
        return
      }
    }

    for (const p of pairs) {
      get().startTransfer(p.src, p.dest, clipboardOp === 'cut' ? 'move' : 'copy')
      if (clipboardOp === 'cut') {
        get().pushUndo({
          type: 'move',
          description: `Move "${p.name}"`,
          data: { oldPath: p.src, newPath: p.dest, name: p.name },
        })
      } else {
        get().pushUndo({
          type: 'copy',
          description: `Copy "${p.name}"`,
          data: { srcPath: p.src, destPath: p.dest, name: p.name },
        })
      }
    }
    if (clipboardOp === 'cut') {
      set({ clipboardItems: [], clipboardOp: null, transferOpen: true })
    } else {
      set({ transferOpen: true })
    }
    get().logCommand({ type: clipboardOp, description: `Paste ${pairs.length} item(s) to "${destDir.split('\\').pop() || destDir.split('/').pop()}"`, filePaths: pairs.map((p: { src: string }) => p.src), data: { destDir, op: clipboardOp } })
  },

  resolvePasteConflicts: async (resolution) => {
    const { clipboardOp, _pasteQueuedPairs, pasteConflicts, _pastePerFileActions, _pasteDestDir } = get()
    if (!resolution) {
      set({ pasteConflicts: null, _pasteQueuedPairs: [], _pastePerFileActions: {}, _pasteDestDir: '' })
      return
    }

    const api = getApi()
    if (!api) return

    const srcResults: Record<string, { exists: boolean }> = await api.checkFilesExist(_pasteQueuedPairs.map((p: any) => p.src))
    const validPairs = _pasteQueuedPairs.filter((p: any) => srcResults[p.src]?.exists)

    if (validPairs.length === 0) {
      set({ pasteConflicts: null, _pasteQueuedPairs: [], _pastePerFileActions: {}, _pasteDestDir: '' })
      return
    }

    const conflictNames = new Set((pasteConflicts || []).map((c: any) => c.dest))

    async function getRenameDest(name: string): Promise<string> {
      const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
      const base = ext ? name.slice(0, -ext.length) : name
      let i = 1
      let renamed: string
      do {
        renamed = _pasteDestDir + '\\' + base + ` (${i})` + ext
        i++
        const existing = await api!.checkFilesExist([renamed])
        if (!conflictNames.has(renamed) && !validPairs.some((p: any) => p.dest === renamed) && !existing[renamed]?.exists) break
      } while (true)
      conflictNames.add(renamed)
      return renamed
    }

    async function transferAndUndo(p: { src: string; dest: string; name: string }, destOverride?: string, isReplace = false) {
      const actualDest = destOverride || p.dest
      let destTrashPath: string | undefined
      if (isReplace && actualDest) {
        const srcCheck = await api!.checkFilesExist([actualDest])
        if (srcCheck[actualDest]?.exists) {
          const trashResult = await api!.trashFile(actualDest)
          if (trashResult?.success) destTrashPath = trashResult.trashPath
        }
      }
      get().startTransfer(p.src, actualDest, clipboardOp === 'cut' ? 'move' : 'copy')
      if (isReplace && destTrashPath) {
        get().pushUndo({ type: 'replace', description: `Replace "${p.name}"`, data: { srcPath: p.src, destPath: actualDest, name: p.name, destTrashPath } })
      } else if (clipboardOp === 'cut') {
        get().pushUndo({ type: 'move', description: `Move "${p.name}"`, data: { oldPath: p.src, newPath: actualDest, name: p.name } })
      } else {
        get().pushUndo({ type: 'copy', description: `Copy "${p.name}"`, data: { srcPath: p.src, destPath: actualDest, name: p.name } })
      }
    }

    if (resolution.applyToAll) {
      for (const p of validPairs) {
        if (!conflictNames.has(p.dest)) {
          await transferAndUndo(p)
        } else if (resolution.action === 'replace') {
          await transferAndUndo(p, undefined, true)
        } else if (resolution.action === 'rename') {
          await transferAndUndo(p, await getRenameDest(p.name))
        }
      }
    } else {
      for (let i = 0; i < validPairs.length; i++) {
        const p = validPairs[i]
        if (!conflictNames.has(p.dest)) {
          await transferAndUndo(p)
        } else {
          const action = _pastePerFileActions[i] || 'skip'
          if (action === 'replace') {
            await transferAndUndo(p, undefined, true)
          } else if (action === 'rename') {
            await transferAndUndo(p, await getRenameDest(p.name))
          }
        }
      }
    }

    set((s: any) => ({
      pasteConflicts: null,
      _pasteQueuedPairs: [],
      _pastePerFileActions: {},
      _pasteDestDir: '',
      ...(clipboardOp === 'cut' ? { clipboardItems: [], clipboardOp: null } : {}),
      transferOpen: true,
    }))
  },
})
