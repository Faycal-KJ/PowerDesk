import type { SavedSearch } from '../../types'
import type { SetState, GetState } from './helpers'

export interface SavedSearchesSlice {
  savedSearches: SavedSearch[]
  addSavedSearch: (name: string, query: string) => void
  removeSavedSearch: (id: string) => void
  renameSavedSearch: (id: string, name: string) => void
}

export const createSavedSearchesSlice = (set: SetState, _get: GetState): SavedSearchesSlice => ({
  savedSearches: (() => {
    try { return JSON.parse(localStorage.getItem('pdx_saved_searches') || '[]') } catch { return [] }
  })() as SavedSearch[],

  addSavedSearch: (name, query) => {
    set((s: any) => {
      const entry: SavedSearch = {
        id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name, query, createdAt: Date.now(),
      }
      const savedSearches = [...s.savedSearches, entry]
      localStorage.setItem('pdx_saved_searches', JSON.stringify(savedSearches))
      return { savedSearches }
    })
  },

  removeSavedSearch: (id) => {
    set((s: any) => {
      const savedSearches = s.savedSearches.filter((ss: any) => ss.id !== id)
      localStorage.setItem('pdx_saved_searches', JSON.stringify(savedSearches))
      return { savedSearches }
    })
  },

  renameSavedSearch: (id, name) => {
    set((s: any) => {
      const savedSearches = s.savedSearches.map((ss: any) => ss.id === id ? { ...ss, name } : ss)
      localStorage.setItem('pdx_saved_searches', JSON.stringify(savedSearches))
      return { savedSearches }
    })
  },
})
