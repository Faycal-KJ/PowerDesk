import { useState, useEffect } from 'react'
import { pluginManager } from './pluginManager'
import type { SidebarPanel, ToolbarButton, StatusBarEntry, ContextMenuItem, SettingsTab, TopBarItem, BackgroundContextMenuItem } from './types'

// ─── Sidebar Panel ───────────────────────────────────────────────────────────

export function SidebarPanels() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const panels = pluginManager.getSidebarPanels()
  if (panels.length === 0) return null
  return (
    <div style={{ overflowY: 'auto', overflowX: 'hidden', borderTop: '1px solid var(--border-subtle)', maxHeight: 300, boxSizing: 'border-box' }}>
      {panels.map((panel) => (
        <div key={`${panel.pluginId}:${panel.id}`} style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
          <SidebarPanelHeader label={panel.label} icon={panel.icon} />
          <panel.component />
        </div>
      ))}
    </div>
  )
}

function SidebarPanelHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', color: 'var(--text-secondary)',
      fontSize: 11.5, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase',
    }}>
      {icon}
      {label}
    </div>
  )
}

// ─── Tree Data Providers (sidebar) ───────────────────────────────────────────

export function PluginTreeSections() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const providers = pluginManager.getTreeDataProviders()
  if (providers.length === 0) return null
  return (
    <>
      {providers.map((provider) => (
        <PluginTreeSection key={`${provider.pluginId}:${provider.id}`} provider={provider} />
      ))}
    </>
  )
}

function PluginTreeSection({ provider }: { provider: any }) {
  const [expanded, setExpanded] = useState(true)
  const [children, setChildren] = useState<any[]>([])

  useEffect(() => {
    try {
      const result = provider.getChildren()
      setChildren(Array.isArray(result) ? result : [])
    } catch (e) {
      console.error(`[PluginTree] Error getting children for "${provider.id}":`, e)
    }
  }, [provider])

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '5px 12px', background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.3px', textTransform: 'uppercase', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 9, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'\u25B6'}</span>
        {provider.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{provider.icon}</span>}
        {provider.label}
      </button>
      {expanded && children.length > 0 && (
        <div style={{ paddingLeft: 12 }}>
          {children.map((node: any) => (
            <TreeNodeItem key={node.id} node={node} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeNodeItem({ node, depth }: { node: any; depth: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          if (node.onClick) node.onClick()
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', paddingLeft: 8 + depth * 12,
          fontSize: 12, color: node.color || 'var(--text-primary)',
          cursor: 'pointer', borderRadius: 3,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        {hasChildren && (
          <span style={{ fontSize: 9, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'\u25B6'}</span>
        )}
        {node.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{node.icon}</span>}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>
        {node.badge && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 8 }}>{node.badge}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child: any) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toolbar Buttons ─────────────────────────────────────────────────────────

export function ToolbarButtons() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const buttons = pluginManager.getToolbarButtons()
  if (buttons.length === 0) return null
  return (
    <>
      {buttons.map((btn) => (
        <button
          key={`${btn.pluginId}:${btn.id}`}
          onClick={btn.onClick}
          title={btn.label}
          style={{
            padding: 4, borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {btn.icon}
        </button>
      ))}
    </>
  )
}

// ─── Top Bar Items ───────────────────────────────────────────────────────────

export function PluginTopBarItems() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const items = pluginManager.getTopBarItems()
  if (items.length === 0) return null
  return (
    <>
      {items.map((item) => (
        <button
          key={`${item.pluginId}:${item.id}`}
          onClick={item.onClick}
          title={item.label}
          style={{
            padding: 4, borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            fontSize: 12, gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {item.icon && <span style={{ display: 'flex' }}>{item.icon}</span>}
        </button>
      ))}
    </>
  )
}

// ─── Status Bar Entries ──────────────────────────────────────────────────────

export function StatusBarEntries() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const entries = pluginManager.getStatusBarEntries()
  if (entries.length === 0) return null
  return (
    <>
      {entries.map((entry) => (
        <div key={`${entry.pluginId}:${entry.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <entry.component />
        </div>
      ))}
    </>
  )
}

// ─── Context Menu Items ──────────────────────────────────────────────────────

export function PluginContextMenuItems({ onAction }: { onAction: () => void }) {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const items = pluginManager.getContextMenuItems()
  if (items.length === 0) return null
  return (
    <>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      {items.map((item) => (
        <div key={`${item.pluginId}:${item.id}`}>
          <button
            onClick={() => { item.onClick(); onAction() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '5px 12px', fontSize: 12.5, color: 'var(--text-primary)',
              background: 'transparent', textAlign: 'left', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {item.icon}
            {item.label}
          </button>
          {item.dividerAfter && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />}
        </div>
      ))}
    </>
  )
}

// ─── Background Context Menu Items ───────────────────────────────────────────

export function PluginBackgroundContextItems({ onAction }: { onAction: () => void }) {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const items = pluginManager.getBackgroundContextMenuItems()
  if (items.length === 0) return null
  return (
    <>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      {items.map((item) => (
        <div key={`${item.pluginId}:${item.id}`}>
          <button
            onClick={() => { item.onClick(); onAction() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '5px 12px', fontSize: 12.5, color: 'var(--text-primary)',
              background: 'transparent', textAlign: 'left', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {item.icon}
            {item.label}
          </button>
          {item.dividerAfter && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />}
        </div>
      ))}
    </>
  )
}

// ─── Settings Tabs ───────────────────────────────────────────────────────────

export function PluginSettingsTabs() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  return pluginManager.getSettingsTabs()
}

export function PluginSettingsTabContent({ tabId }: { tabId: string }) {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const tabs = pluginManager.getSettingsTabs()
  const tab = tabs.find((t) => t.id === tabId)
  if (!tab) return null
  return <tab.component />
}

// ─── File Decorations ────────────────────────────────────────────────────────

export function getFileDecorations(filePath: string, item: any): Record<string, any> {
  const providers = pluginManager.getFileDecorationProviders()
  let merged: Record<string, any> = {}
  for (const provider of providers) {
    try {
      const deco = provider.getDecoration(filePath, item)
      if (deco) merged = { ...merged, ...deco }
    } catch {}
  }
  return merged
}

// ─── Active View ─────────────────────────────────────────────────────────────

export function ActivePluginView({ viewId }: { viewId: string }) {
  const views = pluginManager.getViews()
  const view = views.find((v) => v.id === viewId)
  if (!view) return null
  return <view.component />
}

export function PluginViewPicker({ onSelect }: { onSelect: (viewId: string) => void }) {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const views = pluginManager.getViews()
  if (views.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {views.map((view) => (
        <button
          key={`${view.pluginId}:${view.id}`}
          onClick={() => onSelect(view.id)}
          style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {view.icon && <span style={{ display: 'flex' }}>{view.icon}</span>}
          {view.name}
        </button>
      ))}
    </div>
  )
}

// ─── Custom Tab Type Renderer ────────────────────────────────────────────────

export function getTabTypeForFile(filePath: string): any {
  const tabTypes = pluginManager.getTabTypes()
  for (const tt of tabTypes) {
    if (tt.canHandle && tt.canHandle(filePath)) return tt
  }
  return null
}
