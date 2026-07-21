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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Tag,
  X,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star size={15} />,
  HardDrive: <HardDrive size={15} />,
  History: <History size={15} />,
  Download: <Download size={15} />,
  Monitor: <Monitor size={15} />,
  FileText: <FileText size={15} />,
  Image: <Image size={15} />,
  Video: <Video size={15} />,
  Music: <Music size={15} />,
  Trash2: <Trash2 size={15} />,
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

  const favorites = useStore((s) => s.favorites)
  const userFavorites = favorites.map((f) => ({ name: f.name, path: f.path }))

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
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: 'var(--text-secondary)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          Explorer
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            color: 'var(--text-muted)',
            padding: 2,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {/* Favorites */}
        <SidebarSection
          label="Favorites"
          icon={<Star size={13} />}
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
          icon={<HardDrive size={13} />}
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
          icon={<History size={13} />}
          collapsed={collapsed.recent}
          onToggle={() => toggleSection('recent')}
        >
          {recentFiles.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              No recent folders
            </div>
          ) : (
            <div>
              {recentFiles.slice(0, recentLimit).map((file) => (
                <SidebarItem
                  key={file.path}
                  icon={<Folder size={13} style={{ color: 'var(--text-muted)' }} />}
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
          icon={<Tag size={13} />}
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
                    gap: 6,
                    width: '100%',
                    padding: '4px 12px 4px 24px',
                    color: 'var(--accent)',
                    fontSize: 12,
                    background: 'transparent',
                  }}
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
                    gap: 6,
                    width: '100%',
                    padding: '4px 12px 4px 24px',
                    color: activeTagFilter === tag ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    background: activeTagFilter === tag ? 'var(--accent-bg)' : 'transparent',
                    fontWeight: activeTagFilter === tag ? 600 : 400,
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
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '5px 12px',
          color: 'var(--text-secondary)',
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          background: 'transparent',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <ChevronRight
          size={11}
          style={{
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            transition: 'transform 150ms ease',
          }}
        />
        {icon}
        {label}
      </button>
      {!collapsed && children}
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
        padding: '4px 12px 4px 24px',
        color: 'var(--text-secondary)',
        fontSize: 13,
        background: 'transparent',
        textAlign: 'left',
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
