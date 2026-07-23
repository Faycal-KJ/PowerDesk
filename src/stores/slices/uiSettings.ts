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
  accentPalette: string[]
  gridItemSize: number
  listDensity: 'compact' | 'comfortable' | 'spacious'
  animationSpeed: 'fast' | 'normal' | 'slow'
  sidebarDefaultWidth: number
  tabStyle: 'pill' | 'underline' | 'minimal'
  showFavoriteBar: boolean
  showStatusBar: boolean
}

export const DEFAULT_UI: UiSettings = {
  opacity: 100, radius: 'round', accentColor: '#7c5cfc',
  bgPrimary: '#1c1c1c', bgSecondary: '#242424', bgTertiary: '#2d2d2d',
  textColor: '#fafafa', textSecondary: '#9e9e9e', sidebarBg: '#1e1e1e',
  borderStyle: 'solid', borderColor: '#383838', fontSize: 13, fontFamily: '',
  blurBackground: false, animations: true,
  successColor: '#2ecc71', warningColor: '#f39c12', dangerColor: '#e74c3c',
  fontWeight: 400, glassPanels: false, subtleGradients: true, hoverGlow: false,
  accentPalette: ['#7c5cfc', '#3b82f6', '#22c55e', '#f97316', '#f43f5e', '#06b6d4', '#eab308', '#8b5cf6'],
  gridItemSize: 32, listDensity: 'comfortable', animationSpeed: 'normal',
  sidebarDefaultWidth: 220, tabStyle: 'underline', showFavoriteBar: true, showStatusBar: true,
}

const RADIUS_MAP = { sharp: '4px', round: '10px', pill: '20px' }

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

  // Theme switching — smooth transition
  if (ui) {
    document.body.classList.add('theme-transitioning')
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 300)
  }

  const isDark = getBrightness(u.bgPrimary) < 128
  r.style.setProperty('--bg-primary', u.bgPrimary)
  r.style.setProperty('--bg-secondary', u.bgSecondary)
  r.style.setProperty('--bg-tertiary', u.bgTertiary)
  r.style.setProperty('--bg-mica', darkenColor(u.bgPrimary, 12))
  r.style.setProperty('--bg-hover', hexToRgba(u.textColor, 0.04))
  r.style.setProperty('--bg-active', hexToRgba(u.textColor, 0.07))
  r.style.setProperty('--bg-sidebar', u.sidebarBg)
  r.style.setProperty('--text-primary', u.textColor)
  r.style.setProperty('--text-secondary', u.textSecondary)
  r.style.setProperty('--text-muted', hexToRgba(u.textColor, 0.4))
  r.style.setProperty('--accent', u.accentColor)
  r.style.setProperty('--accent-hover', darkenColor(u.accentColor, 15))
  r.style.setProperty('--accent-bg', u.accentColor + '1a')
  r.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${u.accentColor}, ${darkenColor(u.accentColor, 15)})`)
  r.style.setProperty('--surface-gradient', `linear-gradient(180deg, ${blendColors(lightenColor(u.bgSecondary, 6), u.accentColor, 0.12)}, ${u.bgPrimary})`)
  r.style.setProperty('--success', u.successColor)
  r.style.setProperty('--warning', u.warningColor)
  r.style.setProperty('--danger', u.dangerColor)
  r.style.setProperty('--border-color', u.borderStyle === 'none' ? 'transparent' : hexToRgba(u.borderColor, isDark ? 0.08 : 0.08))
  r.style.setProperty('--border-subtle', u.borderStyle === 'none' ? 'transparent' : hexToRgba(u.borderColor, isDark ? 0.06 : 0.06))
  r.style.setProperty('--shadow', isDark ? '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)')
  r.style.setProperty('--shadow-lg', isDark ? '0 2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.22)' : '0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)')
  r.style.setProperty('--shadow-sm', isDark ? '0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.05)')
  r.style.setProperty('--radius-sm', u.radius === 'sharp' ? '4px' : RADIUS_MAP[u.radius])
  r.style.setProperty('--radius-md', u.radius === 'sharp' ? '6px' : RADIUS_MAP[u.radius])
  r.style.setProperty('--radius-lg', u.radius === 'sharp' ? '8px' : u.radius === 'pill' ? '16px' : '12px')
  r.style.setProperty('--radius-xl', u.radius === 'sharp' ? '10px' : u.radius === 'pill' ? '20px' : '14px')
  if (u.fontFamily) r.style.setProperty('--font-sans', u.fontFamily)
  r.style.setProperty('--scrollbar-thumb', lightenColor(u.bgTertiary, 20))
  r.style.setProperty('--font-size-base', u.fontSize + 'px')
  r.style.setProperty('--font-weight', String(u.fontWeight))
  const root = document.getElementById('root')
  if (root) {
    root.style.background = u.blurBackground ? 'rgba(0,0,0,0.85)' : 'transparent'
    root.style.minHeight = '100vh'
    root.style.backdropFilter = u.blurBackground ? 'blur(12px)' : 'none'
    root.classList.toggle('glass-panels', u.glassPanels)
    root.classList.toggle('subtle-gradients', u.subtleGradients)
    root.classList.toggle('hover-glow', u.hoverGlow)
    root.classList.toggle('animations-enabled', u.animations)
  }
  const api = getApi()
  if (api?.setWindowOpacity) api.setWindowOpacity(u.opacity / 100)
  r.style.setProperty('--transition', u.animations ? '200ms cubic-bezier(0.33, 0, 0.67, 1)' : '0ms')
  r.style.setProperty('--grid-item-size', u.gridItemSize + 'px')
  r.style.setProperty('--sidebar-default-width', u.sidebarDefaultWidth + 'px')
  const speedMap = { fast: '120ms', normal: '200ms', slow: '350ms' }
  if (u.animations) {
    r.style.setProperty('--transition', speedMap[u.animationSpeed] + ' cubic-bezier(0.33, 0, 0.67, 1)')
  }
}

let _getUi: (() => UiSettings) | null = null
export function _setUiGetter(fn: () => UiSettings) { _getUi = fn }
