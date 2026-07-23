import { useStore } from '../stores/useStore'
import { X, Pin, Plus, Copy, Columns } from 'lucide-react'
import { useState, useRef } from 'react'

export default function TabBar({ embedded }: { embedded?: boolean }) {
  const tabs = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const closeTab = useStore((s) => s.closeTab)
  const addTab = useStore((s) => s.addTab)
  const pinTab = useStore((s) => s.pinTab)
  const duplicateTab = useStore((s) => s.duplicateTab)
  const moveTab = useStore((s) => s.moveTab)
  const toggleDualPane = useStore((s) => s.toggleDualPane)
  const tabStyle = useStore((s) => s.ui.tabStyle)

  const [contextTab, setContextTab] = useState<string | null>(null)
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 })
  const dragId = useRef<string | null>(null)
  const dragOverId = useRef<string | null>(null)

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextTab(tabId)
    setContextPos({ x: e.clientX, y: e.clientY })
  }

  const closeContextMenu = () => setContextTab(null)

  const tabStrip = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, overflow: 'auto', paddingTop: embedded ? 0 : 4, paddingBottom: embedded ? 0 : 2, minHeight: 0 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            draggable
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            onDragStart={(e) => { dragId.current = tab.id; e.dataTransfer.effectAllowed = 'move' }}
            onDragOver={(e) => { e.preventDefault(); dragOverId.current = tab.id }}
            onDragLeave={() => {}}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId.current && dragOverId.current && dragId.current !== dragOverId.current) {
                moveTab(dragId.current, dragOverId.current)
              }
              dragId.current = null
              dragOverId.current = null
            }}
            onDragEnd={() => { dragId.current = null; dragOverId.current = null }}
            className="tab-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: tabStyle === 'pill' ? '6px 14px' : tabStyle === 'minimal' ? '6px 8px' : '6px 12px',
              minWidth: tabStyle === 'minimal' ? 80 : 100,
              maxWidth: 200,
              cursor: 'pointer',
              background: isActive
                ? (tabStyle === 'pill' ? 'var(--accent-bg)' : tabStyle === 'underline' ? 'var(--bg-tertiary)' : 'transparent')
                : 'transparent',
              borderRadius: tabStyle === 'pill' ? 'var(--radius-lg)' : 'var(--radius-md)',
              border: '1px solid transparent',
              borderBottom: (tabStyle === 'underline' || tabStyle === 'minimal')
                ? (isActive ? '2px solid var(--accent)' : '2px solid transparent')
                : (tabStyle === 'pill' ? (isActive ? '1px solid var(--accent)' : '1px solid var(--border-color)') : '1px solid transparent'),
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: tabStyle === 'minimal' ? 11 : 12,
              fontWeight: isActive ? 500 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              userSelect: 'none',
              position: 'relative',
              transition: 'all 180ms ease',
              letterSpacing: '0.1px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'translateX(0)'
              }
            }}
          >
            {tab.pinned && <Pin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="tab-close-btn"
              style={{
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-active)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}
      <button
        onClick={() => addTab()}
        style={{
          padding: '7px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          transition: 'all 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.background = 'transparent'
        }}
        title="New Tab"
      >
        <Plus size={14} />
      </button>
    </div>
  )

  const contextMenu = contextTab && (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={closeContextMenu}
      />
      <div
        style={{
          position: 'fixed',
          left: contextPos.x,
          top: contextPos.y,
          zIndex: 1000,
          background: 'var(--surface-flyout)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-lg)',
          padding: '6px 0',
          minWidth: 180,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.22)',
          backdropFilter: 'blur(48px) saturate(150%)',
          animation: 'scale-in 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        }}
      >
        <MenuItem icon={<Pin size={13} />} label="Pin Tab" onClick={() => { pinTab(contextTab); closeContextMenu() }} />
        <MenuItem icon={<Copy size={13} />} label="Duplicate Tab" onClick={() => { duplicateTab(contextTab); closeContextMenu() }} />
        <MenuItem icon={<Columns size={13} />} label="Split Tab" onClick={() => { toggleDualPane(contextTab); closeContextMenu() }} />
        <Sep />
        <MenuItem
          icon={<X size={13} />}
          label="Close Tab"
          onClick={() => { closeTab(contextTab); closeContextMenu() }}
          danger
        />
      </div>
    </>
  )

  if (embedded) return <>{tabStrip}{contextMenu}</>

  return (
    <>
      <div
        data-toolbar
        className="floating-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(30, 30, 30, 0.68)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderRadius: 'var(--radius-lg)',
          margin: '0 6px 2px',
          minHeight: 36,
          padding: '0 12px',
          gap: 2,
        }}
      >
        {tabStrip}
      </div>
      {contextMenu}
    </>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 16px',
        fontSize: 12.5,
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        background: 'transparent',
        textAlign: 'left',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  )
}

function Sep() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '5px 0' }} />
}
