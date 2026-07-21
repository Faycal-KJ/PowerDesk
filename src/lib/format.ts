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

export function formatDateRelative(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateAbsolute(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '\u2014'
  return formatSize(bytesPerSec) + '/s'
}

export function formatEta(transferred: number, total: number, speed: number): string {
  if (speed <= 0 || total <= transferred) return '\u2014'
  const remaining = total - transferred
  const seconds = Math.ceil(remaining / speed)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export const imageExts = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg',
  '.avif', '.heic', '.heif', '.tiff', '.tif', '.ico',
])

export function getFileIconColor(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': '#e74c3c', '.doc': '#2980b9', '.docx': '#2980b9',
    '.xls': '#27ae60', '.xlsx': '#27ae60', '.ppt': '#e67e22', '.pptx': '#e67e22',
    '.js': '#f1c40f', '.jsx': '#f1c40f', '.ts': '#2980b9', '.tsx': '#2980b9',
    '.css': '#3498db', '.scss': '#e84393', '.html': '#e67e22',
    '.py': '#f1c40f', '.go': '#00add8',
  }
  return map[ext] || 'var(--text-secondary)'
}
