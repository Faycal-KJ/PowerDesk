import { ThumbnailBox, ThumbnailToggle, DragSelectOverlay } from './shared'
import { getFileIcon, imageExts, thumbnailScale } from '../../lib/fileAreaUtils'
import { getFileDecorations } from '../../plugins/ExtensionPoint'
import BatchRenameDialog from '../BatchRenameDialog'
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
  const cellW = Math.max(iconSize + 40, 90)
  const thumbSize = Math.min(iconSize * 2.5 * thumbnailScale, cellW - 8)

  return (
    <div
      style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', position: 'relative' }}
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
          gap: 4,
          padding: 8,
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
              gap: 4,
              padding: '8px 4px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              outline: isSelected ? `2px solid var(--accent)` : dragOverPath === file.path ? `2px solid var(--success)` : 'none',
              outlineOffset: -1,
              background: isSelected ? 'var(--accent-bg)' : dragOverPath === file.path ? 'rgba(46, 204, 113, 0.1)' : isHovered ? 'var(--bg-hover)' : 'transparent',
              textDecoration: deco.strikethrough ? 'line-through' : undefined,
              fontStyle: deco.fontStyle || undefined,
              fontWeight: deco.fontWeight === 'bold' ? 700 : deco.fontWeight === 'lighter' ? 300 : undefined,
            }}
          >
            {showThumbnails && imageExts.has(file.extension) ? (
              <ThumbnailBox src={thumbnailCache[file.path]} fileName={file.name} size={thumbSize} />
            ) : (
              getFileIcon(file, iconSize)
            )}
            <span style={{ fontSize: 11, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: cellW - 8, lineHeight: 1.3, wordBreak: 'break-all', color: deco.color || undefined }}>
              {file.name}
            </span>
            {deco.badge && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'var(--accent-bg)', color: 'var(--accent)' }}>{deco.badge}</span>}
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
        <span key={tag} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(124, 92, 252, 0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
          {tag}
        </span>
      ))}
      {tags.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{tags.length - 3}</span>}
    </div>
  )
}
