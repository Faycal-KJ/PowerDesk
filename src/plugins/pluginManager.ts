import type {
  SidebarPanel, ToolbarButton, StatusBarEntry, ContextMenuItem,
  PaletteCommand, ShortcutBinding, SettingsTab, PreviewHandler, PluginManifest,
  ViewDefinition, TabTypeDefinition, TreeDataProvider, FileDecorationProvider,
  ThemeDefinition, TopBarItem, BackgroundContextMenuItem,
} from './types'

class PluginManager {
  private plugins = new Map<string, { manifest: PluginManifest; enabled: boolean }>()
  private sidebarPanels: SidebarPanel[] = []
  private toolbarButtons: ToolbarButton[] = []
  private statusBarEntries: StatusBarEntry[] = []
  private contextMenuItems: ContextMenuItem[] = []
  private backgroundContextMenuItems: BackgroundContextMenuItem[] = []
  private commands: PaletteCommand[] = []
  private shortcuts: ShortcutBinding[] = []
  private settingsTabs: SettingsTab[] = []
  private previewHandlers: PreviewHandler[] = []
  private views: ViewDefinition[] = []
  private tabTypes: TabTypeDefinition[] = []
  private treeDataProviders: TreeDataProvider[] = []
  private fileDecorationProviders: FileDecorationProvider[] = []
  private themes: ThemeDefinition[] = []
  private topBarItems: TopBarItem[] = []
  private listeners: Array<() => void> = []

