/// <reference types="vite/client" />

interface ElectronAPI {
  refreshDir: (dirPath: string) => Promise<Array<{
    name: string
    path: string
    isDirectory: boolean
    size: number
    modifiedAt: string
    extension: string
    color?: string
    tags?: string[]
  }> | null>
  readDir: (dirPath: string) => Promise<Array<{
    name: string
    path: string
    isDirectory: boolean
    size: number
    modifiedAt: string
    extension: string
    color?: string
    tags?: string[]
  }> | null>
  openPath: (filePath: string) => Promise<boolean>
  readImageThumbnail: (filePath: string) => Promise<string | null>
  searchBuildIndex: (roots?: string[]) => Promise<{ total: number }>
  searchQuery: (query: string) => Promise<Array<{
    name: string; path: string; isDirectory: boolean; size: number;
    modifiedAt: string; extension: string; _score: number;
  }>>
  searchStatus: () => Promise<{ built: boolean; building: boolean; total: number; roots: string[] }>
  onIndexProgress: (callback: (count: number) => void) => void
  loadWorkspace: () => Promise<Array<{
    id: string; title: string; path: string; pinned: boolean; viewMode: string;
    history: string[]; historyIndex: number; dualPane: boolean; dualPaneTabId?: string;
  }> | null>
  saveWorkspace: (tabs: any) => Promise<boolean>
  onSaveWorkspaceRequest: (callback: () => void) => void
  readImageThumbnailsBatch: (filePaths: string[]) => Promise<Record<string, string>>
  readImagePreview: (filePath: string) => Promise<string | null>
  readFileText: (filePath: string) => Promise<{ content?: string; size?: number; error?: string }>
  getFileStat: (filePath: string) => Promise<{
    size?: number; modifiedAt?: string; createdAt?: string;
    isDirectory?: boolean; isFile?: boolean; error?: string;
  }>
  setClipboard: (items: string[], operation: 'copy' | 'cut') => Promise<boolean>
  getClipboard: () => Promise<{ items: string[]; operation: 'copy' | 'cut' | null }>
  fileCopy: (src: string, dest: string) => Promise<boolean>
  fileDelete: (path: string) => Promise<boolean>
  fileRename: (oldPath: string, newPath: string) => Promise<boolean>
  getItemMeta: (dirPath: string, itemName: string) => Promise<{ color?: string; tags?: string[] }>
  setItemMeta: (dirPath: string, itemName: string, updates: { color?: string; tags?: string[] }) => Promise<boolean>
  getHomeDir: () => Promise<string>
  getDocumentsDir: () => Promise<string>
  getDesktopDir: () => Promise<string>
  getDownloadsDir: () => Promise<string>
  getPicturesDir: () => Promise<string>
  getMusicDir: () => Promise<string>
  getVideosDir: () => Promise<string>
  getDrivesWindows: () => Promise<string[]>
  getInitialDirs: () => Promise<Record<string, string>>
  getOpenWith: (filePath: string) => Promise<Array<{ name: string; command: string }>>
  openWithDialog: (filePath: string) => Promise<boolean>
  compressFiles: (filePaths: string[], outputPath: string) => Promise<boolean>
  terminalExec: (cwd: string, command: string) => Promise<{ stdout: string; stderr: string; error: string | null }>
  setWindowOpacity: (opacity: number) => Promise<boolean>
  setWindowBg: (hex: string) => Promise<boolean>
  transferStart: (opts: { id: string; src: string; dest: string; operation: 'copy' | 'move' }) => Promise<boolean>
  transferPause: (id: string) => Promise<boolean>
  transferResume: (id: string) => Promise<boolean>
  transferCancel: (id: string) => Promise<boolean>
  transferRetry: (id: string) => Promise<boolean>
  onTransferProgress: (callback: (data: any) => void) => void
}

interface Window {
  electronAPI?: ElectronAPI
}
