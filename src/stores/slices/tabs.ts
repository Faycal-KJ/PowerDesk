import { generateId } from './helpers'
import type { FileItem, Tab, ViewMode } from '../../types'
import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'
import { pluginManager } from '../../plugins/pluginManager'

async function navigateHistory(
  get: GetState, set: SetState,
  tabId: string, newIdx: number
) {
  const tab = get().tabs.find((t: any) => t.id === tabId)
  if (!tab) return
  const path = tab.history[newIdx]
  set((s: any) => ({
    tabs: s.tabs.map((t: any) =>
      t.id === tabId
        ? { ...t, path, title: path.split('\\').pop() || path.split('/').pop() || 'Untitled', historyIndex: newIdx }
        : t
    ),
  }))
  const api = getApi()
  if (api && tabId === get().activeTabId) {
    set({ loading: true, searchQuery: '', focusedFileIndex: -1 })
    const result = await api.readDir(path)
    const files = result || []
    const tagSet = new Set<string>()
    for (const f of files) {
      if (f.tags) for (const t of f.tags) tagSet.add(t)
    }
    const existingTags = new Set(get().allTags)
    for (const t of tagSet) existingTags.add(t)
    set({ files, loading: false, allTags: Array.from(existingTags).sort() })
    get().loadFolderSizes()
  }
}

