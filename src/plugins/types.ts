import type { ReactNode, ReactElement } from 'react'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  permissions?: string[]
}

export interface SidebarPanel {
  pluginId: string
  id: string
  label: string
  icon: ReactElement
  component: React.ComponentType<any>
  position?: number
}

export interface ToolbarButton {
  pluginId: string
  id: string
  icon: ReactElement
  label: string
  onClick: () => void
  position?: number
}

export interface StatusBarEntry {
  pluginId: string
  id: string
  component: React.ComponentType<any>
  position?: number
}

export interface ContextMenuItem {
  pluginId: string
  id: string
  label: string
  icon?: ReactElement
  onClick: () => void
  dividerAfter?: boolean
  condition?: () => boolean
  position?: number
}

export interface PaletteCommand {
  pluginId: string
  id: string
  label: string
  category?: string
  shortcut?: string
  action: () => void
  position?: number
}

export interface ShortcutBinding {
  pluginId: string
  id: string
  keys: string
  action: () => void
  priority?: number
}

export interface SettingsTab {
  pluginId: string
  id: string
  label: string
  icon: ReactElement
  component: React.ComponentType<any>
  position?: number
}

export interface PreviewHandler {
  pluginId: string
  id: string
  extensions: string[]
  component: React.ComponentType<{ file: any; onClose: () => void }>
  position?: number
}

// ─── New Extension Point Types ───────────────────────────────────────────────

export interface ViewDefinition {
  pluginId: string
  id: string
  name: string
  icon?: ReactElement | string
  component: React.ComponentType<any>
  position?: number
}

export interface TabTypeDefinition {
  pluginId: string
  id: string
  name: string
  icon?: ReactElement | string
  component: React.ComponentType<{ tabId: string; tab: any }>
  canHandle?: (filePath: string) => boolean
  position?: number
}

export interface TreeDataProvider {
  pluginId: string
  id: string
  label: string
  icon?: ReactElement | string
  getChildren(parentId?: string): TreeNode[]
  refresh?(): void
}

export interface TreeNode {
  id: string
  label: string
  icon?: ReactElement | string
  children?: TreeNode[]
  onClick?: () => void
  contextValue?: string
  badge?: string
  color?: string
}

export interface FileDecoration {
  color?: string
  badge?: string
  tooltip?: string
  strikethrough?: boolean
  fontStyle?: 'normal' | 'italic' | 'oblique'
  fontWeight?: 'normal' | 'bold' | 'lighter'
}

export interface FileDecorationProvider {
  pluginId: string
  id: string
  getDecoration(filePath: string, item: any): FileDecoration | null
}

export interface ThemeDefinition {
  pluginId: string
  id: string
  name: string
  colors: Record<string, string>
  isDark?: boolean
}

export interface TopBarItem {
  pluginId: string
  id: string
  icon?: ReactElement | string
  label: string
  onClick: () => void
  position?: number
}

export interface BackgroundContextMenuItem {
  pluginId: string
  id: string
  label: string
  icon?: ReactElement
  onClick: () => void
  dividerAfter?: boolean
  condition?: () => boolean
  position?: number
}

export interface NavigationEvent {
  path: string
  tabId: string
  previousPath?: string
}

export interface FileOperationEvent {
  type: 'create' | 'delete' | 'rename' | 'copy' | 'move'
  source: string
  destination?: string
  timestamp: number
}

export interface TabChangeEvent {
  tabId: string
  previousTabId?: string
}

export interface SettingsChangeEvent {
  key: string
  value: any
}

// ─── Plugin API ──────────────────────────────────────────────────────────────

export interface PluginApi {
  pluginId: string
  store: {
    getState: () => any
    setState: (partial: any) => void
    subscribe(listener: (state: any, prevState: any) => void): () => void
  }
  ui: {
    registerSidebarPanel(panel: Omit<SidebarPanel, 'pluginId'>): void
    registerToolbarButton(btn: Omit<ToolbarButton, 'pluginId'>): void
    registerStatusBarEntry(entry: Omit<StatusBarEntry, 'pluginId'>): void
    registerContextMenuItem(item: Omit<ContextMenuItem, 'pluginId'>): void
    registerBackgroundContextMenuItem(item: Omit<BackgroundContextMenuItem, 'pluginId'>): void
    registerSettingsTab(tab: Omit<SettingsTab, 'pluginId'>): void
    registerPreviewHandler(handler: Omit<PreviewHandler, 'pluginId'>): void
    registerView(view: Omit<ViewDefinition, 'pluginId'>): void
    registerTabType(tabType: Omit<TabTypeDefinition, 'pluginId'>): void
    registerTreeDataProvider(provider: Omit<TreeDataProvider, 'pluginId'>): void
    registerFileDecorationProvider(provider: Omit<FileDecorationProvider, 'pluginId'>): void
    registerTheme(theme: Omit<ThemeDefinition, 'pluginId'>): void
    registerTopBarItem(item: Omit<TopBarItem, 'pluginId'>): void
    getViews(): ViewDefinition[]
    getTabTypes(): TabTypeDefinition[]
    getTreeDataProviders(): TreeDataProvider[]
    getFileDecorationProviders(): FileDecorationProvider[]
    getThemes(): ThemeDefinition[]
    getTopBarItems(): TopBarItem[]
    getBackgroundContextMenuItems(): BackgroundContextMenuItem[]
  }
  events: {
    onDidNavigate(callback: (event: NavigationEvent) => void): () => void
    onDidFileOperation(callback: (event: FileOperationEvent) => void): () => void
    onDidTabChange(callback: (event: TabChangeEvent) => void): () => void
    onDidSettingsChange(callback: (event: SettingsChangeEvent) => void): () => void
    onAppReady(callback: () => void): () => void
    on(event: string, callback: (...args: any[]) => void): () => void
    emit(event: string, ...args: any[]): void
  }
  hooks: {
    registerBeforeHook(hookId: string, callback: (...args: any[]) => any): void
    registerAfterHook(hookId: string, callback: (...args: any[]) => void): void
  }
  commands: {
    register(cmd: Omit<PaletteCommand, 'pluginId'>): void
  }
  shortcuts: {
    register(binding: Omit<ShortcutBinding, 'pluginId'>): void
  }
  ipc: {
    invoke(channel: string, ...args: any[]): Promise<any>
    on(channel: string, callback: (...args: any[]) => void): void
    send(channel: string, ...args: any[]): void
  }
  fs: {
    readDir(dirPath: string): Promise<any[]>
    readFile(filePath: string): Promise<string>
    writeFile(filePath: string, content: string): Promise<void>
    stat(filePath: string): Promise<any>
  }
  log: {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
  }
}
