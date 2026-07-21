import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { X, Copy, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number) {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function hsvToRgb(h: number, s: number, v: number) {
  const sn = s / 100, vn = v / 100
  const c = vn * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = vn - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHex(r, g, b)
}

function getHarmonies(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const wrap = (v: number) => ((v % 360) + 360) % 360
  return {
    complementary: [hslToRgb(wrap(h + 180), s, l)],
    analogous: [hslToRgb(wrap(h + 30), s, l), hslToRgb(wrap(h - 30), s, l)],
    triadic: [hslToRgb(wrap(h + 120), s, l), hslToRgb(wrap(h + 240), s, l)],
    splitComplementary: [hslToRgb(wrap(h + 150), s, l), hslToRgb(wrap(h + 210), s, l)],
    tetradic: [hslToRgb(wrap(h + 90), s, l), hslToRgb(wrap(h + 180), s, l), hslToRgb(wrap(h + 270), s, l)],
  }
}

function luminance(r: number, g: number, b: number) {
  const [rn, gn, bn] = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
  return 0.2126 * rn + 0.7152 * gn + 0.0722 * bn
}

function contrastRatio(hex1: string, hex2: string) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2)
  const l1 = luminance(c1.r, c1.g, c1.b)
  const l2 = luminance(c2.r, c2.g, c2.b)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function wcagGrade(ratio: number) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

const PRESETS = [
  '#FF0000', '#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50',
  '#009688', '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5', '#673AB7', '#9C27B0', '#E91E63',
  '#795548', '#9E9E9E', '#607D8B', '#000000', '#333333', '#666666', '#999999', '#FFFFFF',
]

const HARMONY_LABELS: Record<string, string> = {
  complementary: 'Complementary',
  analogous: 'Analogous',
  triadic: 'Triadic',
  splitComplementary: 'Split Comp.',
  tetradic: 'Tetradic',
}

