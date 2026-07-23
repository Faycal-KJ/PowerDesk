import { ThumbnailBox, ThumbnailToggle, DragSelectOverlay } from './shared'
import { getFileIcon, imageExts, thumbnailScale } from '../../lib/fileAreaUtils'
import { getFileDecorations } from '../../plugins/ExtensionPoint'
import BatchRenameDialog from '../BatchRenameDialog'
import { useStore } from '../../stores/useStore'
import type { ViewProps } from './ViewProps'

interface GridViewProps extends ViewProps {
  onBgContextMenu: (x: number, y: number) => void
  onBatchDone: () => void
  onBatchRename: (oldPath: string, newName: string) => Promise<void>
  onMouseDown: (e: React.MouseEvent) => void
}

export default function GridView({
  sorted, selectedPaths, hoveredPath, dragOverPath, dragSelect,
  iconSize, showThumbnails, thumbnailCache, batchRenameOpen,
  containerRef, itemRefs,
  onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseLeave,
  onDragStart, onDragOver, onDragLeave, onDrop,
  setBatchRenameOpen, onBgContextMenu, onBatchDone, onBatchRename, onMouseDown,
}: GridViewProps) {
  const gridItemSize = useStore((s) => s.ui.gridItemSize)
  const cellW = Math.max((gridItemSize || iconSize) + 56, 110)
  const thumbSize = Math.min((gridItemSize || iconSize) * 2.5 * thumbnailScale, cellW - 16)

  return (
    <div
      style={{ flex: 1, overflow: 'auto', background: 'var(--bg-mica)', position: 'relative' }}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => {
        if (!(e.target as HTMLElement).closest('[data-file-item]') && !(e.target as HTMLElement).closest('[data-thumb-toggle]')) {
          e.preventDefault()
          e.stopPropagation()
          onBgContextMenu(e.clientX, e.clientY)
        }
      }}
    >
      <ThumbnailToggle selectedCount={selectedPaths.size} onBatchRename={() => setBatchRenameOpen(true)} />
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onContextMenu={(e) => {
          if (!(e.target as HTMLElement).closest('[data-file-item]')) {
            e.preventDefault()
            e.stopPropagation()
            onBgContextMenu(e.clientX, e.clientY)
          }
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellW}px, 1fr))`,
          gap: 12,
          padding: 20,
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {batchRenameOpen && selectedPaths.size > 0 && (
          <BatchRenameDialog
            files={Array.from(selectedPaths)}
            onClose={() => setBatchRenameOpen(false)}
            onDone={onBatchDone}
            onRename={onBatchRename}
          />
        )}
        {sorted.map((file) => {
          const isSelected = selectedPaths.has(file.path)
          const isHovered = hoveredPath === file.path
          const deco = getFileDecorations(file.path, file)
          return (
          <div
            key={file.path}
            data-file-item="true"
            ref={(el) => { if (el) itemRefs.current?.set(file.path, el); else itemRefs.current?.delete(file.path) }}
            onClick={(e) => onClick(file, e)}
            onDoubleClick={() => onDoubleClick(file)}
            onContextMenu={(e) => onContextMenu(file, e)}
            onMouseEnter={() => onMouseEnter(file.path)}
            onMouseLeave={onMouseLeave}
            draggable
            onDragStart={(e) => onDragStart(file, e)}
            onDragOver={(e) => onDragOver(file, e)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(file, e)}
            title={deco.tooltip || undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '14px 10px 12px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              border: isSelected
                ? '1px solid rgba(124, 92, 252, 0.3)'
                : dragOverPath === file.path
                  ? '1px solid rgba(46, 204, 113, 0.3)'
                  : '1px solid transparent',
              background: isSelected
                ? 'var(--accent-bg)'
                : dragOverPath === file.path
                  ? 'rgba(46, 204, 113, 0.06)'
                  : isHovered
                    ? 'var(--bg-hover)'
                    : 'transparent',
              textDecoration: deco.strikethrough ? 'line-through' : undefined,
              fontStyle: deco.fontStyle || undefined,
              fontWeight: deco.fontWeight === 'bold' ? 600 : deco.fontWeight === 'lighter' ? 300 : undefined,
              transition: 'all 120ms ease',
              transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
              boxShadow: isHovered && !isSelected ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {showThumbnails && imageExts.has(file.extension) ? (
              <ThumbnailBox src={thumbnailCache[file.path]} fileName={file.name} size={thumbSize} />
            ) : (
              getFileIcon(file, iconSize)
            )}
            <span style={{
              fontSize: 11.5,
              fontWeight: file.isDirectory ? 500 : 400,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: cellW - 12,
              lineHeight: 1.3,
              wordBreak: 'break-word',
              color: deco.color || undefined,
              padding: '0 2px',
              letterSpacing: '0.1px',
            }}>
              {file.name}
            </span>
            {deco.badge && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' }}>{deco.badge}</span>}
            <TagBadgesInline tags={file.tags} />
          </div>
          )
        })}
      </div>
      <DragSelectOverlay dragSelect={dragSelect} />
    </div>
  )
}

function TagBadgesInline({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
      {tags.slice(0, 3).map((tag) => (
        <span key={tag} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(124, 92, 252, 0.15)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
          {tag}
        </span>
      ))}
      {tags.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{tags.length - 3}</span>}
    </div>
  )
}
