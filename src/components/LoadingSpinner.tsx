import React from 'react'

interface LoadingSpinnerProps {
  size?: number
  label?: string
  style?: React.CSSProperties
}

export function LoadingSpinner({ size = 24, label, style }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        color: 'var(--text-muted)',
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.2" />
        <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      {label && <span style={{ fontSize: 12 }}>{label}</span>}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
