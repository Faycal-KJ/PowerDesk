import type { FileItem } from '../../types'
import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'
import { pluginManager } from '../../plugins/pluginManager'

export interface FilesSlice {
  activeTagFilter: string | null
  setActiveTagFilter: (tag: string | null) => void
  allTags: string[]
  setAllTags: (tags: string[]) => void
  addTagToFile: (dirPath: string, fileName: string, tag: string) => Promise<void>
  removeTagFromFile: (dirPath: string, fileName: string, tag: string) => Promise<void>

  contextTarget: { item: FileItem; x: number; y: number } | null
  setContextTarget: (t: { item: FileItem; x: number; y: number } | null) => void
  bgContextMenu: { x: number; y: number } | null
  setBgContextMenu: (t: { x: number; y: number } | null) => void

  deleteFile: (filePath: string) => Promise<void>
  renameFile: (oldPath: string, newName: string) => Promise<void>
  createFolder: (name: string) => Promise<void>
  createFile: (name: string) => Promise<void>
  setColor: (dirPath: string, name: string, color: string | undefined) => Promise<void>
  updateFileMeta: (name: string, updates: Partial<FileItem>) => void

  previewFile: FileItem | null
  setPreviewFile: (f: FileItem | null) => void
  previewPrev: () => void
  previewNext: () => void

  selectedPathsForContext: string[]
  setSelectedPathsForContext: (paths: string[]) => void
  focusedFileIndex: number
  setFocusedFileIndex: (i: number) => void

  propertiesFile: FileItem | null
  setPropertiesFile: (f: FileItem | null) => void
}