  // ─── Event Emitter ──────────────────────────────────────────────────────────
  private eventListeners = new Map<string, Set<Function>>()

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set())
    this.eventListeners.get(event)!.add(callback)
    return () => { this.eventListeners.get(event)?.delete(callback) }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      for (const cb of listeners) {
        try { cb(...args) } catch (e) { console.error(`[PluginManager] Event "${event}" handler error:`, e) }
      }
    }
    // Also fire wildcard listeners
    const wildcard = this.eventListeners.get('*')
    if (wildcard) {
      for (const cb of wildcard) {
        try { cb(event, ...args) } catch (e) { console.error(`[PluginManager] Wildcard handler error:`, e) }
      }
    }
  }

  // ─── Hook System ────────────────────────────────────────────────────────────
  private beforeHooks = new Map<string, Array<Function>>()
  private afterHooks = new Map<string, Array<Function>>()

  registerBeforeHook(hookId: string, callback: Function) {
    if (!this.beforeHooks.has(hookId)) this.beforeHooks.set(hookId, [])
    this.beforeHooks.get(hookId)!.push(callback)
  }

  registerAfterHook(hookId: string, callback: Function) {
    if (!this.afterHooks.has(hookId)) this.afterHooks.set(hookId, [])
    this.afterHooks.get(hookId)!.push(callback)
  }

  async executeBeforeHooks(hookId: string, ...args: any[]): Promise<{ cancelled: boolean; result?: any }> {
    const hooks = this.beforeHooks.get(hookId) || []
    for (const hook of hooks) {
      try {
        const result = await hook(...args)
        if (result === false) return { cancelled: true }
      } catch (e) {
        console.error(`[PluginManager] Before hook "${hookId}" error:`, e)
      }
    }
    return { cancelled: false }
  }

  executeAfterHooks(hookId: string, ...args: any[]) {
    const hooks = this.afterHooks.get(hookId) || []
    for (const hook of hooks) {
      try { hook(...args) } catch (e) { console.error(`[PluginManager] After hook "${hookId}" error:`, e) }
    }
  }

  // ─── Plugin Registration ────────────────────────────────────────────────────

  registerPlugin(manifest: PluginManifest) {
    this.plugins.set(manifest.id, { manifest, enabled: true })
    this.notify()
  }

  unregisterPlugin(pluginId: string) {
    this.plugins.delete(pluginId)
    this.sidebarPanels = this.sidebarPanels.filter((p) => p.pluginId !== pluginId)
    this.toolbarButtons = this.toolbarButtons.filter((b) => b.pluginId !== pluginId)
    this.statusBarEntries = this.statusBarEntries.filter((e) => e.pluginId !== pluginId)
    this.contextMenuItems = this.contextMenuItems.filter((i) => i.pluginId !== pluginId)
    this.backgroundContextMenuItems = this.backgroundContextMenuItems.filter((i) => i.pluginId !== pluginId)
    this.commands = this.commands.filter((c) => c.pluginId !== pluginId)
    this.shortcuts = this.shortcuts.filter((s) => s.pluginId !== pluginId)
    this.settingsTabs = this.settingsTabs.filter((t) => t.pluginId !== pluginId)
    this.previewHandlers = this.previewHandlers.filter((h) => h.pluginId !== pluginId)
    this.views = this.views.filter((v) => v.pluginId !== pluginId)
    this.tabTypes = this.tabTypes.filter((t) => t.pluginId !== pluginId)
    this.treeDataProviders = this.treeDataProviders.filter((p) => p.pluginId !== pluginId)
    this.fileDecorationProviders = this.fileDecorationProviders.filter((p) => p.pluginId !== pluginId)
    this.themes = this.themes.filter((t) => t.pluginId !== pluginId)
    this.topBarItems = this.topBarItems.filter((i) => i.pluginId !== pluginId)
    this.notify()
  }

  isPluginEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false
  }

  togglePlugin(pluginId: string) {
    const p = this.plugins.get(pluginId)
    if (p) { p.enabled = !p.enabled; this.notify() }
  }

  getRegisteredPlugins(): Array<{ manifest: PluginManifest; enabled: boolean }> {
    return Array.from(this.plugins.values())
  }

  // ─── Existing Extension Points ──────────────────────────────────────────────

  addSidebarPanel(panel: SidebarPanel) { this.sidebarPanels.push(panel); this.notify() }
  addToolbarButton(btn: ToolbarButton) { this.toolbarButtons.push(btn); this.notify() }
  addStatusBarEntry(entry: StatusBarEntry) { this.statusBarEntries.push(entry); this.notify() }
  addContextMenuItem(item: ContextMenuItem) { this.contextMenuItems.push(item); this.notify() }
  addCommand(cmd: PaletteCommand) { this.commands.push(cmd); this.notify() }
  addShortcut(binding: ShortcutBinding) { this.shortcuts.push(binding) }
  addSettingsTab(tab: SettingsTab) { this.settingsTabs.push(tab); this.notify() }
  addPreviewHandler(handler: PreviewHandler) { this.previewHandlers.push(handler) }

  // ─── New Extension Points ───────────────────────────────────────────────────

  addView(view: ViewDefinition) { this.views.push(view); this.notify() }
  addTabType(tabType: TabTypeDefinition) { this.tabTypes.push(tabType); this.notify() }
  addTreeDataProvider(provider: TreeDataProvider) { this.treeDataProviders.push(provider); this.notify() }
  addFileDecorationProvider(provider: FileDecorationProvider) { this.fileDecorationProviders.push(provider) }
  addTheme(theme: ThemeDefinition) { this.themes.push(theme); this.notify() }
  addTopBarItem(item: TopBarItem) { this.topBarItems.push(item); this.notify() }
  addBackgroundContextMenuItem(item: BackgroundContextMenuItem) { this.backgroundContextMenuItems.push(item); this.notify() }

  // ─── Getters (filtered by enabled) ─────────────────────────────────────────

  getSidebarPanels(): SidebarPanel[] {
    return this.sortByPosition(this.sidebarPanels.filter((p) => this.isPluginEnabled(p.pluginId)))
  }
  getToolbarButtons(): ToolbarButton[] {
    return this.sortByPosition(this.toolbarButtons.filter((b) => this.isPluginEnabled(b.pluginId)))
  }
  getStatusBarEntries(): StatusBarEntry[] {
    return this.sortByPosition(this.statusBarEntries.filter((e) => this.isPluginEnabled(e.pluginId)))
  }
  getContextMenuItems(): ContextMenuItem[] {
    return this.sortByPosition(this.contextMenuItems.filter((i) => {
      if (!this.isPluginEnabled(i.pluginId)) return false
      if (i.condition && !i.condition()) return false
      return true
    }))
  }
  getBackgroundContextMenuItems(): BackgroundContextMenuItem[] {
    return this.sortByPosition(this.backgroundContextMenuItems.filter((i) => {
      if (!this.isPluginEnabled(i.pluginId)) return false
      if (i.condition && !i.condition()) return false
      return true
    }))
  }
  getCommands(): PaletteCommand[] {
    return this.sortByPosition(this.commands.filter((c) => this.isPluginEnabled(c.pluginId)))
  }
  getShortcuts(): ShortcutBinding[] {
    return this.shortcuts.filter((s) => this.isPluginEnabled(s.pluginId))
  }
  getSettingsTabs(): SettingsTab[] {
    return this.sortByPosition(this.settingsTabs.filter((t) => this.isPluginEnabled(t.pluginId)))
  }
  getPreviewHandlerForExt(ext: string): PreviewHandler | undefined {
    return this.sortByPosition(this.previewHandlers.filter((h) => this.isPluginEnabled(h.pluginId)))
      .find((h) => h.extensions.includes(ext))
  }
  getViews(): ViewDefinition[] {
    return this.sortByPosition(this.views.filter((v) => this.isPluginEnabled(v.pluginId)))
  }
  getTabTypes(): TabTypeDefinition[] {
    return this.sortByPosition(this.tabTypes.filter((t) => this.isPluginEnabled(t.pluginId)))
  }
  getTreeDataProviders(): TreeDataProvider[] {
    return this.treeDataProviders.filter((p) => this.isPluginEnabled(p.pluginId))
  }
  getFileDecorationProviders(): FileDecorationProvider[] {
    return this.fileDecorationProviders.filter((p) => this.isPluginEnabled(p.pluginId))
  }
  getThemes(): ThemeDefinition[] {
    return this.themes.filter((t) => this.isPluginEnabled(t.pluginId))
  }
  getTopBarItems(): TopBarItem[] {
    return this.sortByPosition(this.topBarItems.filter((i) => this.isPluginEnabled(i.pluginId)))
  }

  private sortByPosition<T extends { position?: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => (a.position ?? 50) - (b.position ?? 50))
  }

  onChange(listener: () => void) {
    this.listeners.push(listener)
    return () => { this.listeners = this.listeners.filter((l) => l !== listener) }
  }

  private notify() {
    for (const l of this.listeners) l()
  }
}

export const pluginManager = new PluginManager()
