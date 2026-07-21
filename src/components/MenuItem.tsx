import React from 'react'

interface MenuItemProps {
  icon?: React.ReactNode
  label: string
  danger?: boolean
  muted?: boolean
  shortcut?: string
  onClick?: () => void
}

export function MenuItem({ icon, label, danger, muted, shortcut, onClick }: MenuItemProps) {
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
        color: danger ? 'var(--danger)' : muted ? 'var(--text-muted)' : 'var(--text-primary)',
        background: 'transparent',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>{shortcut}</span>
      )}
    </button>
  )
}

export function Sep() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
}