export interface TabsSlice {
  tabs: Tab[]
  activeTabId: string
  addTab: (path?: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  pinTab: (id: string) => void
  duplicateTab: (id: string) => void
  updateTabPath: (id: string, path: string) => void
  navigateBack: (id: string) => void
  navigateForward: (id: string) => void
  setTabViewMode: (id: string, mode: ViewMode) => void
  toggleDualPane: (id: string) => void
  setDualPaneTab: (id: string, otherId: string) => void
  moveTab: (fromId: string, toId: string) => void

  focusedPane: 'left' | 'right'
  setFocusedPane: (p: 'left' | 'right') => void

  files: FileItem[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  navigateTo: (path: string, tapTabId?: string) => Promise<void>
  refresh: () => Promise<void>
  reloadTab: (id: string) => Promise<void>

  iconSize: number
  setIconSize: (s: number) => void
  showThumbnails: boolean
  setShowThumbnails: (v: boolean) => void

  folderSizes: Record<string, number>
  setFolderSizes: (sizes: Record<string, number>) => void
  loadFolderSizes: () => Promise<void>

  initialDirs: Record<string, string>
  setInitialDirs: (d: Record<string, string>) => void
  appendWorkspaceTabs: (tabs: any[]) => void
  persistWorkspace: () => void
}

export const createTabsSlice = (set: SetState, get: GetState): TabsSlice => ({
  tabs: [
    {
      id: 'tab-1',
      title: 'Home',
      path: '',
      pinned: false,
      viewMode: 'grid',
      history: [''],
      historyIndex: -1,
      dualPane: false,
    },
  ],
  activeTabId: 'tab-1',

  focusedPane: 'left',
  setFocusedPane: (p) => set({ focusedPane: p }),

  iconSize: 32,
  setIconSize: (s) => set({ iconSize: Math.max(16, Math.min(128, s)) }),

  showThumbnails: true,
  setShowThumbnails: (v) => set({ showThumbnails: v }),

  folderSizes: {},
  setFolderSizes: (sizes) => set((s: any) => ({ folderSizes: { ...s.folderSizes, ...sizes } })),

  loadFolderSizes: async () => {
    const api = getApi()
    if (!api?.getFolderSizesBatch) return
    const state = get()
    const dirs = state.files.filter((f: any) => f.isDirectory).map((f: any) => f.path)
    if (dirs.length === 0) return
    const sizes = await api.getFolderSizesBatch(dirs)
    if (sizes) set((s: any) => ({ folderSizes: { ...s.folderSizes, ...sizes } }))
  },

  files: [],
  loading: false,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  navigateTo: async (path, tapTabId) => {
    const api = getApi()
    if (!api) return
    const state = get()
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId)
    let id = tapTabId || state.activeTabId
    if (!tapTabId && activeTab?.dualPane) {
      id = state.focusedPane === 'right' && activeTab.dualPaneTabId
        ? activeTab.dualPaneTabId
        : state.activeTabId
    }
    const previousPath = state.tabs.find((t: any) => t.id === id)?.path
    get().updateTabPath(id, path)
    if (id === state.activeTabId) {
      set({ loading: true, searchQuery: '', focusedFileIndex: -1 })
      const result = await api.readDir(path)
      set({ files: result || [], loading: false })
    }
    if (api.trackRecent && path) {
      api.trackRecent(path)
    }
    pluginManager.emit('didNavigate', { path, tabId: id, previousPath })
  },

  refresh: async () => {
    const api = getApi()
    if (!api?.refreshDir) return
    const tab = get().tabs.find((t: any) => t.id === get().activeTabId)
    if (tab && tab.path) {
      const result = await api.refreshDir(tab.path)
      if (result) set({ files: result, loading: false })
    }
  },

  reloadTab: async (id) => {
    const state = get()
    const tab = state.tabs.find((t: any) => t.id === id)
    if (!tab || !tab.path) {
      set({ files: [], loading: false })
      return
    }
    set({ loading: true, searchQuery: '' })
    const api = getApi()
    if (!api) return
    const result = await api.readDir(tab.path)
    const files = result || []
    const tagSet = new Set<string>()
    for (const f of files) {
      if (f.tags) for (const t of f.tags) tagSet.add(t)
    }
    const existingTags = new Set(state.allTags)
    for (const t of tagSet) existingTags.add(t)
    set({ files, loading: false, allTags: Array.from(existingTags).sort() })
    get().loadFolderSizes()
  },

  addTab: (path) => {
    const id = `tab-${generateId()}`
    const title = path
      ? path.split('\\').pop() || path.split('/').pop() || 'New Tab'
      : 'New Tab'
    const tab = {
      id,
      title,
      path: path || '',
      pinned: false,
      viewMode: 'grid',
      history: path ? [path] : [''],
      historyIndex: path ? 0 : -1,
      dualPane: false,
    }
    set((s: any) => ({ tabs: [...s.tabs, tab], activeTabId: id }))
    if (path) get().navigateTo(path, id)
  },

  closeTab: (id) => {
    const state = get()
    const idx = state.tabs.findIndex((t: any) => t.id === id)
    const filtered = state.tabs.filter((t: any) => t.id !== id)
    if (filtered.length === 0) return
    let newActive = state.activeTabId
    if (state.activeTabId === id) {
      newActive = filtered[Math.min(idx, filtered.length - 1)].id
    }
    const cleaned = filtered.map((t: any) =>
      t.dualPaneTabId === id ? { ...t, dualPaneTabId: undefined, dualPane: false } : t
    )
    set({ tabs: cleaned, activeTabId: newActive })
    const newTab = cleaned.find((t: any) => t.id === newActive)
    if (newTab && newTab.path) {
      get().reloadTab(newActive)
    }
  },

  setActiveTab: (id) => {
    const previousTabId = get().activeTabId
    set({ activeTabId: id })
    get().reloadTab(id)
    pluginManager.emit('didTabChange', { tabId: id, previousTabId })
  },

  pinTab: (id) =>
    set((s: any) => ({
      tabs: s.tabs.map((t: any) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
    })),

  duplicateTab: (id) => {
    const source = get().tabs.find((t: any) => t.id === id)
    if (!source) return
    const newId = `tab-${generateId()}`
    const dup = { ...source, id: newId, title: `${source.title} (copy)`, dualPane: false }
    set((s: any) => ({ tabs: [...s.tabs, dup], activeTabId: newId }))
  },

  updateTabPath: (id, path) =>
    set((s: any) => {
      const tab = s.tabs.find((t: any) => t.id === id)
      if (!tab) return s
      const history = tab.history.slice(0, tab.historyIndex + 1)
      history.push(path)
      return {
        tabs: s.tabs.map((t: any) =>
          t.id === id
            ? {
                ...t,
                path,
                title: path.split('\\').pop() || path.split('/').pop() || 'Untitled',
                history,
                historyIndex: history.length - 1,
              }
            : t
        ),
      }
    }),

  navigateBack: async (id) => {
    const tab = get().tabs.find((t: any) => t.id === id)
    if (!tab || tab.historyIndex <= 0) return
    await navigateHistory(get, set, id, tab.historyIndex - 1)
  },

  navigateForward: async (id) => {
    const tab = get().tabs.find((t: any) => t.id === id)
    if (!tab || tab.historyIndex >= tab.history.length - 1) return
    await navigateHistory(get, set, id, tab.historyIndex + 1)
  },

  setTabViewMode: (id, mode) =>
    set((s: any) => ({
      tabs: s.tabs.map((t: any) => (t.id === id ? { ...t, viewMode: mode } : t)),
    })),

  toggleDualPane: (id) => {
    const state = get()
    const tab = state.tabs.find((t: any) => t.id === id)
    if (!tab) return
    if (tab.dualPane) {
      set((s: any) => ({
        tabs: s.tabs.map((t: any) =>
          t.id === id ? { ...t, dualPane: false, dualPaneTabId: undefined } : t
        ),
      }))
    } else {
      const otherTab = state.tabs.find((t: any) => t.id !== id && t.path)
      if (otherTab) {
        set((s: any) => ({
          tabs: s.tabs.map((t: any) =>
            t.id === id ? { ...t, dualPane: true, dualPaneTabId: otherTab.id } : t
          ),
        }))
      } else {
        const newId = `tab-${generateId()}`
        const newTab = {
          id: newId,
          title: 'Dual Pane',
          path: tab.path,
          pinned: false,
          viewMode: tab.viewMode,
          history: tab.path ? [tab.path] : [''],
          historyIndex: tab.path ? 0 : -1,
          dualPane: false,
        }
        set((s: any) => ({ tabs: [...s.tabs, newTab] }))
        set((s: any) => ({
          tabs: s.tabs.map((t: any) =>
            t.id === id ? { ...t, dualPane: true, dualPaneTabId: newId } : t
          ),
        }))
      }
    }
  },

  setDualPaneTab: (id, otherId) => {
    set((s: any) => ({
      tabs: s.tabs.map((t: any) =>
        t.id === id ? { ...t, dualPane: true, dualPaneTabId: otherId } : t
      ),
    }))
  },

  moveTab: (fromId, toId) => {
    set((s: any) => {
      const fromIdx = s.tabs.findIndex((t: any) => t.id === fromId)
      const toIdx = s.tabs.findIndex((t: any) => t.id === toId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return s
      const newTabs = [...s.tabs]
      const [moved] = newTabs.splice(fromIdx, 1)
      newTabs.splice(toIdx, 0, moved)
      return { tabs: newTabs }
    })
  },

  initialDirs: {},
  setInitialDirs: (d) => set({ initialDirs: d }),

  appendWorkspaceTabs: (savedTabs) => {
    if (!savedTabs || savedTabs.length === 0) return
    set((s: any) => {
      const existing = s.tabs
      const merged = [...existing]
      for (const st of savedTabs) {
        if (!merged.find((t: any) => t.id === st.id)) {
          merged.push({
            ...st,
            history: Array.isArray(st.history) ? st.history : [st.path || ''],
            historyIndex: typeof st.historyIndex === 'number' ? st.historyIndex : (st.path ? 0 : -1),
          })
        }
      }
      return { tabs: merged }
    })
  },

  persistWorkspace: () => {
    const state = get()
    const tabsData = state.tabs.map((t: any) => ({
      id: t.id,
      title: t.title,
      path: t.path,
      pinned: t.pinned,
      viewMode: t.viewMode,
      history: t.history,
      historyIndex: t.historyIndex,
      dualPane: t.dualPane,
      dualPaneTabId: t.dualPaneTabId,
    }))
    const api = getApi()
    if (api?.saveWorkspace) {
      api.saveWorkspace(tabsData)
    }
  },
})
