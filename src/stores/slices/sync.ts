import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'

export interface SyncSlice {
  syncEnabled: boolean
  setSyncEnabled: (v: boolean) => void
  broadcastSync: (data: any) => void
  handleSyncMessage: (data: any) => void
}

export const createSyncSlice = (set: SetState, get: GetState): SyncSlice => ({
  syncEnabled: false,
  setSyncEnabled: (v) => {
    set({ syncEnabled: v })
    const api = getApi()
    if (api?.syncBroadcast) {
      api.syncBroadcast('sync-state', { enabled: v })
    }
  },
  broadcastSync: (data) => {
    const api = getApi()
    if (api?.syncBroadcast) api.syncBroadcast('sync-nav', data)
  },
  handleSyncMessage: (data) => {
    const state = get()
    if (!state.syncEnabled) return
    switch (data.type) {
      case 'navigate': {
        state.navigateTo(data.path, state.activeTabId)
        break
      }
      case 'select': {
        set({ selectedPathsForContext: data.paths || [] })
        break
      }
      case 'scroll': {
        window.dispatchEvent(new CustomEvent('sync-scroll', { detail: data }))
        break
      }
    }
  },
})
