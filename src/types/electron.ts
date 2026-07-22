import type { FileItem, Transfer } from './index'

export interface FileStat {
  size: number
  modifiedAt: string
  createdAt: string
  isDirectory: boolean
  isFile: boolean
}

export interface FileInspectResult {
  name: string
  path: string
  size: number
  created: number
  modified: number
  accessed: number
  ext: string
  isDirectory: boolean
  image: null | {
    format: string
    width: number
    height: number
    density: number | null
    hasAlpha: boolean
    channels: number
    space: string
    depth: number
    codec: string | null
    isProgressive: boolean
    pages: number | null
    exif: null | {
      make?: string
      model?: string
      iso?: number
      focalLength?: string
      aperture?: string
      exposureTime?: string
      dateTimeOriginal?: string
      software?: string
      [key: string]: any
    }
    dominant: null | { r: number; g: number; b: number }
    isOpaque: boolean
    entropy: number
  }
  video: null
  audio: null
}

export interface FolderAnalysis {
  totalSize: number
  totalFiles: number
  totalDirs: number
  extBreakdown: Array<{ ext: string; count: number; size: number }>
  largestFiles: Array<{ name: string; path: string; dir: string; size: number; modified: string; ext: string }>
  largestFolders: Array<{ path: string; name: string; size: number }>
  duplicates: Array<Array<{ name: string; path: string; dir: string; size: number; modified: string; ext: string }>>
  emptyFolders: string[]
  oldFilesCount: number
  recentFiles: Array<{ name: string; path: string; dir: string; size: number; modified: string; ext: string }>
  sizeBuckets: Record<string, number>
  avgFileSize: number
}

export interface SearchResult {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: string
  extension: string
  _score: number
}

export interface TerminalResult {
  stdout: string
  stderr: string
  error: string | null
}

export interface ItemMeta {
  color?: string
  tags?: string[]
  [key: string]: any
}

export interface InitialDirs {
  home: string
  documents: string
  desktop: string
  downloads: string
  pictures: string
  music: string
  videos: string
}

export interface RecentFile {
  path: string
  name: string
  accessedAt: string
}

export interface ElectronAPI {
  // Search / Index
  searchBuildIndex: (roots: string[]) => Promise<void>
  searchQuery: (q: string) => Promise<SearchResult[]>
  searchStatus: () => Promise<any>
  onIndexProgress: (callback: (progress: any) => void) => void

  // Workspace
  loadWorkspace: () => Promise<any>
  saveWorkspace: (tabs: any[]) => Promise<void>
  onSaveWorkspaceRequest: (callback: () => void) => void

  // Directory reading
  readDir: (dirPath: string) => Promise<FileItem[]>
  refreshDir: (dirPath: string) => Promise<FileItem[]>
  openPath: (filePath: string) => Promise<void>

  // Thumbnails / Previews
  readImageThumbnail: (filePath: string) => Promise<string | null>
  readImageThumbnailsBatch: (filePaths: string[]) => Promise<Record<string, string>>
  readImagePreview: (filePath: string) => Promise<string | null>
  readFileText: (filePath: string) => Promise<{ content: string; size: number } | { error: string }>
  getFileStat: (filePath: string) => Promise<FileStat>

  // Clipboard
  setClipboard: (items: string[], operation: 'copy' | 'cut') => Promise<void>
  getClipboard: () => Promise<{ items: string[]; operation: 'copy' | 'cut' }>
  readClipboardText: () => Promise<string>

  // File operations
  fileCopy: (src: string, dest: string) => Promise<void>
  fileDelete: (path: string) => Promise<void>
  trashFile: (filePath: string) => Promise<{ success: boolean; trashPath: string }>
  restoreFromTrash: (trashPath: string, originalPath: string) => Promise<{ success: boolean }>
  fileRename: (oldPath: string, newPath: string) => Promise<void>
  createFolder: (dirPath: string, name: string) => Promise<void>
  createFile: (dirPath: string, name: string) => Promise<void>

  // Folder sizes
  getFolderSize: (dirPath: string) => Promise<number>
  getFolderSizesBatch: (dirPaths: string[]) => Promise<Record<string, number>>

  // Metadata
  getItemMeta: (dirPath: string, itemName: string) => Promise<ItemMeta>
  setItemMeta: (dirPath: string, itemName: string, updates: Partial<ItemMeta>) => Promise<void>

  // System directories
  getHomeDir: () => Promise<string>
  getDocumentsDir: () => Promise<string>
  getDesktopDir: () => Promise<string>
  getDownloadsDir: () => Promise<string>
  getPicturesDir: () => Promise<string>
  getMusicDir: () => Promise<string>
  getVideosDir: () => Promise<string>
  getDrivesWindows: () => Promise<string[]>
  getInitialDirs: () => Promise<InitialDirs>

  // Recent files
  getRecentFiles: () => Promise<RecentFile[]>
  trackRecent: (filePath: string) => Promise<void>
  clearRecentFiles: () => Promise<void>

  // Compression
  compressFiles: (filePaths: string[], outputPath: string) => Promise<void>

  // File existence
  checkFilesExist: (paths: string[]) => Promise<Record<string, { exists: boolean }>>

  // Terminal
  terminalExec: (cwd: string, command: string) => Promise<TerminalResult>

  // Window controls
  setWindowOpacity: (opacity: number) => Promise<void>
  setWindowBg: (hex: string) => Promise<void>
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  onWindowMaximizeChange: (callback: (maximized: boolean) => void) => void

  // Transfer center
  transferStart: (opts: { id: string; src: string; dest: string; operation: 'copy' | 'move' }) => Promise<void>
  transferPause: (id: string) => Promise<void>
  transferResume: (id: string) => Promise<void>
  transferCancel: (id: string) => Promise<void>
  transferRetry: (id: string) => Promise<void>
  onTransferProgress: (callback: (data: Transfer) => void) => void

  // Analysis
  analyzeFolder: (dirPath: string) => Promise<FolderAnalysis>
  fileInspect: (filePath: string) => Promise<FileInspectResult>

  // Plugins
  getPluginsDir: () => Promise<string>
  getPluginGuidePath: () => Promise<string>

  // Multi Window Sync
  syncBroadcast: (channel: string, data: any) => void
  onSyncMessage: (callback: (channel: string, data: any) => void) => void
}
