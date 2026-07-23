import { ThumbnailBox, ThumbnailToggle, DragSelectOverlay } from './shared'
import { getFileIcon, formatSize, formatDate, imageExts, thumbnailScale } from '../../lib/fileAreaUtils'
import { getFileDecorations } from '../../plugins/ExtensionPoint'
import BatchRenameDialog from '../BatchRenameDialog'
import type { ViewProps } from './ViewProps'

interface ListViewProps extends ViewProps {
  onBgContextMenu: (x: number, y: number) => void
  onBatchDone: () => void
  onBatchRename: (oldPath: string, newName: string) => Promise<void>
  onMouseDown: (e: React.MouseEvent) => void
}

export default function ListView({
  sorted, selectedPaths, hoveredPath, dragOverPath, dragSelect,
  iconSize, showThumbnails, thumbnailCache, batchRenameOpen, folderSizes,
  containerRef, itemRefs,
  onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseLeave,
  onDragStart, onDragOver, onDragLeave, onDrop,
  setBatchRenameOpen, onBgContextMenu, onBatchDone, onBatchRename, onMouseDown,
}: ListViewProps) {
  const s = Math.min(Math.max(iconSize / 24, 0.8), 2.5)
  const nameFs = Math.round(12 * s)
  const metaFs = Math.round(11 * s)
  const tagFs = Math.round(9.5 * s)
  const padV = Math.round(4 * s)
  const padH = Math.round(6 * s)
  const iconCol = Math.round(iconSize + 14)
  const iconRender = Math.round(iconSize * 0.85)
  const thumbRender = Math.min(iconRender, 200) * thumbnailScale
  const headerFs = Math.round(10.5 * s)

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
      style={{ flex: 1, overflow: 'auto', background: 'var(--bg-mica)', position: 'relative', userSelect: 'none' }}
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
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr
            style={{
              fontSize: headerFs,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
              background: 'var(--bg-mica)',
              zIndex: 1,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <th style={{ width: iconCol, padding: `${padV + 2}px ${padH}px`, textAlign: 'left' }} />
            <th style={{ padding: `${padV + 2}px ${padH}px`, textAlign: 'left' }}>Name</th>
            <th style={{ width: Math.round(90 * s), padding: `${padV + 2}px ${padH}px`, textAlign: 'right' }}>Size</th>
            <th style={{ width: Math.round(130 * s), padding: `${padV + 2}px ${padH}px`, textAlign: 'right' }}>Date Modified</th>
            <th style={{ width: Math.round(150 * s), padding: `${padV + 2}px ${padH}px`, textAlign: 'left' }}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => {
            const isSelected = selectedPaths.has(file.path)
            const isHovered = hoveredPath === file.path
            const deco = getFileDecorations(file.path, file)
            return (
            <tr
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
                cursor: 'pointer',
                background: isSelected
                  ? 'var(--accent-bg)'
                  : dragOverPath === file.path
                    ? 'rgba(46, 204, 113, 0.06)'
                    : isHovered
                      ? 'var(--bg-hover)'
                      : 'transparent',
                textDecoration: deco.strikethrough ? 'line-through' : undefined,
                fontStyle: deco.fontStyle || undefined,
                transition: 'background 100ms ease',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <td style={{ padding: `${padV}px ${padH}px`, textAlign: 'center', width: iconCol }}>
                {showThumbnails && imageExts.has(file.extension) ? (
                  <ThumbnailBox src={thumbnailCache[file.path]} fileName={file.name} size={thumbRender} />
                ) : (
                  getFileIcon(file, iconRender)
                )}
              </td>
              <td style={{ padding: `${padV}px ${padH}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: file.isDirectory ? 500 : deco.fontWeight === 'bold' ? 600 : 400, fontSize: nameFs, color: deco.color || undefined }}>
                {file.name}
                {deco.badge && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', marginLeft: 6 }}>{deco.badge}</span>}
              </td>
              <td style={{ padding: `${padV}px ${padH}px`, textAlign: 'right', color: 'var(--text-secondary)', fontSize: metaFs, whiteSpace: 'nowrap' }}>
                {file.isDirectory ? (folderSizes[file.path] != null ? formatSize(folderSizes[file.path]) : '—') : formatSize(file.size)}
              </td>
              <td style={{ padding: `${padV}px ${padH}px`, textAlign: 'right', color: 'var(--text-secondary)', fontSize: metaFs, whiteSpace: 'nowrap' }}>
                {formatDate(file.modifiedAt)}
              </td>
              <td style={{ padding: `${padV}px ${padH}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: tagFs }}>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflow: 'hidden' }}>
                  {file.tags && file.tags.length > 0 ? file.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      style={{ fontSize: tagFs, padding: `1px ${Math.round(5 * s)}px`, borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(124, 92, 252, 0.15)', whiteSpace: 'nowrap' }}
                    >
                      {tag}
                    </span>
                  )) : null}
                  {file.tags && file.tags.length > 2 && (
                    <span style={{ fontSize: tagFs, color: 'var(--text-muted)' }}>+{file.tags.length - 2}</span>
                  )}
                </div>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      <DragSelectOverlay dragSelect={dragSelect} />
    </div>
  )
}
