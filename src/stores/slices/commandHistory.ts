import type { CommandHistoryEntry } from '../../types'
import type { SetState, GetState } from './helpers'

export interface CommandHistorySlice {
  commandHistory: CommandHistoryEntry[]
  commandHistoryOpen: boolean
  setCommandHistoryOpen: (v: boolean) => void
  logCommand: (entry: Omit<CommandHistoryEntry, 'id' | 'timestamp' | 'favorite'>) => void
  toggleCommandFavorite: (id: string) => void
  clearCommandHistory: () => void
}

export const createCommandHistorySlice = (set: SetState, _get: GetState): CommandHistorySlice => ({
  commandHistory: (() => {
    try { return JSON.parse(localStorage.getItem('pdx_command_history') || '[]') } catch { return [] }
  })() as CommandHistoryEntry[],
  commandHistoryOpen: false,
  setCommandHistoryOpen: (v) => set({ commandHistoryOpen: v }),

  logCommand: (entry) => {
    set((s: any) => {
      const full: CommandHistoryEntry = {
        ...entry,
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        favorite: false,
      }
      const commandHistory = [full, ...s.commandHistory].slice(0, 200)
      localStorage.setItem('pdx_command_history', JSON.stringify(commandHistory))
      return { commandHistory }
    })
  },

  toggleCommandFavorite: (id) => {
    set((s: any) => {
      const commandHistory = s.commandHistory.map((e: any) => e.id === id ? { ...e, favorite: !e.favorite } : e)
      localStorage.setItem('pdx_command_history', JSON.stringify(commandHistory))
      return { commandHistory }
    })
  },

  clearCommandHistory: () => {
    set((s: any) => {
      const onlyFavs = s.commandHistory.filter((e: any) => e.favorite)
      localStorage.setItem('pdx_command_history', JSON.stringify(onlyFavs))
      return { commandHistory: onlyFavs }
    })
  },
})
