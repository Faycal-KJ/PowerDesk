export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: string
  extension: string
  color?: string
  tags?: string[]
}

export type UndoEntryType = 'delete' | 'rename' | 'move' | 'copy' | 'replace' | 'tag' | 'color' | 'compress' | 'create-folder' | 'create-file'

export interface UndoEntry {
  id: string
  type: UndoEntryType
  description: string
  timestamp: number
  data: Record<string, any>
}

export interface Tab {
  id: string
  title: string
  path: string
  pinned: boolean
  viewMode: ViewMode
  history: string[]
  historyIndex: number
  dualPane: boolean
  dualPaneTabId?: string
}

export type ViewMode = 'grid' | 'list' | 'gallery'

export interface SearchFilters {
  minSize: number | null
  maxSize: number | null
  minDate: string | null
  maxDate: string | null
  extension: string | null
  type: 'all' | 'files' | 'folders'
  author: string | null
  tags: string | null
  color: string | null
}

export interface WorkspaceProfile {
  id: string
  name: string
  createdAt: number
  tabs: Tab[]
  sidebarOpen: boolean
  sidebarWidth: number
  ui: {
    accentColor: string
    bgPrimary: string
    bgSecondary: string
    bgTertiary: string
    textColor: string
    textSecondary: string
    sidebarBg: string
    fontSize: number
    fontFamily: string
    radius: 'sharp' | 'round' | 'pill'
    opacity: number
    blurBackground: boolean
    animations: boolean
    borderStyle: 'solid' | 'none'
    borderColor: string
    successColor: string
    warningColor: string
    dangerColor: string
    fontWeight: number
    glassPanels: boolean
    subtleGradients: boolean
    hoverGlow: boolean
  }
  settings: {
    defaultView: 'grid' | 'list' | 'gallery'
    showHidden: boolean
    sidebarDefault: boolean
    confirmDelete: boolean
    startupPath: string
  }
}

export interface ClipboardEntry {
  id: string
  type: 'file' | 'text' | 'code'
  content: string
  filePaths?: string[]
  fileNames?: string[]
  timestamp: number
  favorite: boolean
}

export interface SidebarSection {
  id: string
  label: string
  icon: string
  path?: string
  children?: SidebarSection[]
}

export interface Transfer {
  id: string
  name: string
  src: string
  dest: string
  operation: 'copy' | 'move'
  type: 'file' | 'directory'
  status: 'running' | 'paused' | 'completed' | 'cancelled'
  totalFiles: number
  completedFiles: number
  totalBytes: number
  transferredBytes: number
  speed: number
  error: string | null
  errors: { file: string; error: string }[]
  startTime: number
}

export type CommandHistoryType = UndoEntryType | 'copy' | 'cut'

export interface CommandHistoryEntry {
  id: string
  type: CommandHistoryType
  description: string
  timestamp: number
  filePaths: string[]
  favorite: boolean
  data: Record<string, any>
}

export interface FavoriteCommand {
  id: string
  label: string
  type: 'compress' | 'share' | 'rename' | 'compare' | 'analyze' | 'open-terminal' | 'open-vscode' | 'custom'
  icon: string
  shortcut?: string
  targetPath?: string
}

export interface FavoriteItem {
  path: string
  type: 'folder' | 'file'
  name: string
  addedAt: number
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  createdAt: number
}


