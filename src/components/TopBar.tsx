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

  // Determine which tab to target for view mode etc.
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

  return (
    <div
      data-toolbar
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 8px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', gap: 2 }}>
        <IconBtn
          onClick={() => setSidebarOpen(!sidebarOpen)}
          active={sidebarOpen}
          title="Toggle Sidebar"
        >
          <PanelLeft size={15} />
        </IconBtn>
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        <IconBtn
          onClick={() => targetTabId && navigateBack(targetTabId)}
          disabled={!canGoBack}
          title="Back"
        >
          <ArrowLeft size={15} />
        </IconBtn>
        <IconBtn
          onClick={() => targetTabId && navigateForward(targetTabId)}
          disabled={!canGoForward}
          title="Forward"
        >
          <ArrowRight size={15} />
        </IconBtn>
        <IconBtn onClick={refresh} title="Refresh">
          <RotateCw size={15} />
        </IconBtn>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '3px 8px',
          margin: '0 4px',
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
              color: 'var(--text-primary)',
              fontSize: 12.5,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {targetTab?.path || 'No folder open'}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '2px 6px',
          minWidth: 120,
        }}
      >
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
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
              padding: 1,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '2px',
        }}
      >
        {viewModes.map((vm) => (
          <button
            key={vm.mode}
            onClick={() => targetTabId && setTabViewMode(targetTabId, vm.mode)}
            style={{
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              color:
                targetTab?.viewMode === vm.mode ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                targetTab?.viewMode === vm.mode ? 'var(--accent-bg)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (targetTab?.viewMode !== vm.mode)
                e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              if (targetTab?.viewMode !== vm.mode)
                e.currentTarget.style.background = 'transparent'
            }}
            title={vm.label}
          >
            {vm.icon}
          </button>
        ))}
      </div>

      {/* Sort by dropdown */}
      <div style={{ position: 'relative' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            appearance: 'none',
            padding: '3px 20px 3px 6px',
            fontSize: 11.5,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 5px center',
          }}
          title="Sort by"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Sort direction toggle */}
      <button
        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px 6px',
          fontSize: 11.5,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        <ArrowUpDown size={12} />
        {sortDirection === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {/* Icon size slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '2px 4px',
        }}
        title={`Icon size: ${iconSize}px`}
      >
        <Minus size={11} style={{ color: 'var(--text-muted)' }} />
        <input
          type="range"
          min={16}
          max={128}
          value={iconSize}
          onChange={(e) => setIconSize(Number(e.target.value))}
          style={{ width: 48, height: 4, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <Plus size={11} style={{ color: 'var(--text-muted)' }} />
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
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px 0', minWidth: 200, boxShadow: 'var(--shadow)', zIndex: 100 }}>
              <div style={{ padding: '4px 10px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pair with</div>
              {tabs.filter((t) => t.id !== activeTabId).map((t) => (
                <button key={t.id} onClick={() => {
                  useStore.getState().setDualPaneTab(activeTabId, t.id)
                  setDualPanePicker(false)
                }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 10px', fontSize: 12, color: 'var(--text-primary)', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
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
      <IconBtn
        onClick={() => setSettingsOpen(true)}
        title="Settings"
      >
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
        padding: 4,
        borderRadius: 'var(--radius-sm)',
        color: active
          ? 'var(--accent)'
          : disabled
            ? 'var(--text-muted)'
            : 'var(--text-secondary)',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
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
