import type { ElectronAPI } from '../types/electron'

export function getApi(): ElectronAPI | null {
  return (window as any).electronAPI as ElectronAPI | undefined || null
}
