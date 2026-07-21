import type { SetState } from './helpers'

export interface SidebarSlice {
  sidebarOpen: boolean
  sidebarWidth: number
  setSidebarOpen: (v: boolean) => void
  setSidebarWidth: (w: number) => void
}

export const createSidebarSlice = (set: SetState): SidebarSlice => ({
  sidebarOpen: true,
  sidebarWidth: 220,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(160, Math.min(400, w)) }),
})
