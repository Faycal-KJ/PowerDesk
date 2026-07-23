import { useState, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  PanelLeft,
  LayoutGrid,
  List,
  Image,
  X,
  Minus,
  Plus,
  PanelRight,
  Settings,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

const viewModes = [
  { mode: 'grid' as const, icon: <LayoutGrid size={14} />, label: 'Grid' },
  { mode: 'list' as const, icon: <List size={14} />, label: 'List' },
  { mode: 'gallery' as const, icon: <Image size={14} />, label: 'Gallery' },
]

const sortOptions: { value: string; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date Modified' },
  { value: 'size', label: 'Size' },
  { value: 'type', label: 'Type' },
  { value: 'tags', label: 'Tags' },
]

export default function TopBar() {
  const activeTabId = useStore((s) => s.activeTabId)
  const tabs = useStore((s) => s.tabs)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const focusedPane = useStore((s) => s.focusedPane)
  const navigateTo = useStore((s) => s.navigateTo)
  const navigateBack = useStore((s) => s.navigateBack)
  const navigateForward = useStore((s) => s.navigateForward)
  const refresh = useStore((s) => s.refresh)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const setTabViewMode = useStore((s) => s.setTabViewMode)
  const toggleDualPane = useStore((s) => s.toggleDualPane)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const iconSize = useStore((s) => s.iconSize)
  const setIconSize = useStore((s) => s.setIconSize)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const sortBy = useStore((s) => s.sortBy)
  const setSortBy = useStore((s) => s.setSortBy)
  const sortDirection = useStore((s) => s.sortDirection)
  const setSortDirection = useStore((s) => s.setSortDirection)

  const [pathEditing, setPathEditing] = useState(false)
  const [pathDraft, setPathDraft] = useState('')
  const [dualPanePicker, setDualPanePicker] = useState(false)

  const targetTabId = activeTab?.dualPane && focusedPane === 'right' && activeTab.dualPaneTabId
    ? activeTab.dualPaneTabId
    : activeTabId
  const targetTab = tabs.find((t) => t.id === targetTabId)

  const canGoBack = targetTab ? targetTab.historyIndex > 0 : false
  const canGoForward = targetTab ? targetTab.historyIndex < targetTab.history.length - 1 : false

  const handlePathSubmit = useCallback(() => {
    if (pathDraft.trim()) {
      navigateTo(pathDraft.trim())
    }
    setPathEditing(false)
  }, [pathDraft, navigateTo])

  const handlePathFocus = useCallback(() => {
    setPathDraft(targetTab?.path || '')
    setPathEditing(true)
  }, [targetTab])

  const pillStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '4px 6px',
  }

  return (
    <div
      data-toolbar
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          ...pillStyle,
          padding: '5px 7px',
          cursor: 'pointer',
          color: sidebarOpen ? 'var(--accent)' : 'var(--text-secondary)',
          background: sidebarOpen ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
        }}
        onMouseEnter={(e) => {
          if (!sidebarOpen) e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!sidebarOpen) e.currentTarget.style.background = 'var(--bg-tertiary)'
        }}
        title="Toggle Sidebar"
      >
        <PanelLeft size={15} />
      </button>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 2 }}>
        <IconBtn onClick={() => targetTabId && navigateBack(targetTabId)} disabled={!canGoBack} title="Back">
          <ArrowLeft size={15} />
        </IconBtn>
        <IconBtn onClick={() => targetTabId && navigateForward(targetTabId)} disabled={!canGoForward} title="Forward">
          <ArrowRight size={15} />
        </IconBtn>
        <IconBtn onClick={refresh} title="Refresh">
          <RotateCw size={15} />
        </IconBtn>
      </div>

      {/* Path bar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '5px 12px',
          margin: '0 2px',
          minHeight: 32,
        }}
      >
        {pathEditing ? (
          <input
            autoFocus
            value={pathDraft}
            onChange={(e) => setPathDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePathSubmit()
              if (e.key === 'Escape') setPathEditing(false)
            }}
            onBlur={() => setPathEditing(false)}
            placeholder="Enter path..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 12.5,
            }}
          />
        ) : (
          <span
            onClick={handlePathFocus}
            style={{
              flex: 1,
              color: 'var(--text-secondary)',
              fontSize: 12.5,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {targetTab?.path || 'No folder open'}
          </span>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          ...pillStyle,
          minWidth: 140,
          gap: 6,
          padding: '4px 8px',
        }}
      >
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 12.5,
            minWidth: 0,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 2,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* View modes */}
      <div style={{ ...pillStyle, padding: '3px 4px' }}>
        {viewModes.map((vm) => (
          <button
            key={vm.mode}
            onClick={() => targetTabId && setTabViewMode(targetTabId, vm.mode)}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              color: targetTab?.viewMode === vm.mode ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: targetTab?.viewMode === vm.mode ? 'var(--bg-active)' : 'transparent',
              transition: 'all 150ms ease',
            }}
            title={vm.label}
          >
            {vm.icon}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div style={{ ...pillStyle, padding: '3px 4px', gap: 4 }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            appearance: 'none',
            padding: '3px 18px 3px 8px',
            fontSize: 11.5,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            transition: 'background 150ms ease',
          }}
          title="Sort by"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '3px 6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown size={11} />
          {sortDirection === 'asc' ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>
      </div>

      {/* Icon size slider */}
      <div
        style={{ ...pillStyle, padding: '3px 6px', gap: 4 }}
        title={`Icon size: ${iconSize}px`}
      >
        <Minus size={10} style={{ color: 'var(--text-muted)' }} />
        <input
          type="range"
          min={16}
          max={128}
          value={iconSize}
          onChange={(e) => setIconSize(Number(e.target.value))}
          style={{ width: 44, height: 3, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <Plus size={10} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Dual pane toggle */}
      <div style={{ position: 'relative' }}>
        <IconBtn
          onClick={() => {
            if (activeTab?.dualPane) {
              toggleDualPane(activeTabId)
            } else {
              const otherTabs = tabs.filter((t) => t.id !== activeTabId)
              if (otherTabs.length === 1) {
                useStore.getState().setDualPaneTab(activeTabId, otherTabs[0].id)
              } else if (otherTabs.length > 1) {
                setDualPanePicker(!dualPanePicker)
              } else {
                toggleDualPane(activeTabId)
              }
            }
          }}
          active={!!targetTab?.dualPane}
          title="Dual Pane"
        >
          <PanelRight size={14} />
        </IconBtn>
        {dualPanePicker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDualPanePicker(false)} />
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              background: 'var(--surface-flyout)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 0',
              minWidth: 200,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              backdropFilter: 'blur(40px) saturate(160%)',
              animation: 'scale-in 150ms cubic-bezier(0.33, 0, 0.67, 1)',
            }}>
              <div style={{ padding: '6px 14px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pair with</div>
              {tabs.filter((t) => t.id !== activeTabId).map((t) => (
                <button key={t.id} onClick={() => {
                  useStore.getState().setDualPaneTab(activeTabId, t.id)
                  setDualPanePicker(false)
                }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', fontSize: 12.5, color: 'var(--text-primary)', background: 'transparent', textAlign: 'left', cursor: 'pointer', transition: 'background 100ms ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || t.path}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <IconBtn onClick={() => setSettingsOpen(true)} title="Settings">
        <Settings size={14} />
      </IconBtn>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '5px 7px',
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--accent)' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        opacity: disabled ? 0.35 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
