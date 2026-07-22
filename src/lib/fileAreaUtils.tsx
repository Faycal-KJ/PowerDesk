import { useState, useCallback } from 'react'
import { cloneElement } from 'react'
import {
  Folder,
  File,
  FileText,
  Image,
  Video,
  Music,
  FileArchive,
  FileCode,
  FileImage,
} from 'lucide-react'
import type { FileItem } from '../types'

const fileIconMap: Record<string, React.ReactElement> = {
  '.md': <FileText style={{ color: 'var(--text-secondary)' }} />,
  '.txt': <FileText style={{ color: 'var(--text-secondary)' }} />,
  '.pdf': <FileText style={{ color: '#e74c3c' }} />,
  '.doc': <FileText style={{ color: '#2980b9' }} />,
  '.docx': <FileText style={{ color: '#2980b9' }} />,
  '.xls': <FileText style={{ color: '#27ae60' }} />,
  '.xlsx': <FileText style={{ color: '#27ae60' }} />,
  '.ppt': <FileText style={{ color: '#e67e22' }} />,
  '.pptx': <FileText style={{ color: '#e67e22' }} />,
  '.png': <Image style={{ color: 'var(--text-secondary)' }} />,
  '.jpg': <Image style={{ color: 'var(--text-secondary)' }} />,
  '.jpeg': <Image style={{ color: 'var(--text-secondary)' }} />,
  '.gif': <Image style={{ color: 'var(--text-secondary)' }} />,
  '.svg': <FileImage style={{ color: 'var(--text-secondary)' }} />,
  '.webp': <Image style={{ color: 'var(--text-secondary)' }} />,
  '.mp4': <Video style={{ color: 'var(--text-secondary)' }} />,
  '.mov': <Video style={{ color: 'var(--text-secondary)' }} />,
  '.avi': <Video style={{ color: 'var(--text-secondary)' }} />,
  '.mkv': <Video style={{ color: 'var(--text-secondary)' }} />,
  '.mp3': <Music style={{ color: 'var(--text-secondary)' }} />,
  '.wav': <Music style={{ color: 'var(--text-secondary)' }} />,
  '.flac': <Music style={{ color: 'var(--text-secondary)' }} />,
  '.zip': <FileArchive style={{ color: 'var(--text-secondary)' }} />,
  '.rar': <FileArchive style={{ color: 'var(--text-secondary)' }} />,
  '.7z': <FileArchive style={{ color: 'var(--text-secondary)' }} />,
  '.tar': <FileArchive style={{ color: 'var(--text-secondary)' }} />,
  '.gz': <FileArchive style={{ color: 'var(--text-secondary)' }} />,
  '.html': <FileCode style={{ color: '#e67e22' }} />,
  '.ts': <FileCode style={{ color: '#2980b9' }} />,
  '.tsx': <FileCode style={{ color: '#2980b9' }} />,
  '.js': <FileCode style={{ color: '#f1c40f' }} />,
  '.jsx': <FileCode style={{ color: '#f1c40f' }} />,
  '.css': <FileCode style={{ color: '#3498db' }} />,
  '.scss': <FileCode style={{ color: '#e84393' }} />,
  '.json': <FileCode style={{ color: 'var(--text-secondary)' }} />,
  '.xml': <FileCode style={{ color: 'var(--text-secondary)' }} />,
  '.py': <FileCode style={{ color: '#f1c40f' }} />,
  '.rs': <FileCode style={{ color: 'var(--text-secondary)' }} />,
  '.go': <FileCode style={{ color: '#00add8' }} />,
  '.exe': <File style={{ color: 'var(--text-secondary)' }} />,
  '.dll': <File style={{ color: 'var(--text-secondary)' }} />,
}

export function getFileIcon(file: FileItem, iconSize: number) {
  if (file.isDirectory) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <Folder size={iconSize} style={{ color: 'var(--accent)' }} />
        {file.color && (
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: file.color,
              border: '2px solid var(--bg-primary)',
            }}
          />
        )}
      </div>
    )
  }
  if (file.extension && fileIconMap[file.extension]) {
    return cloneElement(fileIconMap[file.extension], { size: iconSize })
  }
  return <File size={iconSize} style={{ color: 'var(--text-muted)' }} />
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'])

export const thumbnailScale = 7 / 8

export function useThumbnailCache(): {
  thumbnailCache: Record<string, string>
  addThumbnails: (m: Record<string, string>) => void
} {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const addThumbnails = useCallback((m: Record<string, string>) => {
    setThumbnails((prev) => {
      let changed = false
      for (const k of Object.keys(m)) { if (!prev[k]) { changed = true; break } }
      if (!changed) return prev
      return { ...prev, ...m }
    })
  }, [])
  return { thumbnailCache: thumbnails, addThumbnails }
}

export type SortBy = 'name' | 'date' | 'size' | 'type' | 'tags'
export type SortDirection = 'asc' | 'desc'

export function sortFiles(files: FileItem[], sortBy: SortBy = 'name', sortDirection: SortDirection = 'asc'): FileItem[] {
  const dir = sortDirection === 'asc' ? 1 : -1
  return [...files].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    switch (sortBy) {
      case 'date': {
        const da = new Date(a.modifiedAt).getTime()
        const db = new Date(b.modifiedAt).getTime()
        return (da - db) * dir
      }
      case 'size':
        return (a.size - b.size) * dir
      case 'type': {
        const ea = (a.extension || '').toLowerCase()
        const eb = (b.extension || '').toLowerCase()
        const cmp = ea.localeCompare(eb)
        return cmp !== 0 ? cmp * dir : a.name.localeCompare(b.name)
      }
      case 'tags': {
        const ta = (a.tags || []).join(',')
        const tb = (b.tags || []).join(',')
        const cmp = ta.localeCompare(tb)
        return cmp !== 0 ? cmp * dir : a.name.localeCompare(b.name)
      }
      case 'name':
      default:
        return a.name.localeCompare(b.name) * dir
    }
  })
}

export function rectsIntersect(r1: DOMRect, r2: { left: number; top: number; right: number; bottom: number }) {
  return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top)
}
