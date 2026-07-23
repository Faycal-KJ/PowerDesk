import { useState } from 'react'
import { useStore } from '../../stores/useStore'
import { Eye, EyeOff } from 'lucide-react'

export function ThumbnailBox({ src, fileName, size, containerHeight }: { src?: string | null; fileName: string; size: number | string; containerHeight?: number }) {
  const isNum = typeof size === 'number'
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      style={{
        width: isNum ? size : undefined,
        height: containerHeight ?? (isNum ? size : undefined),
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: isNum ? size : undefined,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={fileName}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 200ms ease' }}
        />
      ) : null}
    </div>
  )
}

export function TagBadges({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: 9,
            padding: '1px 5px',
            borderRadius: 8,
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '1px solid rgba(124, 92, 252, 0.25)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 80,
          }}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{tags.length - 3}</span>
      )}
    </div>
  )
}

export function ThumbnailToggle({
  selectedCount,
  onBatchRename,
}: {
  selectedCount?: number
  onBatchRename?: () => void
}) {
  const showThumbnails = useStore((s) => s.showThumbnails)
  const setShowThumbnails = useStore((s) => s.setShowThumbnails)
  return (
    <div
      data-thumb-toggle="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}
    >
      <button
        onClick={() => setShowThumbnails(!showThumbnails)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: showThumbnails ? 'var(--accent)' : 'var(--text-muted)',
          padding: '2px 4px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {showThumbnails ? <Eye size={12} /> : <EyeOff size={12} />}
        {showThumbnails ? 'Thumbnails On' : 'Thumbnails Off'}
      </button>

      {selectedCount && selectedCount > 0 ? (
        <>
          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
            {selectedCount} selected
          </span>
          <button
            onClick={onBatchRename}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--accent)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              marginLeft: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Batch Rename
          </button>
        </>
      ) : null}
    </div>
  )
}

export function DragSelectOverlay({ dragSelect }: { dragSelect: { startX: number; startY: number; endX: number; endY: number } | null }) {
  if (!dragSelect) return null
  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(dragSelect.startX, dragSelect.endX),
        top: Math.min(dragSelect.startY, dragSelect.endY),
        width: Math.abs(dragSelect.endX - dragSelect.startX),
        height: Math.abs(dragSelect.endY - dragSelect.startY),
        background: 'rgba(52, 152, 219, 0.12)',
        border: '1.5px solid rgba(52, 152, 219, 0.5)',
        borderRadius: 3,
        pointerEvents: 'none',
        zIndex: 500,
      }}
    />
  )
}
