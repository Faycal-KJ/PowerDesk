import { Image } from 'lucide-react'
import { ThumbnailBox, ThumbnailToggle, DragSelectOverlay } from './shared'
import { imageExts, thumbnailScale, sortFiles } from '../../lib/fileAreaUtils'
import BatchRenameDialog from '../BatchRenameDialog'
import type { ViewProps } from './ViewProps'

interface GalleryViewProps extends ViewProps {
  onBgContextMenu: (x: number, y: number) => void
  onBatchDone: () => void
  onBatchRename: (oldPath: string, newName: string) => Promise<void>
  onMouseDown: (e: React.MouseEvent) => void
}

export default function GalleryView({
  sorted, selectedPaths, hoveredPath, dragSelect, showThumbnails, thumbnailCache,
  batchRenameOpen, containerRef, itemRefs,
  onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseLeave,
  onDragStart, onDragOver, onDragLeave, onDrop,
  setBatchRenameOpen, onBgContextMenu, onBatchDone, onBatchRename, onMouseDown,
}: GalleryViewProps) {
  const images = sorted.filter((f) => !f.isDirectory && imageExts.has(f.extension))

  return (
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
      style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', position: 'relative', userSelect: 'none' }}
    >
      <ThumbnailToggle selectedCount={selectedPaths.size} onBatchRename={() => setBatchRenameOpen(true)} />
      {batchRenameOpen && selectedPaths.size > 0 && (
        <BatchRenameDialog
          files={Array.from(selectedPaths)}
          onClose={() => setBatchRenameOpen(false)}
          onDone={onBatchDone}
          onRename={onBatchRename}
        />
      )}
      {images.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          No images in this folder
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
            padding: 8,
          }}
        >
          {images.map((file) => {
            const isSelected = selectedPaths.has(file.path)
            const isHovered = hoveredPath === file.path
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
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                outline: 'none',
                background: isSelected ? 'var(--accent-bg)' : isHovered ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              <div
                style={{
                  height: 150,
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  overflow: 'hidden',
                }}
              >
                {showThumbnails ? (
                  <ThumbnailBox
                    src={thumbnailCache[file.path]}
                    fileName={file.name}
                    size="100%"
                    containerHeight={150 * thumbnailScale}
                  />
                ) : (
                  <Image size={32} style={{ opacity: 0.3 }} />
                )}
              </div>
              <div
                style={{
                  padding: '4px 8px',
                  fontSize: 11.5,
                  background: 'var(--bg-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </div>
            </div>
            )
          })}
        </div>
      )}
      <DragSelectOverlay dragSelect={dragSelect} />
    </div>
  )
}