export default function ColorTool() {
  const openTool = useStore((s) => s.openTool)
  const setOpenTool = useStore((s) => s.setOpenTool)
  const [hex, setHex] = useState('#2196F3')
  const [alpha, setAlpha] = useState(100)
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pdx_color_history') || '[]') } catch { return [] }
  })
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pdx_color_favs') || '[]') } catch { return [] }
  })
  const [copied, setCopied] = useState('')
  const [showHarmonies, setShowHarmonies] = useState(false)
  const [contrastBg, setContrastBg] = useState('#FFFFFF')
  const [expanded, setExpanded] = useState(true)
  const svRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef<'sv' | 'hue' | null>(null)

  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const harmonies = getHarmonies(hex)
  const cr = contrastRatio(hex, contrastBg)
  const grade = wcagGrade(cr)

  const pushHistory = useCallback((c: string) => {
    setHistory((h) => {
      const next = [c, ...h.filter((v) => v !== c)].slice(0, 24)
      localStorage.setItem('pdx_color_history', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (openTool !== 'color') return
    const c = svRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const w = c.width, ht = c.height
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < ht; y++) {
        const s = (x / w) * 100
        const v = (1 - y / ht) * 100
        const { r, g, b } = hsvToRgb(hsv.h, s, v)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }, [openTool, hsv.h])

  useEffect(() => {
    if (openTool !== 'color') return
    const c = hueRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const w = c.width
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360
      const { r, g, b } = hslToRgb(hue, 100, 50)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, 0, 1, c.height)
    }
  }, [openTool])

  const handleSV = useCallback((clientX: number, clientY: number) => {
    const c = svRef.current!
    const rect = c.getBoundingClientRect()
    const s = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const v = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100))
    const { r, g, b } = hsvToRgb(hsv.h, s, v)
    setHex(rgbToHex(r, g, b))
  }, [hsv.h])

  const handleHue = useCallback((clientX: number) => {
    const c = hueRef.current!
    const rect = c.getBoundingClientRect()
    const hue = Math.max(0, Math.min(359, ((clientX - rect.left) / rect.width) * 360))
    const { r, g, b } = hsvToRgb(hue, hsv.s, hsv.v)
    setHex(rgbToHex(r, g, b))
  }, [hsv.s, hsv.v])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === 'sv') handleSV(e.clientX, e.clientY)
      else if (dragging.current === 'hue') handleHue(e.clientX)
    }
    const onUp = () => { dragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [handleSV, handleHue])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 1500)
    pushHistory(hex)
  }

  const toggleFav = () => {
    setFavorites((f) => {
      const next = f.includes(hex) ? f.filter((v) => v !== hex) : [hex, ...f].slice(0, 16)
      localStorage.setItem('pdx_color_favs', JSON.stringify(next))
      return next
    })
  }

  if (openTool !== 'color') return null

  const svX = (hsv.s / 100) * 240
  const svY = (1 - hsv.v / 100) * 240
  const hueX = (hsv.h / 360) * 240

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpenTool(null)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20, width: 440, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Color Tool</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={toggleFav} style={{ background: 'none', border: 'none', color: favorites.includes(hex) ? '#FF9800' : 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>{favorites.includes(hex) ? '★' : '☆'}</button>
            <button onClick={() => setOpenTool(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
          </div>
        </div>

        {/* SV picker + hue bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <canvas ref={svRef} width={240} height={240} style={{ width: 240, height: 240, borderRadius: 6, cursor: 'crosshair', position: 'relative' }}
            onMouseDown={(e) => { dragging.current = 'sv'; handleSV(e.clientX, e.clientY) }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <canvas ref={hueRef} width={240} height={20} style={{ width: 240, height: 20, borderRadius: 4, cursor: 'crosshair' }}
              onMouseDown={(e) => { dragging.current = 'hue'; handleHue(e.clientX) }} />
            {/* Preview + hex input */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 6, background: hex, border: '2px solid var(--border-color)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                  <input value={hex} onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setHex(e.target.value) }}
                    onBlur={() => pushHistory(hex)} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', padding: '3px 6px', fontSize: 12, fontFamily: 'Consolas, monospace', textTransform: 'uppercase' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 16 }}>A</span>
                  <input type="range" min={0} max={100} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>{alpha}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color values */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'HEX', val: hex.toUpperCase() },
            { label: 'RGB', val: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
            { label: 'HSL', val: `${hsl.h}, ${hsl.s}%, ${hsl.l}%` },
            { label: 'HSV', val: `${hsv.h}, ${hsv.s}%, ${hsv.v}%` },
            { label: 'CSS', val: alpha < 100 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${(alpha / 100).toFixed(2)})` : `rgb(${rgb.r},${rgb.g},${rgb.b})` },
            { label: 'Int', val: `${rgb.r * 65536 + rgb.g * 256 + rgb.b}` },
          ].map(({ label, val }) => (
            <button key={label} onClick={() => copy(val)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, fontFamily: 'Consolas, monospace', cursor: 'pointer', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}>{label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {copied === val ? <span style={{ color: 'var(--accent)', fontSize: 9 }}>Copied!</span> : val}
                {copied !== val && <Copy size={9} style={{ color: 'var(--text-muted)' }} />}
              </span>
            </button>
          ))}
        </div>

        {/* Contrast checker */}
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 6 }}>
            Contrast Checker {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>BG</span>
                <input type="color" value={contrastBg} onChange={(e) => setContrastBg(e.target.value)} style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
              </div>
              <div style={{ padding: '6px 12px', borderRadius: 4, background: contrastBg, color: hex, fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color)' }}>Aa</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: grade === 'Fail' ? 'var(--danger)' : 'var(--accent)' }}>{cr.toFixed(1)}:1</div>
                <div style={{ fontSize: 10, color: grade === 'Fail' ? 'var(--danger)' : 'var(--accent)' }}>{grade}</div>
              </div>
            </div>
          )}
        </div>

        {/* Harmonies */}
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowHarmonies(!showHarmonies)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 6 }}>
            Color Harmonies {showHarmonies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showHarmonies && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(harmonies).map(([key, colors]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 80 }}>{HARMONY_LABELS[key]}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[hex, ...colors.map((c) => rgbToHex(c.r, c.g, c.b))].map((c) => (
                      <button key={c} onClick={() => { setHex(c); pushHistory(c) }}
                        style={{ width: 22, height: 22, borderRadius: 4, background: c, border: hex === c ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Favorites</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {favorites.map((c) => (
                <button key={c} onClick={() => { setHex(c); pushHistory(c) }}
                  onContextMenu={(e) => { e.preventDefault(); setFavorites((f) => { const next = f.filter((v) => v !== c); localStorage.setItem('pdx_color_favs', JSON.stringify(next)); return next }) }}
                  style={{ width: 26, height: 26, borderRadius: 4, background: c, border: hex === c ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>History</span>
              <button onClick={() => { setHistory([]); localStorage.removeItem('pdx_color_history') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}><Trash2 size={10} />Clear</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {history.map((c) => (
                <button key={c + Math.random()} onClick={() => { setHex(c); pushHistory(c) }}
                  style={{ width: 26, height: 26, borderRadius: 4, background: c, border: hex === c ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Presets</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
            {PRESETS.map((c) => (
              <button key={c} onClick={() => { setHex(c); pushHistory(c) }}
                style={{ width: '100%', aspectRatio: '1', background: c, borderRadius: 4, border: hex === c ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
