import { create } from 'zustand'
import type { UiSettings } from './slices/uiSettings'
import { loadUiSettings, saveUiSettings, applyUiSettings, _setUiGetter } from './slices/uiSettings'
import { createTabsSlice, type TabsSlice } from './slices/tabs'
import { createFilesSlice, type FilesSlice } from './slices/files'
import { createUndoSlice, type UndoSlice } from './slices/undo'
import { createTransfersSlice, type TransfersSlice } from './slices/transfers'
import { createClipboardSlice, type ClipboardSlice } from './slices/clipboard'
import { createSearchSlice, type SearchSlice } from './slices/search'
import { createCommandHistorySlice, type CommandHistorySlice } from './slices/commandHistory'
import { createFavoriteCommandsSlice, type FavoriteCommandsSlice } from './slices/favoriteCommands'
import { createFavoritesSlice, type FavoritesSlice } from './slices/favorites'
import { createProfilesSlice, type ProfilesSlice } from './slices/profiles'
import { createSavedSearchesSlice, type SavedSearchesSlice } from './slices/savedSearches'
import { createSyncSlice, type SyncSlice } from './slices/sync'
import { createSidebarSlice, type SidebarSlice } from './slices/sidebar'

// Re-export UiSettings for backward compat
export type { UiSettings }
export { applyUiSettings }

export interface PowerDeskState extends TabsSlice, FilesSlice, UndoSlice, SidebarSlice, TransfersSlice, ClipboardSlice, SearchSlice, CommandHistorySlice, FavoriteCommandsSlice, FavoritesSlice, ProfilesSlice, SavedSearchesSlice, SyncSlice {
  ui: UiSettings
  setUi: (u: Partial<UiSettings>) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  settings: {
    defaultView: 'grid' | 'list' | 'gallery'
    showHidden: boolean
    sidebarDefault: boolean
    confirmDelete: boolean
    startupPath: string
    recentLimit: number
  }
  setSettings: (s: any) => void
  openTool: 'qr' | 'terminal' | 'color' | null
  setOpenTool: (t: 'qr' | 'terminal' | 'color' | null) => void
  folderAnalysisOpen: boolean
  setFolderAnalysisOpen: (v: boolean) => void
  folderAnalysisPath: string | null
  openFolderAnalysis: (path: string) => void
}

export const useStore = create<PowerDeskState>((set, get) => {
  const sliceSet = set
  const sliceGet = get

  const tabs = createTabsSlice(set as any, get as any)
  const files = createFilesSlice(set as any, get as any)
  const undo = createUndoSlice(set as any, get as any)
  const sidebar = createSidebarSlice(sliceSet)
  const transfers = createTransfersSlice(sliceSet, sliceGet)
  const clipboard = createClipboardSlice(sliceSet, sliceGet)
  const search = createSearchSlice(sliceSet, sliceGet)
  const commandHistory = createCommandHistorySlice(sliceSet, sliceGet)
  const favoriteCommands = createFavoriteCommandsSlice(sliceSet, sliceGet)
  const favorites = createFavoritesSlice(sliceSet, sliceGet)
  const profiles = createProfilesSlice(sliceSet, sliceGet)
  const savedSearches = createSavedSearchesSlice(sliceSet, sliceGet)
  const sync = createSyncSlice(sliceSet, sliceGet)

  return {
    ...tabs,
    ...files,
    ...undo,
    ...sidebar,
    ...transfers,
    ...clipboard,
    ...search,
    ...commandHistory,
    ...favoriteCommands,
    ...favorites,
    ...profiles,
    ...savedSearches,
    ...sync,

    ui: loadUiSettings(),
    setUi: (u) => {
      set((prev) => {
        const next = { ...prev.ui, ...u }
        saveUiSettings(next)
        return { ui: next }
      })
      setTimeout(() => applyUiSettings(), 0)
    },

    settingsOpen: false,
    setSettingsOpen: (v) => set({ settingsOpen: v }),
    settings: {
      ...(JSON.parse(localStorage.getItem('pdx_settings') || '{}')),
      defaultView: 'grid' as 'grid' | 'list' | 'gallery',
      showHidden: false,
      sidebarDefault: true,
      confirmDelete: true,
      startupPath: '' as string,
      recentLimit: 5,
    },
    setSettings: (s) => set((prev) => {
      const next = { ...prev.settings, ...s }
      localStorage.setItem('pdx_settings', JSON.stringify(next))
      return { settings: next }
    }),

    openTool: null as 'qr' | 'terminal' | 'color' | null,
    setOpenTool: (t) => set({ openTool: t }),

    folderAnalysisOpen: false,
    setFolderAnalysisOpen: (v) => set({ folderAnalysisOpen: v }),
    folderAnalysisPath: null as string | null,
    openFolderAnalysis: (path) => set({ folderAnalysisOpen: true, folderAnalysisPath: path }),
  }
})

// Wire up the ui getter to avoid circular dependency
_setUiGetter(() => useStore.getState().ui)
