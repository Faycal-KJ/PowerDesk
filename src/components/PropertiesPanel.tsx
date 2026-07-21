import { useState, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { X, File, Folder, FileText, Image, Video, Music, Camera, Palette, Eye } from 'lucide-react'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp', '.svg', '.avif', '.heic', '.heif']

export default function PropertiesPanel() {
  const propertiesFile = useStore((s) => s.propertiesFile)
  const setPropertiesFile = useStore((s) => s.setPropertiesFile)
  const folderSizes = useStore((s) => s.folderSizes)
  const [fileStat, setFileStat] = useState<any>(null)
  const [inspectData, setInspectData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'general' | 'metadata'>('general')

  const api = getApi()

  useEffect(() => {
    if (!propertiesFile) {
      setFileStat(null)
      setInspectData(null)
      return
    }
    setLoading(true)
    setInspectData(null)
    setTab('general')
    const ext = propertiesFile.extension?.toLowerCase() || ''
    const isImage = IMAGE_EXTS.includes(ext)

    const promises: Promise<any>[] = []
    if (api?.getFileStat) promises.push(api.getFileStat(propertiesFile.path))
    if (api?.fileInspect) promises.push(api.fileInspect(propertiesFile.path))

    Promise.all(promises).then(([stat, inspect]) => {
      if (stat) setFileStat(stat)
      if (inspect) setInspectData(inspect)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [propertiesFile])

  if (!propertiesFile) return null

  const ext = propertiesFile.extension?.toLowerCase() || ''
  const isDir = propertiesFile.isDirectory
  const isImage = IMAGE_EXTS.includes(ext)
  const hasMetadata = inspectData?.image

  function getFileType(): string {
    if (isDir) return 'Folder'
    const typeMap: Record<string, string> = {
      '.txt': 'Text File', '.md': 'Markdown', '.json': 'JSON', '.xml': 'XML',
      '.js': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript JSX',
      '.jsx': 'JavaScript JSX', '.css': 'CSS', '.html': 'HTML',
      '.py': 'Python', '.rs': 'Rust', '.go': 'Go', '.java': 'Java',
      '.png': 'PNG Image', '.jpg': 'JPEG Image', '.jpeg': 'JPEG Image',
      '.gif': 'GIF Image', '.webp': 'WebP Image', '.svg': 'SVG Image',
      '.mp4': 'MP4 Video', '.mov': 'MOV Video', '.avi': 'AVI Video',
      '.mp3': 'MP3 Audio', '.wav': 'WAV Audio', '.flac': 'FLAC Audio',
      '.zip': 'ZIP Archive', '.rar': 'RAR Archive', '.7z': '7-Zip Archive',
      '.pdf': 'PDF Document', '.doc': 'Word Document', '.docx': 'Word Document',
      '.xls': 'Excel Spreadsheet', '.xlsx': 'Excel Spreadsheet',
      '.exe': 'Application', '.dll': 'Dynamic Library',
    }
    return typeMap[ext] || (ext ? `${ext.toUpperCase()} File` : 'File')
  }

  return (
    <div
      className="floating-panel"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 360,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Properties</span>
        <button
          onClick={() => setPropertiesFile(null)}
          style={{
            display: 'flex',
            padding: 4,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Image preview */}
      {isImage && inspectData && !loading && (
        <div style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, maxHeight: 180 }}>
          <img
            src={`file://${propertiesFile.path}`}
            alt={propertiesFile.name}
            style={{ maxWidth: '100%', maxHeight: 156, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      {/* Tabs for image files */}
      {hasMetadata && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
          {(['general', 'metadata'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', fontSize: 12, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', textTransform: 'capitalize',
            }}>{t === 'general' ? 'General' : 'EXIF'}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12.5, textAlign: 'center', padding: 20 }}>
            Loading...
          </div>
        ) : tab === 'general' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Icon + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isDir ? (
                  <Folder size={28} style={{ color: 'var(--accent)' }} />
                ) : ext && ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? (
                  <Image size={28} style={{ color: 'var(--text-secondary)' }} />
                ) : ext && ['.mp4', '.mov', '.avi'].includes(ext) ? (
                  <Video size={28} style={{ color: 'var(--text-secondary)' }} />
                ) : ext && ['.mp3', '.wav', '.flac'].includes(ext) ? (
                  <Music size={28} style={{ color: 'var(--text-secondary)' }} />
                ) : ext && ['.txt', '.md', '.json'].includes(ext) ? (
                  <FileText size={28} style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <File size={28} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {propertiesFile.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {getFileType()}
                </div>
              </div>
            </div>

            {/* Basic Properties */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <PropertyRow label="Location" value={propertiesFile.path.replace(/[\\\/][^\\\/]+$/, '')} />
              <PropertyRow
                label="Size"
                value={
                  isDir
                    ? (folderSizes[propertiesFile.path] != null
                      ? formatSize(folderSizes[propertiesFile.path])
                      : 'Calculating...')
                    : formatSize(propertiesFile.size)
                }
              />
              {!isDir && <PropertyRow label="Extension" value={ext || 'None'} />}
              <PropertyRow label="Modified" value={formatDate(propertiesFile.modifiedAt)} />
              {fileStat?.createdAt && <PropertyRow label="Created" value={formatDate(fileStat.createdAt)} />}
              {fileStat?.accessedAt && <PropertyRow label="Accessed" value={formatDate(fileStat.accessedAt)} />}
              {fileStat?.isDirectory != null && <PropertyRow label="Type" value={fileStat.isDirectory ? 'Folder' : 'File'} />}
            </div>

            {/* Image quick info */}
            {isImage && inspectData?.image && (
              <div>
                <div style={sectionTitle}>Image</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <PropertyRow label="Format" value={inspectData.image.format?.toUpperCase() || '—'} />
                  <PropertyRow label="Dimensions" value={`${inspectData.image.width} × ${inspectData.image.height} px`} />
                  {inspectData.image.density && <PropertyRow label="DPI" value={`${inspectData.image.density} DPI`} />}
                  <PropertyRow label="Color Space" value={inspectData.image.space || '—'} />
                  <PropertyRow label="Channels" value={String(inspectData.image.channels || '—')} />
                  <PropertyRow label="Bit Depth" value={inspectData.image.depth || '—'} />
                  <PropertyRow label="Has Alpha" value={inspectData.image.hasAlpha ? 'Yes' : 'No'} />
                  {inspectData.image.dominant && (
                    <PropertyRow label="Dominant Color" value={
                      `${rgbToHex(inspectData.image.dominant.r, inspectData.image.dominant.g, inspectData.image.dominant.b).toUpperCase()}`
                    } />
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {propertiesFile.tags && propertiesFile.tags.length > 0 && (
              <div>
                <div style={sectionTitle}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {propertiesFile.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(124, 92, 252, 0.25)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Color label */}
            {propertiesFile.color && (
              <div>
                <div style={sectionTitle}>Color Label</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: propertiesFile.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{propertiesFile.color}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Metadata / EXIF tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Camera EXIF */}
            {inspectData?.image?.exif && Object.keys(inspectData.image.exif).length > 0 && (
              <div>
                <div style={sectionTitle}><Camera size={13} /> Camera Info</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {inspectData.image.exif.make && <PropertyRow label="Make" value={inspectData.image.exif.make} />}
                  {inspectData.image.exif.model && <PropertyRow label="Model" value={inspectData.image.exif.model} />}
                  {inspectData.image.exif.iso && <PropertyRow label="ISO" value={String(inspectData.image.exif.iso)} />}
                  {inspectData.image.exif.focalLength && <PropertyRow label="Focal Length" value={inspectData.image.exif.focalLength} />}
                  {inspectData.image.exif.aperture && <PropertyRow label="Aperture" value={inspectData.image.exif.aperture} />}
                  {inspectData.image.exif.exposureTime && <PropertyRow label="Exposure" value={inspectData.image.exif.exposureTime} />}
                  {inspectData.image.exif.dateTimeOriginal && <PropertyRow label="Date Taken" value={inspectData.image.exif.dateTimeOriginal} />}
                  {inspectData.image.exif.software && <PropertyRow label="Software" value={inspectData.image.exif.software} />}
                  {inspectData.image.exif.artist && <PropertyRow label="Artist" value={inspectData.image.exif.artist} />}
                  {inspectData.image.exif.copyright && <PropertyRow label="Copyright" value={inspectData.image.exif.copyright} />}
                </div>
              </div>
            )}

            {/* Full image metadata */}
            {inspectData?.image && (
              <div>
                <div style={sectionTitle}><Palette size={13} /> Full Image Metadata</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {Object.entries(inspectData.image).map(([key, val]) => {
                    if (val === null || val === undefined || key === 'exif') return null
                    const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val)
                    return <PropertyRow key={key} label={key} value={displayVal} />
                  })}
                </div>
              </div>
            )}

            {!inspectData?.image && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, padding: 20 }}>
                No metadata available for this file type
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200,
          marginLeft: 8,
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
}
