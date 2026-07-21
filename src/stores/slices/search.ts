import type { SearchFilters } from '../../types'
import type { SetState, GetState } from './helpers'

export interface SearchSlice {
  searchFilters: SearchFilters
  setSearchFilters: (f: Partial<SearchFilters>) => void
  resetSearchFilters: () => void
}

export const createSearchSlice = (set: SetState, _get: GetState): SearchSlice => ({
  searchFilters: {
    minSize: null, maxSize: null, minDate: null, maxDate: null,
    extension: null, type: 'all', author: null, tags: null, color: null,
  },
  setSearchFilters: (f) => set((s: any) => ({
    searchFilters: { ...s.searchFilters, ...f },
  })),
  resetSearchFilters: () => set({
    searchFilters: {
      minSize: null, maxSize: null, minDate: null, maxDate: null,
      extension: null, type: 'all', author: null, tags: null, color: null,
    },
  }),
})
