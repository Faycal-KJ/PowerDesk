import { useStore } from '../stores/useStore'
import { X, Pin, Plus, Copy, Columns } from 'lucide-react'
import { useState, useRef } from 'react'

export default function TabBar() {
  const tabs = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const closeTab = useStore((s) => s.closeTab)
  const addTab = useStore((s) => s.addTab)
  const pinTab = useStore((s) => s.pinTab)
  const duplicateTab = useStore((s) => s.duplicateTab)
  const moveTab = useStore((s) => s.moveTab)
  const toggleDualPane = useStore((s) => s.toggleDualPane)

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

  return (
    <>
      <div
        data-toolbar
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          borderBottom: '1px solid var(--border-subtle)',
          minHeight: 36,
          padding: '0 12px',
          gap: 2,
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflow: 'auto', paddingTop: 4, paddingBottom: 2 }}>
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
                  padding: '5px 10px',
                  minWidth: 100,
                  maxWidth: 200,
                  cursor: 'pointer',
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1px solid var(--border-card)' : '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  userSelect: 'none',
                  position: 'relative',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {tab.pinned && <Pin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  className="tab-close-btn"
                  style={{
                    padding: 2,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 100ms ease',
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
              padding: '6px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 150ms ease',
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
      </div>

      {contextTab && (
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
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 0',
              minWidth: 180,
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(40px) saturate(160%)',
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
      )}
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
        padding: '7px 14px',
        fontSize: 12.5,
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        background: 'transparent',
        textAlign: 'left',
        transition: 'background 100ms ease',
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
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
}
