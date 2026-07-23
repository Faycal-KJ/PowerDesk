import { getApi } from '../../lib/api'

export type UiSettings = {
  opacity: number
  radius: 'sharp' | 'round' | 'pill'
  accentColor: string
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  textColor: string
  textSecondary: string
  sidebarBg: string
  borderStyle: 'solid' | 'none'
  borderColor: string
  fontSize: number
  fontFamily: string
  blurBackground: boolean
  animations: boolean
  successColor: string
  warningColor: string
  dangerColor: string
  fontWeight: number
  glassPanels: boolean
  subtleGradients: boolean
  hoverGlow: boolean
}

export const DEFAULT_UI: UiSettings = {
  opacity: 100, radius: 'round', accentColor: '#7c5cfc',
  bgPrimary: '#0f0f0f', bgSecondary: '#1a1a1a', bgTertiary: '#252525',
  textColor: '#e8e8e8', textSecondary: '#999999', sidebarBg: '#121212',
  borderStyle: 'solid', borderColor: '#3a3a3a', fontSize: 13, fontFamily: '',
  blurBackground: false, animations: true,
  successColor: '#2ecc71', warningColor: '#f39c12', dangerColor: '#e74c3c',
  fontWeight: 400, glassPanels: false, subtleGradients: true, hoverGlow: false,
}

const RADIUS_MAP = { sharp: '0px', round: '6px', pill: '16px' }

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const factor = 1 - percent / 100
  return rgbToHex(r * factor, g * factor, b * factor)
}

function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const factor = percent / 100
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function getBrightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function blendColors(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}

export function loadUiSettings(): UiSettings {
  try { return { ...DEFAULT_UI, ...JSON.parse(localStorage.getItem('pdx_ui') || '{}') } } catch { return DEFAULT_UI }
}

export function saveUiSettings(ui: UiSettings) {
  localStorage.setItem('pdx_ui', JSON.stringify(ui))
}

export function applyUiSettings(ui?: UiSettings) {
  const u = ui || (_getUi ? _getUi() : null)
  if (!u) return
  const r = document.documentElement
  const isDark = getBrightness(u.bgPrimary) < 128
  r.style.setProperty('--bg-primary', u.bgPrimary)
  r.style.setProperty('--bg-secondary', u.bgSecondary)
  r.style.setProperty('--bg-tertiary', u.bgTertiary)
  r.style.setProperty('--bg-hover', u.bgTertiary)
  r.style.setProperty('--bg-active', lightenColor(u.bgTertiary, 10))
  r.style.setProperty('--bg-sidebar', u.sidebarBg)
  r.style.setProperty('--text-primary', u.textColor)
  r.style.setProperty('--text-secondary', u.textSecondary)
  r.style.setProperty('--text-muted', hexToRgba(u.textColor, 0.4))
  r.style.setProperty('--accent', u.accentColor)
  r.style.setProperty('--accent-hover', darkenColor(u.accentColor, 15))
  r.style.setProperty('--accent-bg', u.accentColor + '1a')
  r.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${u.accentColor}, ${darkenColor(u.accentColor, 15)})`)
  r.style.setProperty('--surface-gradient', `linear-gradient(180deg, ${u.bgSecondary}, ${u.bgPrimary})`)
  r.style.setProperty('--success', u.successColor)
  r.style.setProperty('--warning', u.warningColor)
  r.style.setProperty('--danger', u.dangerColor)
  r.style.setProperty('--border-color', u.borderStyle === 'none' ? 'transparent' : u.borderColor)
  r.style.setProperty('--border-subtle', u.borderStyle === 'none' ? 'transparent' : blendColors(u.bgTertiary, u.borderColor, 0.4))
  r.style.setProperty('--shadow', isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)')
  r.style.setProperty('--shadow-lg', isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.12)')
  r.style.setProperty('--shadow-sm', isDark ? '0 1px 3px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.06)')
  r.style.setProperty('--radius-sm', RADIUS_MAP[u.radius])
  r.style.setProperty('--radius-md', RADIUS_MAP[u.radius])
  r.style.setProperty('--radius-lg', u.radius === 'pill' ? '20px' : RADIUS_MAP[u.radius])
  r.style.setProperty('--radius-xl', u.radius === 'pill' ? '24px' : RADIUS_MAP[u.radius])
  if (u.fontFamily) r.style.setProperty('--font-sans', u.fontFamily)
  r.style.setProperty('--scrollbar-thumb', lightenColor(u.bgTertiary, 20))
  r.style.setProperty('--font-size-base', u.fontSize + 'px')
  r.style.setProperty('--font-weight', String(u.fontWeight))
  const root = document.getElementById('root')
  if (root) {
    root.style.background = u.blurBackground ? 'rgba(0,0,0,0.85)' : u.bgPrimary
    root.style.minHeight = '100vh'
    root.style.backdropFilter = u.blurBackground ? 'blur(12px)' : 'none'
    root.classList.toggle('glass-panels', u.glassPanels)
    root.classList.toggle('subtle-gradients', u.subtleGradients)
    root.classList.toggle('hover-glow', u.hoverGlow)
  }
  const api = getApi()
  if (api?.setWindowOpacity) api.setWindowOpacity(u.opacity / 100)
  r.style.setProperty('--transition', u.animations ? '150ms ease' : '0ms')
}

let _getUi: (() => UiSettings) | null = null
export function _setUiGetter(fn: () => UiSettings) { _getUi = fn }
