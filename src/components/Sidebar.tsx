import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { PluginTreeSections } from '../plugins/ExtensionPoint'
import { t } from '../i18n/translations'
import {
  Star,
  HardDrive,
  History,
  Download,
  Monitor,
  FileText,
  Image,
  Video,
  Music,
  ChevronLeft,
  ChevronRight,
  Folder,
  Tag,
  X,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star size={14} />,
  HardDrive: <HardDrive size={14} />,
  History: <History size={14} />,
  Download: <Download size={14} />,
  Monitor: <Monitor size={14} />,
  FileText: <FileText size={14} />,
  Image: <Image size={14} />,
  Video: <Video size={14} />,
  Music: <Music size={14} />,
}

export default function Sidebar() {
  const _lang = useStore((s) => s.ui.language)
  const sidebarWidth = useStore((s) => s.sidebarWidth)
  const setSidebarWidth = useStore((s) => s.setSidebarWidth)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const navigateTo = useStore((s) => s.navigateTo)
  const initialDirs = useStore((s) => s.initialDirs)
  const [drives, setDrives] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    favorites: false,
    drives: false,
    recent: false,
    tags: false,
  })

  const [recentFiles, setRecentFiles] = useState<Array<{ name: string; path: string }>>([])

  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const activePath = activeTab?.path || ''
  const recentLimit = useStore((s) => s.settings.recentLimit)
  const subtleGradients = useStore((s) => s.ui?.subtleGradients)
  const gradientStrength = useStore((s) => s.ui?.sidebarGradientStrength ?? 40)
  const bgSecondary = useStore((s) => s.ui?.bgSecondary)
  const accentColor = useStore((s) => s.ui?.accentColor)

  const favorites = useStore((s) => s.favorites)
  const removeFavorite = useStore((s) => s.removeFavorite)

  const clipboardItems = useStore((s) => s.clipboardItems)
  const clipboardOp = useStore((s) => s.clipboardOp)
  const setClipboard = useStore((s) => s.setClipboard)
  const refresh = useStore((s) => s.refresh)

  const [folderDropTarget, setFolderDropTarget] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ path: string; name: string; x: number; y: number } | null>(null)

  const sidebarGradientStart = (() => {
    if (!bgSecondary || !accentColor) return '#222222'
    const h1 = bgSecondary.replace('#', '')
    const r1 = parseInt(h1.slice(0, 2), 16)
    const g1 = parseInt(h1.slice(2, 4), 16)
    const b1 = parseInt(h1.slice(4, 6), 16)
    const h2 = accentColor.replace('#', '')
    const r2 = parseInt(h2.slice(0, 2), 16)
    const g2 = parseInt(h2.slice(2, 4), 16)
    const b2 = parseInt(h2.slice(4, 6), 16)
    const mix = 0.15
    const mr = Math.round(r1 + (r2 - r1) * mix)
    const mg = Math.round(g1 + (g2 - g1) * mix)
    const mb = Math.round(b1 + (b2 - b1) * mix)
    const lr = Math.min(255, Math.round(mr + (255 - mr) * 0.07))
    const lg = Math.min(255, Math.round(mg + (255 - mg) * 0.07))
    const lb = Math.min(255, Math.round(mb + (255 - mb) * 0.07))
    return `rgb(${lr},${lg},${lb})`
  })()

  const sidebarGradientEnd = (() => {
    if (!bgSecondary) return 'var(--bg-mica)'
    const h = bgSecondary.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgb(${Math.round(r * 0.78)},${Math.round(g * 0.78)},${Math.round(b * 0.78)})`
  })()

  useEffect(() => {
    const api = getApi()
    if (api?.getRecentFiles) {
      api.getRecentFiles().then((files: Array<{ name: string; path: string }>) => {
        setRecentFiles(files || [])
      })
    }
  }, [activeTab?.path])

  const allTags = useStore((s) => s.allTags)
  const activeTagFilter = useStore((s) => s.activeTagFilter)
  const setActiveTagFilter = useStore((s) => s.setActiveTagFilter)

  useEffect(() => {
    const api = getApi()
    if (api?.getDrivesWindows) {
      api.getDrivesWindows().then(setDrives)
    }
  }, [])

  const favoriteItems = [
    { id: 'desktop', labelKey: 'desktop', icon: 'Monitor', key: 'desktop' },
    { id: 'downloads', labelKey: 'downloads', icon: 'Download', key: 'downloads' },
    { id: 'documents', labelKey: 'documents', icon: 'FileText', key: 'documents' },
    { id: 'pictures', labelKey: 'pictures', icon: 'Image', key: 'pictures' },
    { id: 'videos', labelKey: 'videos', icon: 'Video', key: 'videos' },
    { id: 'music', labelKey: 'music', icon: 'Music', key: 'music' },
  ]

  const handleNavigate = (path: string | undefined) => {
    if (path) navigateTo(path)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth
    const handleMouseMove = (ev: MouseEvent) => {
      setSidebarWidth(startWidth + (ev.clientX - startX))
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const toggleSection = (id: string) =>
    setCollapsed((s) => ({ ...s, [id]: !(s as any)[id] }))

  const handleFavContextMenu = useCallback((e: React.MouseEvent, path: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ path, name, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (contextMenu) {
      const handler = () => closeContextMenu()
      window.addEventListener('click', handler)
      window.addEventListener('contextmenu', handler)
      return () => {
        window.removeEventListener('click', handler)
        window.removeEventListener('contextmenu', handler)
      }
    }
  }, [contextMenu, closeContextMenu])

  const handleFolderDragOver = useCallback((e: React.DragEvent, drivePath: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move'
    setFolderDropTarget(drivePath)
  }, [])

  const handleFolderDragLeave = useCallback(() => {
    setFolderDropTarget(null)
  }, [])

  const extractDropPaths = useCallback((e: React.DragEvent): string[] => {
    const dt = (e as any).nativeEvent?.dataTransfer || e.dataTransfer
    if (!dt) return []
    try {
      const json = dt.getData('application/json')
      if (json) {
        const data = JSON.parse(json)
        if (data?.paths && Array.isArray(data.paths)) return data.paths
      }
    } catch {}
    try {
      const text = dt.getData('text/plain')
      if (text && (text.includes('\\') || text.includes('/'))) return [text]
    } catch {}
    return []
  }, [])

  const handleFolderDrop = useCallback(async (folderPath: string, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFolderDropTarget(null)
    const paths = extractDropPaths(e)
    if (paths.length > 0) {
      const api = getApi()
      if (!api) return
      for (const src of paths) {
        const baseName = src.split('\\').pop() || src.split('/').pop() || ''
        const dest = folderPath + '\\' + baseName
        if (e.ctrlKey) await api.fileCopy(src, dest)
        else await api.fileRename(src, dest)
      }
      refresh()
    }
  }, [extractDropPaths, refresh])

  return (
    <div
      data-sidebar
      className="floating-panel"
      style={{
        width: sidebarWidth,
        minWidth: 160,
        height: '100%',
        background: subtleGradients ? `linear-gradient(90deg, ${sidebarGradientStart} 0%, ${sidebarGradientEnd} ${Math.max(0, Math.min(100, gradientStrength))}%)` : 'var(--bg-sidebar)',
        boxShadow: '1px 0 6px rgba(0,0,0,0.1), 4px 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '0.3px',
          }}
        >
          {t('explorer')}
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            color: 'var(--text-muted)',
            padding: 3,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 8px' }}>
        {/* Favorites */}
        <SidebarSection
          label={t('favorites')}
          icon={<Star size={12} />}
          collapsed={collapsed.favorites}
          onToggle={() => toggleSection('favorites')}
        >
          {favoriteItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={iconMap[item.icon]}
              label={t(item.labelKey)}
              onClick={() => handleNavigate(initialDirs[item.key])}
              active={activePath === initialDirs[item.key]}
            />
          ))}
          {favorites.length > 0 && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px', opacity: 0.5 }} />}
          {favorites.map((fav) => (
            <SidebarItem
              key={fav.path}
              icon={<Star size={13} style={{ color: 'var(--accent)' }} />}
              label={fav.name}
              onClick={() => handleNavigate(fav.path)}
              active={activePath === fav.path}
              onContextMenu={(e) => handleFavContextMenu(e, fav.path, fav.name)}
            />
          ))}
        </SidebarSection>

        {/* Drives */}
        <SidebarSection
          label={t('drives')}
          icon={<HardDrive size={12} />}
          collapsed={collapsed.drives}
          onToggle={() => toggleSection('drives')}
        >
          {drives.map((drive) => (
            <SidebarItem
              key={drive}
              icon={<Folder size={13} style={{ color: 'var(--accent)' }} />}
              label={drive}
              onClick={() => handleNavigate(drive)}
              active={activePath === drive}
              onDragOver={(e) => handleFolderDragOver(e, drive)}
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) => handleFolderDrop(drive, e)}
              dropHighlight={folderDropTarget === drive}
            />
          ))}
        </SidebarSection>

        {/* Recent */}
        <SidebarSection
          label={t('recent')}
          icon={<History size={12} />}
          collapsed={collapsed.recent}
          onToggle={() => toggleSection('recent')}
        >
          {recentFiles.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              {t('noRecent')}
            </div>
          ) : (
            <div>
              {recentFiles.slice(0, recentLimit).map((file) => (
                <SidebarItem
                  key={file.path}
                  icon={<Folder size={13} style={{ color: 'var(--accent)' }} />}
                  label={file.name}
                  onClick={() => handleNavigate(file.path)}
                  active={activePath === file.path}
                />
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Tags */}
        <SidebarSection
          label={t('tags')}
          icon={<Tag size={12} />}
          collapsed={collapsed.tags}
          onToggle={() => toggleSection('tags')}
        >
          {allTags.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              {t('noTags')}
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {activeTagFilter && (
                <button
                  onClick={() => setActiveTagFilter(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '5px 12px 5px 20px',
                    color: 'var(--accent)',
                    fontSize: 12,
                    background: 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <X size={12} />
                  {t('clearFilter')}
                </button>
              )}
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '5px 12px 5px 20px',
                    color: activeTagFilter === tag ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    background: activeTagFilter === tag ? 'var(--accent-bg)' : 'transparent',
                    fontWeight: activeTagFilter === tag ? 500 : 400,
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTagFilter !== tag) e.currentTarget.style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (activeTagFilter !== tag) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Tag size={12} />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </SidebarSection>

        <PluginTreeSections />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          zIndex: 10,
          transition: 'background 200ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Context menu for favorites */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            padding: '4px 0',
            minWidth: 180,
          }}
        >
          <button
            onClick={() => {
              handleNavigate(contextMenu.path)
              closeContextMenu()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--text-primary)',
              background: 'transparent',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <Folder size={13} />
            {t('open')}
          </button>
          <button
            onClick={() => {
              removeFavorite(contextMenu.path)
              closeContextMenu()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--danger)',
              background: 'transparent',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={13} />
            {t('removeFavorite')}
          </button>
        </div>
      )}
    </div>
  )
}

function SidebarSection({
  label,
  icon,
  children,
  collapsed,
  onToggle,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  collapsed: boolean
  onToggle: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current && !collapsed) {
      setMeasuredHeight(contentRef.current.scrollHeight)
    }
  })

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 8px',
          color: 'var(--text-muted)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          background: 'transparent',
          textAlign: 'left',
          borderRadius: 'var(--radius-sm)',
          transition: 'all 150ms ease',
          opacity: 0.7,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <ChevronRight
          size={10}
          style={{
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            transition: 'transform 200ms cubic-bezier(0.33, 0, 0.67, 1)',
          }}
        />
        {icon}
        {label}
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: collapsed ? 0 : (measuredHeight || 500),
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 200ms cubic-bezier(0.33, 0, 0.67, 1), opacity 150ms ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  onClick,
  active,
  onContextMenu,
  onDragOver,
  onDragLeave,
  onDrop,
  dropHighlight,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  onContextMenu?: (e: React.MouseEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  dropHighlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 8px 7px 24px',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 12.5,
        fontWeight: active ? 500 : 400,
        background: dropHighlight ? 'rgba(99,102,241,0.15)' : active ? 'var(--accent-bg)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : dropHighlight ? '2px solid var(--accent)' : '2px solid transparent',
        textAlign: 'left',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 120ms ease',
        letterSpacing: '0.1px',
      }}
      onMouseEnter={(e) => { if (!active && !dropHighlight) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { if (!active && !dropHighlight) e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}
