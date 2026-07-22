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
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          minHeight: 32,
          // WebkitAppRegion: 'drag',
        }}
      >
        <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              draggable
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onDragStart={(e) => { dragId.current = tab.id; e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(e) => { e.preventDefault(); dragOverId.current = tab.id; e.currentTarget.style.borderLeft = '2px solid var(--accent)' }}
              onDragLeave={(e) => { e.currentTarget.style.borderLeft = '' }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderLeft = ''
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
                padding: '4px 10px',
                minWidth: 100,
                maxWidth: 200,
                cursor: 'pointer',
                borderRight: '1px solid var(--border-subtle)',
                background: tab.id === activeTabId ? 'var(--bg-primary)' : 'transparent',
                borderBottom: tab.id === activeTabId ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                userSelect: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (tab.id !== activeTabId) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (tab.id !== activeTabId) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.pinned && <Pin size={11} style={{ color: 'var(--accent)' }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="tab-close-btn"
                style={{
                  padding: 1,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-active)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() => addTab()}
            style={{
              padding: '4px 8px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
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
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 0',
              minWidth: 160,
              boxShadow: 'var(--shadow)',
            }}
          >
            <MenuItem icon={<Pin size={13} />} label="Pin Tab" onClick={() => { pinTab(contextTab); closeContextMenu() }} />
            <MenuItem icon={<Copy size={13} />} label="Duplicate Tab" onClick={() => { duplicateTab(contextTab); closeContextMenu() }} />
            <MenuItem icon={<Columns size={13} />} label="Split Tab" onClick={() => { toggleDualPane(contextTab); closeContextMenu() }} />
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
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
        gap: 8,
        width: '100%',
        padding: '5px 12px',
        fontSize: 12.5,
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        background: 'transparent',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  )
}
