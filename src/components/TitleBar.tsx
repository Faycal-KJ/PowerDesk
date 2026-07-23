import { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { getApi } from '../lib/api'

const api = getApi()

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!api) return
    api.windowIsMaximized().then(setIsMaximized)
    api.onWindowMaximizeChange?.((v: boolean) => setIsMaximized(v))
  }, [])

  const dragStyle = {
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'transparent',
    userSelect: 'none',
    flexShrink: 0,
    zIndex: 9999,
    paddingLeft: 12,
    WebkitAppRegion: 'drag',
  } as React.CSSProperties

  const noDragStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties

  return (
    <div style={dragStyle}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.3px',
        }}
      >
        PowerDesk
      </span>
      <div style={noDragStyle}>
        <button
          onClick={() => api?.windowMinimize()}
          style={{
            width: 46,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => api?.windowMaximize()}
          style={{
            width: 46,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Maximize2 size={12} /> : <Square size={10} />}
        </button>
        <button
          onClick={() => api?.windowClose()}
          style={{
            width: 46,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#c42b1c'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
