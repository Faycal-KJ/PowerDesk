import type { FavoriteItem } from '../../types'
import type { SetState, GetState } from './helpers'

export interface FavoritesSlice {
  favoriteBarOpen: boolean
  setFavoriteBarOpen: (v: boolean) => void
  favorites: FavoriteItem[]
  addFavorite: (path: string, type?: 'folder' | 'file') => void
  removeFavorite: (path: string) => void
  reorderFavorites: (from: number, to: number) => void
}

export const createFavoritesSlice = (set: SetState, _get: GetState): FavoritesSlice => ({
  favoriteBarOpen: false,
  setFavoriteBarOpen: (v) => set({ favoriteBarOpen: v }),
  favorites: (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('pdx_favorites') || '[]')
      if (raw.length > 0 && typeof raw[0] === 'string') {
        return raw.map((p: string) => ({ path: p, type: 'folder' as const, name: p.split('\\').pop() || p.split('/').pop() || p, addedAt: Date.now() }))
      }
      return raw
    } catch { return [] }
  })() as FavoriteItem[],

  addFavorite: (path, type) => {
    set((s: any) => {
      if (s.favorites.some((f: any) => f.path === path)) return s
      const sep = path.includes('\\') ? '\\' : '/'
      const name = path.split(sep).pop() || path
      const isDir = type === 'folder' || (!type && !name.includes('.'))
      const item: FavoriteItem = { path, type: isDir ? 'folder' : 'file', name, addedAt: Date.now() }
      const favorites = [...s.favorites, item]
      localStorage.setItem('pdx_favorites', JSON.stringify(favorites))
      return { favorites }
    })
  },

  removeFavorite: (path) => {
    set((s: any) => {
      const favorites = s.favorites.filter((f: any) => f.path !== path)
      localStorage.setItem('pdx_favorites', JSON.stringify(favorites))
      return { favorites }
    })
  },

  reorderFavorites: (from, to) => {
    set((s: any) => {
      const favorites = [...s.favorites]
      const [moved] = favorites.splice(from, 1)
      favorites.splice(to, 0, moved)
      localStorage.setItem('pdx_favorites', JSON.stringify(favorites))
      return { favorites }
    })
  },
})
