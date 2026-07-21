import type { WorkspaceProfile } from '../../types'
import { applyUiSettings } from './uiSettings'
import type { SetState, GetState } from './helpers'

export interface ProfilesSlice {
  profilesOpen: boolean
  setProfilesOpen: (v: boolean) => void
  profiles: WorkspaceProfile[]
  saveProfile: (name: string) => void
  loadProfile: (id: string) => void
  renameProfile: (id: string, name: string) => void
  deleteProfile: (id: string) => void
}

export const createProfilesSlice = (set: SetState, get: GetState): ProfilesSlice => ({
  profilesOpen: false,
  setProfilesOpen: (v) => set({ profilesOpen: v }),
  profiles: (() => {
    try { return JSON.parse(localStorage.getItem('pdx_profiles') || '[]') } catch { return [] }
  })() as WorkspaceProfile[],

  saveProfile: (name) => {
    const state = get()
    const profile: WorkspaceProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
      tabs: state.tabs.map((t: any) => ({
        id: t.id, title: t.title, path: t.path, pinned: t.pinned,
        viewMode: t.viewMode, history: t.history, historyIndex: t.historyIndex,
        dualPane: t.dualPane, dualPaneTabId: t.dualPaneTabId,
      })),
      sidebarOpen: state.sidebarOpen,
      sidebarWidth: state.sidebarWidth,
      ui: { ...state.ui },
      settings: { ...state.settings },
    }
    set((s: any) => {
      const profiles = [...s.profiles, profile]
      localStorage.setItem('pdx_profiles', JSON.stringify(profiles))
      return { profiles }
    })
  },

  loadProfile: (id) => {
    const state = get()
    const profile = state.profiles.find((p: any) => p.id === id)
    if (!profile) return
    set({
      tabs: profile.tabs.map((t: any) => ({
        ...t,
        history: Array.isArray(t.history) ? t.history : [t.path || ''],
        historyIndex: typeof t.historyIndex === 'number' ? t.historyIndex : (t.path ? 0 : -1),
      })),
      activeTabId: profile.tabs[0]?.id || 'tab-1',
      sidebarOpen: profile.sidebarOpen,
      sidebarWidth: profile.sidebarWidth,
      ui: { ...state.ui, ...profile.ui },
      settings: { ...state.settings, ...profile.settings },
    })
    applyUiSettings()
    const firstTab = profile.tabs[0]
    if (firstTab?.path) {
      get().navigateTo(firstTab.path, firstTab.id)
    }
  },

  renameProfile: (id, name) => {
    set((s: any) => {
      const profiles = s.profiles.map((p: any) => p.id === id ? { ...p, name } : p)
      localStorage.setItem('pdx_profiles', JSON.stringify(profiles))
      return { profiles }
    })
  },

  deleteProfile: (id) => {
    set((s: any) => {
      const profiles = s.profiles.filter((p: any) => p.id !== id)
      localStorage.setItem('pdx_profiles', JSON.stringify(profiles))
      return { profiles }
    })
  },
})
