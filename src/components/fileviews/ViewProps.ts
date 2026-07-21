import type { FileItem } from '../../types'
import type { RefObject } from 'react'

export interface ViewProps {
  sorted: FileItem[]
  selectedPaths: Set<string>
  hoveredPath: string | null
  dragOverPath: string | null
  dragSelect: { startX: number; startY: number; endX: number; endY: number } | null
  iconSize: number
  showThumbnails: boolean
  thumbnailCache: Record<string, string>
  batchRenameOpen: boolean
  folderSizes: Record<string, number>
  containerRef: any
  itemRefs: any
  onClick: (file: FileItem, e: React.MouseEvent) => void
  onDoubleClick: (file: FileItem) => void
  onContextMenu: (file: FileItem, e: React.MouseEvent) => void
  onMouseEnter: (path: string) => void
  onMouseLeave: () => void
  onDragStart: (file: FileItem, e: React.DragEvent) => void
  onDragOver: (file: FileItem, e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (file: FileItem, e: React.DragEvent) => void
  setBatchRenameOpen: (v: boolean) => void
}
