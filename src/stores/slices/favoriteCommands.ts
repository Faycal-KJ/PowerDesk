import type { FavoriteCommand } from '../../types'
import type { SetState, GetState } from './helpers'

export interface FavoriteCommandsSlice {
  favoriteCommands: FavoriteCommand[]
  favoriteCommandsOpen: boolean
  setFavoriteCommandsOpen: (v: boolean) => void
  addFavoriteCommand: (cmd: Omit<FavoriteCommand, 'id'>) => void
  removeFavoriteCommand: (id: string) => void
  reorderFavoriteCommands: (from: number, to: number) => void
}

export const createFavoriteCommandsSlice = (set: SetState, _get: GetState): FavoriteCommandsSlice => ({
  favoriteCommands: (() => {
    try { return JSON.parse(localStorage.getItem('pdx_favorite_commands') || '[]') } catch { return [] }
  })() as FavoriteCommand[],
  favoriteCommandsOpen: false,
  setFavoriteCommandsOpen: (v) => set({ favoriteCommandsOpen: v }),

  addFavoriteCommand: (cmd) => {
    set((s: any) => {
      const full: FavoriteCommand = { ...cmd, id: `fcmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
      const favoriteCommands = [...s.favoriteCommands, full]
      localStorage.setItem('pdx_favorite_commands', JSON.stringify(favoriteCommands))
      return { favoriteCommands }
    })
  },

  removeFavoriteCommand: (id) => {
    set((s: any) => {
      const favoriteCommands = s.favoriteCommands.filter((c: any) => c.id !== id)
      localStorage.setItem('pdx_favorite_commands', JSON.stringify(favoriteCommands))
      return { favoriteCommands }
    })
  },

  reorderFavoriteCommands: (from, to) => {
    set((s: any) => {
      const favoriteCommands = [...s.favoriteCommands]
      const [moved] = favoriteCommands.splice(from, 1)
      favoriteCommands.splice(to, 0, moved)
      localStorage.setItem('pdx_favorite_commands', JSON.stringify(favoriteCommands))
      return { favoriteCommands }
    })
  },
})