export const createFilesSlice = (set: SetState, get: GetState): FilesSlice => ({
  activeTagFilter: null,
  setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),
  allTags: [],
  setAllTags: (tags) => set({ allTags: tags }),

  addTagToFile: async (dirPath, fileName, tag) => {
    const api = getApi()
    if (!api) return
    const state = get()
    const file = state.files.find((f: any) => f.name === fileName)
    const currentTags = file?.tags || []
    if (currentTags.includes(tag)) return
    const oldTags = [...currentTags]
    const newTags = [...currentTags, tag]
    await api.setItemMeta(dirPath, fileName, { tags: newTags })
    state.updateFileMeta(fileName, { tags: newTags })
    const uniqueTags = new Set(state.allTags)
    uniqueTags.add(tag)
    set({ allTags: Array.from(uniqueTags).sort() })
    get().pushUndo({
      type: 'tag',
      description: `Add tag "${tag}" to "${fileName}"`,
      data: { dirPath, fileName, oldTags, newTags },
    })
    get().logCommand({ type: 'tag', description: `Add tag "${tag}" to "${fileName}"`, filePaths: [], data: { fileName, tag } })
  },

  removeTagFromFile: async (dirPath, fileName, tag) => {
    const api = getApi()
    if (!api) return
    const state = get()
    const file = state.files.find((f: any) => f.name === fileName)
    const currentTags = file?.tags || []
    const oldTags = [...currentTags]
    const newTags = currentTags.filter((t: string) => t !== tag)
    await api.setItemMeta(dirPath, fileName, { tags: newTags })
    state.updateFileMeta(fileName, { tags: newTags })
    get().pushUndo({
      type: 'tag',
      description: `Remove tag "${tag}" from "${fileName}"`,
      data: { dirPath, fileName, oldTags, newTags },
    })
  },

  contextTarget: null,
  setContextTarget: (t) => set({ contextTarget: t }),
  bgContextMenu: null,
  setBgContextMenu: (t) => set({ bgContextMenu: t }),

  deleteFile: async (filePath) => {
    const api = getApi()
    if (!api) return
    const hookResult = await pluginManager.executeBeforeHooks('delete', filePath)
    if (hookResult.cancelled) return
    const file = get().files.find((f: any) => f.path === filePath)
    const r = await api.trashFile(filePath)
    if (r?.success) {
      get().pushUndo({
        type: 'delete',
        description: `Delete "${file?.name || filePath}"`,
        data: { path: filePath, name: file?.name || '', trashPath: r.trashPath },
      })
      get().logCommand({ type: 'delete', description: `Delete "${file?.name || filePath}"`, filePaths: [filePath], data: { name: file?.name || '' } })
      pluginManager.emit('didFileOperation', { type: 'delete', source: filePath, timestamp: Date.now() })
    }
    pluginManager.executeAfterHooks('delete', filePath)
    get().refresh()
  },

  renameFile: async (oldPath, newName) => {
    const api = getApi()
    if (!api) return
    const hookResult = await pluginManager.executeBeforeHooks('rename', oldPath, newName)
    if (hookResult.cancelled) return
    const sep = oldPath.includes('\\') ? '\\' : '/'
    const parts = oldPath.split(sep)
    parts.pop()
    const dir = parts.join(sep)
    const newPath = dir + sep + newName
    const oldName = oldPath.split(sep).pop() || ''
    await api.fileRename(oldPath, newPath)
    get().pushUndo({
      type: 'rename',
      description: `Rename "${oldName}" to "${newName}"`,
      data: { oldPath, newPath, oldName, newName },
    })
    get().logCommand({ type: 'rename', description: `Rename "${oldName}" to "${newName}"`, filePaths: [oldPath, newPath], data: { oldName, newName } })
    pluginManager.emit('didFileOperation', { type: 'rename', source: oldPath, destination: newPath, timestamp: Date.now() })
    pluginManager.executeAfterHooks('rename', oldPath, newPath)
    get().refresh()
  },

  createFolder: async (name) => {
    const api = getApi()
    if (!api) return
    const state = get()
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId)
    if (!tab?.path) return
    const hookResult = await pluginManager.executeBeforeHooks('createFolder', tab.path, name)
    if (hookResult.cancelled) return
    await api.createFolder(tab.path, name)
    const sep = tab.path.includes('\\') ? '\\' : '/'
    const fullPath = tab.path + sep + name
    get().pushUndo({
      type: 'create-folder',
      description: `Create folder "${name}"`,
      data: { path: fullPath, name },
    })
    get().logCommand({ type: 'create-folder', description: `Create folder "${name}"`, filePaths: [fullPath], data: { name } })
    pluginManager.emit('didFileOperation', { type: 'create', source: fullPath, timestamp: Date.now() })
    pluginManager.executeAfterHooks('createFolder', fullPath)
    get().refresh()
  },

  createFile: async (name) => {
    const api = getApi()
    if (!api) return
    const state = get()
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId)
    if (!tab?.path) return
    const hookResult = await pluginManager.executeBeforeHooks('createFile', tab.path, name)
    if (hookResult.cancelled) return
    await api.createFile(tab.path, name)
    const sep = tab.path.includes('\\') ? '\\' : '/'
    const fullPath = tab.path + sep + name
    get().pushUndo({
      type: 'create-file',
      description: `Create file "${name}"`,
      data: { path: fullPath, name },
    })
    get().logCommand({ type: 'create-file', description: `Create file "${name}"`, filePaths: [fullPath], data: { name } })
    pluginManager.emit('didFileOperation', { type: 'create', source: fullPath, timestamp: Date.now() })
    pluginManager.executeAfterHooks('createFile', fullPath)
    get().refresh()
  },

  setColor: async (dirPath, name, color) => {
    const api = getApi()
    if (!api) return
    const file = get().files.find((f: any) => f.name === name)
    const oldColor = file?.color
    await api.setItemMeta(dirPath, name, { color })
    get().updateFileMeta(name, { color })
    get().pushUndo({
      type: 'color',
      description: `${color ? 'Set' : 'Remove'} color on "${name}"`,
      data: { dirPath, fileName: name, oldColor, newColor: color },
    })
    get().logCommand({ type: 'color', description: `${color ? 'Set' : 'Remove'} color on "${name}"`, filePaths: [], data: { fileName: name, color } })
  },

  updateFileMeta: (name, updates) => {
    set((s: any) => ({
      files: s.files.map((f: any) =>
        f.name === name ? { ...f, ...updates } : f
      ),
    }))
  },

  previewFile: null,
  setPreviewFile: (f) => set({ previewFile: f }),
  previewPrev: () => {
    const { files, previewFile } = get()
    if (!previewFile || files.length === 0) return
    const idx = files.findIndex((f: any) => f.path === previewFile.path)
    if (idx > 0) set({ previewFile: files[idx - 1] })
  },
  previewNext: () => {
    const { files, previewFile } = get()
    if (!previewFile || files.length === 0) return
    const idx = files.findIndex((f: any) => f.path === previewFile.path)
    if (idx < files.length - 1) set({ previewFile: files[idx + 1] })
  },

  selectedPathsForContext: [] as string[],
  setSelectedPathsForContext: (paths: string[]) => set({ selectedPathsForContext: paths }),
  focusedFileIndex: -1,
  setFocusedFileIndex: (i) => set({ focusedFileIndex: i }),

  propertiesFile: null,
  setPropertiesFile: (f) => set({ propertiesFile: f }),
})
