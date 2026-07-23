import { useEffect, useState } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { PluginTreeSections } from '../plugins/ExtensionPoint'
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
  const recentLimit = useStore((s) => s.settings.recentLimit)

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

  const [userFavorites, setUserFavorites] = useState<Array<{ name: string; path: string }>>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pdx_favorites')
      if (raw) {
        const parsed = JSON.parse(raw)
        const items = Array.isArray(parsed)
          ? parsed.map((item: any) => typeof item === 'string'
            ? { name: item.split('\\').pop() || item, path: item }
            : { name: item.name || item.path.split('\\').pop() || item.path, path: item.path })
          : []
        setUserFavorites(items)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const api = getApi()
    if (api?.getDrivesWindows) {
      api.getDrivesWindows().then(setDrives)
    }
  }, [])

  const favoriteItems = [
    { id: 'desktop', label: 'Desktop', icon: 'Monitor', key: 'desktop' },
    { id: 'downloads', label: 'Downloads', icon: 'Download', key: 'downloads' },
    { id: 'documents', label: 'Documents', icon: 'FileText', key: 'documents' },
    { id: 'pictures', label: 'Pictures', icon: 'Image', key: 'pictures' },
    { id: 'videos', label: 'Videos', icon: 'Video', key: 'videos' },
    { id: 'music', label: 'Music', icon: 'Music', key: 'music' },
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

  return (
    <div
      style={{
        width: sidebarWidth,
        minWidth: 160,
        height: '100%',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px 8px',
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
          Explorer
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
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {/* Favorites */}
        <SidebarSection
          label="Favorites"
          icon={<Star size={12} />}
          collapsed={collapsed.favorites}
          onToggle={() => toggleSection('favorites')}
        >
          {favoriteItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={iconMap[item.icon]}
              label={item.label}
              onClick={() => handleNavigate(initialDirs[item.key])}
            />
          ))}
          {userFavorites.length > 0 && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px' }} />}
          {userFavorites.map((fav) => (
            <SidebarItem
              key={fav.path}
              icon={<Star size={13} style={{ color: 'var(--accent)' }} />}
              label={fav.name}
              onClick={() => handleNavigate(fav.path)}
            />
          ))}
        </SidebarSection>

        {/* Drives */}
        <SidebarSection
          label="Drives"
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
            />
          ))}
        </SidebarSection>

        {/* Recent */}
        <SidebarSection
          label="Recent"
          icon={<History size={12} />}
          collapsed={collapsed.recent}
          onToggle={() => toggleSection('recent')}
        >
          {recentFiles.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              No recent items
            </div>
          ) : (
            <div>
              {recentFiles.slice(0, recentLimit).map((file) => (
                <SidebarItem
                  key={file.path}
                  icon={<Folder size={13} style={{ color: 'var(--accent)' }} />}
                  label={file.name}
                  onClick={() => handleNavigate(file.path)}
                />
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Tags */}
        <SidebarSection
          label="Tags"
          icon={<Tag size={12} />}
          collapsed={collapsed.tags}
          onToggle={() => toggleSection('tags')}
        >
          {allTags.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              No tags yet
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
                  Clear filter
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
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 8px',
          color: 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          background: 'transparent',
          textAlign: 'left',
          borderRadius: 'var(--radius-sm)',
          transition: 'all 150ms ease',
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
      {!collapsed && (
        <div style={{ animation: 'fade-in 150ms ease' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '5px 8px 5px 24px',
        color: 'var(--text-secondary)',
        fontSize: 12.5,
        background: 'transparent',
        textAlign: 'left',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 100ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}
