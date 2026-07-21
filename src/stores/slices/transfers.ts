import type { Transfer } from '../../types'
import type { SetState, GetState } from './helpers'
import { getApi } from '../../lib/api'

export interface TransfersSlice {
  transfers: Transfer[]
  transferOpen: boolean
  setTransferOpen: (v: boolean) => void
  updateTransfer: (data: Transfer) => void
  startTransfer: (src: string, dest: string, operation: 'copy' | 'move') => void
  pauseTransfer: (id: string) => void
  resumeTransfer: (id: string) => void
  cancelTransfer: (id: string) => void
  retryTransfer: (id: string) => void
}

export const createTransfersSlice = (set: SetState, get: GetState): TransfersSlice => ({
  transfers: [],
  transferOpen: false,
  setTransferOpen: (v) => set({ transferOpen: v }),
  updateTransfer: (data) => set((s: any) => {
    const idx = s.transfers.findIndex((t: any) => t.id === data.id)
    if (idx >= 0) {
      const next = [...s.transfers]
      next[idx] = data
      return { transfers: next }
    }
    return { transfers: [...s.transfers, data] }
  }),
  startTransfer: (src, dest, operation) => {
    const api = getApi()
    if (!api) return
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    api.transferStart({ id, src, dest, operation })
  },
  pauseTransfer: (id) => { getApi()?.transferPause(id) },
  resumeTransfer: (id) => { getApi()?.transferResume(id) },
  cancelTransfer: (id) => { getApi()?.transferCancel(id) },
  retryTransfer: (id) => { getApi()?.transferRetry(id) },
})
