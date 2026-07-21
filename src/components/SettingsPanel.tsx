import { useState, useRef, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { X, Settings as SettingsIcon, Folder, Monitor, Info, Palette, Sliders, RotateCcw, Download, Upload, Check, Puzzle, HelpCircle } from 'lucide-react'
import type { UiSettings } from '../stores/useStore'
import { pluginManager } from '../plugins/pluginManager'
import { getApi } from '../lib/api'

const PRESET_THEMES = [
  { name: 'Midnight Purple', accent: '#7c5cfc', bg: '#0f0f0f', bg2: '#1a1a1a', bg3: '#252525', text: '#e8e8e8', text2: '#999', sidebar: '#121212' },
  { name: 'Ocean Blue', accent: '#3b82f6', bg: '#0c1222', bg2: '#131b2e', bg3: '#1c2640', text: '#e2e8f0', text2: '#94a3b8', sidebar: '#0a0f1a' },
  { name: 'Forest Green', accent: '#22c55e', bg: '#0a120d', bg2: '#111a14', bg3: '#1a261e', text: '#dcfce7', text2: '#86efac', sidebar: '#080f0a' },
  { name: 'Sunset Orange', accent: '#f97316', bg: '#120e08', bg2: '#1c150d', bg3: '#271e14', text: '#ffedd5', text2: '#fdba74', sidebar: '#0f0b06' },
  { name: 'Rose Pink', accent: '#f43f5e', bg: '#120a0e', bg2: '#1c1015', bg3: '#27181e', text: '#ffe4e6', text2: '#fda4af', sidebar: '#0f080b' },
  { name: 'Neon Cyan', accent: '#06b6d4', bg: '#0a1212', bg2: '#111c1c', bg3: '#1a2828', text: '#cffafe', text2: '#67e8f9', sidebar: '#080f0f' },
  { name: 'Nord', accent: '#5e81ac', bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', text: '#eceff4', text2: '#a0a8b8', sidebar: '#2e3440' },
  { name: 'Dracula', accent: '#bd93f9', bg: '#282a36', bg2: '#2d303e', bg3: '#383b50', text: '#f8f8f2', text2: '#6272a4', sidebar: '#21222c' },
  { name: 'Tokyo Night', accent: '#7aa2f7', bg: '#1a1b26', bg2: '#24283b', bg3: '#414868', text: '#c0caf5', text2: '#565f89', sidebar: '#16161e' },
  { name: 'Solarized Dark', accent: '#268bd2', bg: '#002b36', bg2: '#073642', bg3: '#0a4050', text: '#839496', text2: '#586e75', sidebar: '#002b36' },
  { name: 'Catppuccin', accent: '#cba6f7', bg: '#1e1e2e', bg2: '#313244', bg3: '#45475a', text: '#cdd6f4', text2: '#6c7086', sidebar: '#181825' },
  { name: 'Gruvbox', accent: '#d65d0e', bg: '#282828', bg2: '#3c3836', bg3: '#504945', text: '#ebdbb2', text2: '#928374', sidebar: '#1d2021' },
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setSettingsOpen(false)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: 540, maxHeight: '85vh', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</span>
          </div>
          <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {([['general', 'General'], ['ui', 'Customize UI'], ['plugins', 'Plugins']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: tab === id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                <ColorRow label="Accent" value={ui.accentColor} onChange={(v) => setUi({ accentColor: v })} />
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

              <Section icon={<Sliders size={14} />} title="Effects">
                <Row label="Animations">
                  <Toggle checked={ui.animations} onChange={(v) => setUi({ animations: v })} />
                </Row>
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
                <button onClick={handleExport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}>
                  <Download size={12} /> Export Theme
                </button>
                <button onClick={handleImport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', fontSize: 11, color: importSuccess ? 'var(--success)' : 'var(--text-secondary)', background: 'var(--bg-primary)', border: `1px solid ${importSuccess ? 'var(--success)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
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
                }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 11, color: 'var(--danger)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
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
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                    fontSize: 12, fontWeight: 600, color: '#fff', background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      </div>
      <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
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
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
      background: checked ? 'var(--accent)' : 'var(--bg-primary)', border: '1px solid var(--border-color)',
      transition: 'background 0.2s',
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
        left: checked ? 18 : 2, transition: 'left 0.2s',
      }} />
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)', padding: '4px 8px', fontSize: 12, cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)', padding: '4px 8px', fontSize: 12,
}
