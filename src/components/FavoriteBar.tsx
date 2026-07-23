import { useState, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { Star, X, Folder, File } from 'lucide-react'

export default function FavoriteBar() {
  const favoriteBarOpen = useStore((s) => s.favoriteBarOpen)
  const favorites = useStore((s) => s.favorites)
  const removeFavorite = useStore((s) => s.removeFavorite)
  const navigateTo = useStore((s) => s.navigateTo)
  const setPreviewFile = useStore((s) => s.setPreviewFile)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  if (!favoriteBarOpen) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 12px',
        background: 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'auto',
        minHeight: 30,
        userSelect: 'none',
      }}
    >
      <Star size={11} style={{ color: 'var(--accent)', flexShrink: 0, marginRight: 4 }} />
      {favorites.length === 0 ? (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Right-click a file or folder to add to favorites
        </span>
      ) : (
        favorites.map((fav, idx) => {
          const isFile = fav.type === 'file'
          const Icon = isFile ? File : Folder
          return (
            <div
              key={fav.path}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                if (isFile) {
                  const sep = fav.path.includes('\\') ? '\\' : '/'
                  const parentDir = fav.path.split(sep).slice(0, -1).join(sep)
                  navigateTo(parentDir).then(() => {
                    const state = useStore.getState()
                    const file = state.files.find((f) => f.path === fav.path)
                    if (file) setPreviewFile(file)
                  })
                } else {
                  navigateTo(fav.path)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 11,
                color: 'var(--text-secondary)',
                background: hoveredIdx === idx ? 'var(--bg-hover)' : 'transparent',
                border: hoveredIdx === idx ? '1px solid var(--border-card)' : '1px solid transparent',
                flexShrink: 0,
                transition: 'all 150ms ease',
              }}
              title={fav.path}
            >
              <Icon size={11} style={{ flexShrink: 0, color: 'var(--accent)', opacity: 0.7 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{fav.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFavorite(fav.path) }}
                style={{ display: 'flex', padding: 0, marginLeft: 1, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: hoveredIdx === idx ? 1 : 0, transition: 'opacity 150ms ease' }}
                title="Remove from favorites"
              >
                <X size={10} />
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
