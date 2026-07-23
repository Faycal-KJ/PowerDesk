import { useState, useRef, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { X, Settings as SettingsIcon, Folder, Monitor, Info, Palette, Sliders, RotateCcw, Download, Upload, Check, Puzzle, HelpCircle } from 'lucide-react'
import type { UiSettings } from '../stores/useStore'
import { pluginManager } from '../plugins/pluginManager'
import { getApi } from '../lib/api'

const PRESET_THEMES = [
  { name: 'Monochrome', accent: '#999999', bg: '#111111', bg2: '#1e1e1e', bg3: '#2a2a2a', text: '#e0e0e0', text2: '#888888', sidebar: '#191919' },
  { name: 'Midnight Purple', accent: '#7c5cfc', bg: '#12101a', bg2: '#1e1a2e', bg3: '#2a2440', text: '#e8e8f0', text2: '#9e99c0', sidebar: '#18142a' },
  { name: 'Ocean Blue', accent: '#3b82f6', bg: '#0e1420', bg2: '#162038', bg3: '#1e2c4a', text: '#e2e8f4', text2: '#88aad0', sidebar: '#121a30' },
  { name: 'Forest Green', accent: '#22c55e', bg: '#0e1510', bg2: '#182418', bg3: '#203020', text: '#dcfce7', text2: '#7ad09a', sidebar: '#142016' },
  { name: 'Sunset Orange', accent: '#f97316', bg: '#161008', bg2: '#241a10', bg3: '#302418', text: '#ffedd5', text2: '#e0a060', sidebar: '#1e160c' },
  { name: 'Rose Pink', accent: '#f43f5e', bg: '#160c10', bg2: '#24141a', bg3: '#301c22', text: '#ffe4ea', text2: '#d08090', sidebar: '#1e1014' },
  { name: 'Neon Cyan', accent: '#06b6d4', bg: '#0c1416', bg2: '#162426', bg3: '#1e3032', text: '#cff4fa', text2: '#60c8d8', sidebar: '#122022' },
  { name: 'Nord', accent: '#5e81ac', bg: '#2e3440', bg2: '#3c4458', bg3: '#4a5268', text: '#eceff4', text2: '#a0b0c8', sidebar: '#353d50' },
  { name: 'Dracula', accent: '#bd93f9', bg: '#282a36', bg2: '#343848', bg3: '#404458', text: '#f8f8f2', text2: '#7878b0', sidebar: '#302e40' },
  { name: 'Tokyo Night', accent: '#7aa2f7', bg: '#1a1b28', bg2: '#262a40', bg3: '#323850', text: '#c0caf8', text2: '#6878a8', sidebar: '#202238' },
  { name: 'Solarized Dark', accent: '#268bd2', bg: '#002b38', bg2: '#0c3e50', bg3: '#144a5c', text: '#839498', text2: '#588090', sidebar: '#083848' },
  { name: 'Catppuccin', accent: '#cba6f7', bg: '#1e1e30', bg2: '#30344c', bg3: '#3c4058', text: '#cdd6f8', text2: '#7878a0', sidebar: '#262840' },
  { name: 'Gruvbox', accent: '#d65d0e', bg: '#282828', bg2: '#3c3a36', bg3: '#504e48', text: '#ebdbb4', text2: '#a89880', sidebar: '#342e2a' },
  { name: 'Warm Light', accent: '#8b5cf6', bg: '#f8f7f4', bg2: '#eeedea', bg3: '#e3e1dc', text: '#1c1917', text2: '#78716c', sidebar: '#f3f2ef' },
  { name: 'Pure White', accent: '#6366f1', bg: '#ffffff', bg2: '#f8f8f8', bg3: '#e8e8e8', text: '#111111', text2: '#666666', sidebar: '#fafafa' },
]

export default function SettingsPanel() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const ui = useStore((s) => s.ui)
  const setUi = useStore((s) => s.setUi)
  const [tab, setTab] = useState<'general' | 'ui' | 'plugins'>('general')
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pluginTick, setPluginTick] = useState(0)

  useEffect(() => {
    return pluginManager.onChange(() => setPluginTick((t) => t + 1))
  }, [])

  if (!settingsOpen) return null

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(ui, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'powerdesk-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<UiSettings>
        setUi(parsed)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 2000)
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setSettingsOpen(false)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)', width: 540, maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Settings</span>
          </div>
          <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {([['general', 'General'], ['ui', 'Customize UI'], ['plugins', 'Plugins']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '12px 0', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              color: tab === id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              transition: 'color 150ms ease',
              letterSpacing: '0.1px',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {tab === 'general' ? (
            <>
              <Section icon={<LayoutGrid size={14} />} title="Appearance">
                <Row label="Default View Mode">
                  <select value={settings.defaultView} onChange={(e) => setSettings({ defaultView: e.target.value as any })} style={selectStyle}>
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </Row>
                <Row label="Show Hidden Files">
                  <Toggle checked={settings.showHidden} onChange={(v) => setSettings({ showHidden: v })} />
                </Row>
              </Section>
              <Section icon={<Monitor size={14} />} title="Behavior">
                <Row label="Confirm Before Delete">
                  <Toggle checked={settings.confirmDelete} onChange={(v) => setSettings({ confirmDelete: v })} />
                </Row>
                <Row label="Sidebar Open by Default">
                  <Toggle checked={settings.sidebarDefault} onChange={(v) => setSettings({ sidebarDefault: v })} />
                </Row>
                <Row label="Recent Files Limit">
                  <select value={settings.recentLimit} onChange={(e) => setSettings({ recentLimit: Number(e.target.value) })} style={selectStyle}>
                    {[3, 5, 10, 15, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </Row>
              </Section>
              <Section icon={<Folder size={14} />} title="Startup">
                <Row label="Open Folder on Launch">
                  <input value={settings.startupPath} onChange={(e) => setSettings({ startupPath: e.target.value })}
                    placeholder="Leave empty for home directory"
                    style={{ ...inputStyle, width: 220 }} />
                </Row>
              </Section>
              <Section icon={<Info size={14} />} title="About">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>PowerDesk v0.1.0</div>
                  <div>The operating system you wish Windows came with.</div>
                  <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Built with Electron + React + TypeScript + Vite</div>
                </div>
              </Section>
              <Section icon={<Info size={14} />} title="Keyboard Shortcuts">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>
                  {[
                    ['Ctrl+T', 'New Tab'], ['Ctrl+W', 'Close Tab'], ['Ctrl+Tab', 'Next Tab'],
                    ['Ctrl+Shift+Tab', 'Previous Tab'], ['Ctrl+P', 'Search'], ['Ctrl+Shift+P', 'Command Palette'],
                    ['Ctrl+B', 'Toggle Sidebar'], ['Ctrl+Shift+\\', 'Dual Pane'], ['F5', 'Refresh'],
                    ['F2', 'Rename'], ['Delete', 'Delete'], ['Backspace', 'Go Up'],
                    ['Enter', 'Open / Navigate'], ['Alt+←', 'Go Back'], ['Alt+→', 'Go Forward'],
                  ].map(([key, desc]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <kbd style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: 'Consolas, monospace' }}>{key}</kbd>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : tab === 'ui' ? (
            <>
              <Section icon={<Palette size={14} />} title="Quick Themes">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {PRESET_THEMES.map((t) => (
                    <button key={t.name} onClick={() => setUi({ accentColor: t.accent, bgPrimary: t.bg, bgSecondary: t.bg2, bgTertiary: t.bg3, textColor: t.text, textSecondary: t.text2, sidebarBg: t.sidebar })}
                      style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent }} />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.bg3 }} />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.text }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section icon={<Sliders size={14} />} title="Transparency">
                <Row label={`Window Opacity: ${ui.opacity}%`}>
                  <input type="range" min={30} max={100} value={ui.opacity}
                    onChange={(e) => setUi({ opacity: Number(e.target.value) })}
                    style={{ width: 140, accentColor: 'var(--accent)' }} />
                </Row>
                <Row label="Blur Background">
                  <Toggle checked={ui.blurBackground} onChange={(v) => setUi({ blurBackground: v })} />
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Corners">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['sharp', 'round', 'pill'] as const).map((r) => (
                    <button key={r} onClick={() => setUi({ radius: r })}
                      style={{
                        flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer',
                        color: ui.radius === r ? 'var(--accent)' : 'var(--text-secondary)',
                        background: ui.radius === r ? 'var(--accent-bg)' : 'var(--bg-primary)',
                        border: `1px solid ${ui.radius === r ? 'var(--accent)' : 'var(--border-color)'}`,
                        borderRadius: r === 'sharp' ? 0 : r === 'round' ? 6 : 16,
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
              </Section>

              <Section icon={<Palette size={14} />} title="Colors">
                <Row label="Accent">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(ui.accentPalette || ['#7c5cfc','#3b82f6','#22c55e','#f97316','#f43f5e','#06b6d4','#eab308','#8b5cf6']).map((c) => (
                        <div key={c} onClick={() => setUi({ accentColor: c })}
                          style={{ width: 18, height: 18, borderRadius: '50%', background: c, cursor: 'pointer', border: ui.accentColor === c ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.15s', boxShadow: ui.accentColor === c ? `0 0 0 1px ${c}` : 'none' }} />
                      ))}
                    </div>
                    <input type="color" value={ui.accentColor} onChange={(e) => setUi({ accentColor: e.target.value })}
                      style={{ width: 24, height: 24, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                  </div>
                </Row>
                <ColorRow label="Background" value={ui.bgPrimary} onChange={(v) => setUi({ bgPrimary: v })} />
                <ColorRow label="Surface" value={ui.bgSecondary} onChange={(v) => setUi({ bgSecondary: v })} />
                <ColorRow label="Elevated" value={ui.bgTertiary} onChange={(v) => setUi({ bgTertiary: v })} />
                <ColorRow label="Text" value={ui.textColor} onChange={(v) => setUi({ textColor: v })} />
                <ColorRow label="Text Muted" value={ui.textSecondary} onChange={(v) => setUi({ textSecondary: v })} />
                <ColorRow label="Sidebar" value={ui.sidebarBg} onChange={(v) => setUi({ sidebarBg: v })} />
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                <ColorRow label="Success" value={ui.successColor} onChange={(v) => setUi({ successColor: v })} />
                <ColorRow label="Warning" value={ui.warningColor} onChange={(v) => setUi({ warningColor: v })} />
                <ColorRow label="Danger" value={ui.dangerColor} onChange={(v) => setUi({ dangerColor: v })} />
                <Row label="Borders">
                  <select value={ui.borderStyle} onChange={(e) => setUi({ borderStyle: e.target.value as any })} style={selectStyle}>
                    <option value="solid">Visible</option>
                    <option value="none">Hidden</option>
                  </select>
                </Row>
                {ui.borderStyle === 'solid' && (
                  <ColorRow label="Border Color" value={ui.borderColor} onChange={(v) => setUi({ borderColor: v })} />
                )}
              </Section>

              <Section icon={<Sliders size={14} />} title="Typography">
                <Row label={`Font Size: ${ui.fontSize}px`}>
                  <input type="range" min={10} max={18} value={ui.fontSize}
                    onChange={(e) => setUi({ fontSize: Number(e.target.value) })}
                    style={{ width: 140, accentColor: 'var(--accent)' }} />
                </Row>
                <Row label="Custom Font">
                  <input value={ui.fontFamily} onChange={(e) => setUi({ fontFamily: e.target.value })}
                    placeholder="System default" style={{ ...inputStyle, width: 160 }} />
                </Row>
                <Row label="Font Weight">
                  <select value={ui.fontWeight} onChange={(e) => setUi({ fontWeight: Number(e.target.value) })} style={selectStyle}>
                    <option value={300}>Light (300)</option>
                    <option value={400}>Regular (400)</option>
                    <option value={500}>Medium (500)</option>
                    <option value={600}>Semi-Bold (600)</option>
                  </select>
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Grid & List">
                <Row label={`Icon Size: ${ui.gridItemSize}px`}>
                  <input type="range" min={16} max={96} value={ui.gridItemSize}
                    onChange={(e) => setUi({ gridItemSize: Number(e.target.value) })}
                    style={{ width: 140, accentColor: 'var(--accent)' }} />
                </Row>
                <Row label="List Density">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                      <button key={d} onClick={() => setUi({ listDensity: d })}
                        style={{
                          padding: '6px 10px', fontSize: 11, fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer',
                          color: ui.listDensity === d ? 'var(--accent)' : 'var(--text-secondary)',
                          background: ui.listDensity === d ? 'var(--accent-bg)' : 'var(--bg-primary)',
                          border: `1px solid ${ui.listDensity === d ? 'var(--accent)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-sm)',
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Sidebar">
                <Row label={`Default Width: ${ui.sidebarDefaultWidth}px`}>
                  <input type="range" min={160} max={400} step={10} value={ui.sidebarDefaultWidth}
                    onChange={(e) => {
                      const w = Number(e.target.value)
                      setUi({ sidebarDefaultWidth: w })
                      useStore.getState().setSidebarWidth(w)
                    }}
                    style={{ width: 140, accentColor: 'var(--accent)' }} />
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Tabs">
                <Row label="Tab Style">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['pill', 'underline', 'minimal'] as const).map((s) => (
                      <button key={s} onClick={() => setUi({ tabStyle: s })}
                        style={{
                          padding: '6px 10px', fontSize: 11, fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer',
                          color: ui.tabStyle === s ? 'var(--accent)' : 'var(--text-secondary)',
                          background: ui.tabStyle === s ? 'var(--accent-bg)' : 'var(--bg-primary)',
                          border: `1px solid ${ui.tabStyle === s ? 'var(--accent)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-sm)',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Panels">
                <Row label="Show Favorite Bar">
                  <Toggle checked={ui.showFavoriteBar} onChange={(v) => setUi({ showFavoriteBar: v })} />
                </Row>
                <Row label="Show Status Bar">
                  <Toggle checked={ui.showStatusBar} onChange={(v) => setUi({ showStatusBar: v })} />
                </Row>
              </Section>

              <Section icon={<Sliders size={14} />} title="Effects">
                <Row label="Animations">
                  <Toggle checked={ui.animations} onChange={(v) => setUi({ animations: v })} />
                </Row>
                {ui.animations && (
                  <Row label="Animation Speed">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['fast', 'normal', 'slow'] as const).map((s) => (
                        <button key={s} onClick={() => setUi({ animationSpeed: s })}
                          style={{
                            padding: '6px 10px', fontSize: 11, fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer',
                            color: ui.animationSpeed === s ? 'var(--accent)' : 'var(--text-secondary)',
                            background: ui.animationSpeed === s ? 'var(--accent-bg)' : 'var(--bg-primary)',
                            border: `1px solid ${ui.animationSpeed === s ? 'var(--accent)' : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-sm)',
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Row>
                )}
                <Row label="Glass Panels">
                  <Toggle checked={ui.glassPanels} onChange={(v) => setUi({ glassPanels: v })} />
                </Row>
                <Row label="Subtle Gradients">
                  <Toggle checked={ui.subtleGradients} onChange={(v) => setUi({ subtleGradients: v })} />
                </Row>
                <Row label="Hover Glow">
                  <Toggle checked={ui.hoverGlow} onChange={(v) => setUi({ hoverGlow: v })} />
                </Row>
              </Section>

              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={handleExport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}>
                  <Download size={12} /> Export Theme
                </button>
                <button onClick={handleImport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 11, color: importSuccess ? 'var(--success)' : 'var(--text-secondary)', background: 'var(--bg-primary)', border: `1px solid ${importSuccess ? 'var(--success)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { if (!importSuccess) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { if (!importSuccess) e.currentTarget.style.background = 'var(--bg-primary)' }}>
                  {importSuccess ? <Check size={12} /> : <Upload size={12} />} {importSuccess ? 'Imported!' : 'Import Theme'}
                </button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => {
                  localStorage.removeItem('pdx_ui')
                  location.reload()
                }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 11, color: 'var(--danger)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <RotateCcw size={12} /> Reset All UI
                </button>
              </div>
            </>
          ) : tab === 'plugins' ? (
            <>
              <Section icon={<Puzzle size={14} />} title="Installed Plugins">
                {pluginManager.getRegisteredPlugins().length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No plugins installed</div>
                    <div>Plugins extend PowerDesk with new features. Place plugin folders in:</div>
                    <code style={{ display: 'block', marginTop: 6, padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'Consolas, monospace', color: 'var(--accent)' }}>
                      %APPDATA%/PowerDesk/plugins/
                    </code>
                    <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                      Each plugin needs a <code>manifest.json</code> and an <code>index.js</code> entry file.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pluginManager.getRegisteredPlugins().map((p) => (
                      <div key={p.manifest.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.manifest.name}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>v{p.manifest.version}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {p.manifest.description}
                          </div>
                          {p.manifest.author && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              by {p.manifest.author}
                            </div>
                          )}
                        </div>
                        <Toggle checked={p.enabled} onChange={() => {
                          pluginManager.togglePlugin(p.manifest.id)
                          setPluginTick((t) => t + 1)
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section icon={<HelpCircle size={14} />} title="Plugin Development">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                  Learn how to create your own PowerDesk plugins with sidebar panels, commands, keyboard shortcuts, and more.
                </div>
                <button
                  onClick={async () => {
                    const api = getApi()
                    if (api?.getPluginGuidePath && api?.openPath) {
                      const guidePath = await api.getPluginGuidePath()
                      api.openPath(guidePath)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    fontSize: 12, fontWeight: 600, color: '#fff', background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    width: 'fit-content',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <HelpCircle size={13} /> Open Plugin Guide
                </button>
              </Section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function LayoutGrid({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{ color: 'var(--accent)', opacity: 0.7 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
      </div>
      <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 400 }}>{label}</span>
      {children}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Consolas, monospace' }}>{value}</span>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 38, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
      background: checked ? 'var(--accent)' : 'var(--bg-primary)', border: '1px solid var(--border-color)',
      transition: 'background 0.2s',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
        left: checked ? 18 : 2, transition: 'left 0.2s',
      }} />
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', padding: '5px 10px', fontSize: 12, cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', padding: '5px 10px', fontSize: 12,
}
