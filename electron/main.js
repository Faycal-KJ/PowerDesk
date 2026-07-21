const { app, BrowserWindow, ipcMain, shell, Menu, clipboard, globalShortcut, screen } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

function getMainWindow() {
  return mainWindow
}

let windowState = {}

function createWindow() {
  const systemHandler = require('./handlers/system')
  const saved = systemHandler.loadWorkspace(app)
  const windowConfig = saved?.window || {}
  windowState = {
    width: Math.max(windowConfig.width || 1400, 800),
    height: Math.max(windowConfig.height || 900, 500),
    x: windowConfig.x,
    y: windowConfig.y,
    maximized: windowConfig.maximized || false,
  }

  const displays = screen.getAllDisplays()
  const isVisible = displays.some(d => {
    const b = d.workArea
    return windowState.x !== undefined && windowState.y !== undefined &&
           windowState.x < b.x + b.width && windowState.x + windowState.width > b.x &&
           windowState.y < b.y + b.height && windowState.y + windowState.height > b.y
  })
  if (!isVisible) {
    windowState.x = undefined
    windowState.y = undefined
    windowState.maximized = false
  }

  const iconPath = path.join(__dirname, '../assets/Logo1.png')
  const packedIconPath = path.join(process.resourcesPath || '', 'assets', 'Logo1.png')

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0f0f0f',
    show: false,
    icon: fs.existsSync(iconPath) ? iconPath : (fs.existsSync(packedIconPath) ? packedIconPath : undefined),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (windowState.maximized) {
    mainWindow.maximize()
  }

  const showWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }

  mainWindow.once('ready-to-show', showWindow)
  mainWindow.on('did-fail-load', () => showWindow())
  setTimeout(showWindow, 3000)

  const distPath = path.join(__dirname, '../dist/index.html')
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath)
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  let isSnapping = false
  let snapCooldown = 0
  let lastX = 0, lastY = 0
  let dragging = false
  try { [lastX, lastY] = mainWindow.getPosition() } catch {}

  mainWindow.on('resize', () => {
    try {
      if (!mainWindow.isMaximized() && !isSnapping) {
        windowState = { width: mainWindow.getWidth(), height: mainWindow.getHeight(), x: mainWindow.getX(), y: mainWindow.getY(), maximized: false }
      }
    } catch {}
  })

  const snapPoll = setInterval(() => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return
      const [wx, wy] = mainWindow.getPosition()

      if (wx !== lastX || wy !== lastY) {
        if (Date.now() >= snapCooldown) dragging = true
        lastX = wx
        lastY = wy
        if (dragging) return
      }

      if (!dragging) return
      if (Date.now() < snapCooldown) { dragging = false; return }

      dragging = false
      const [ww] = mainWindow.getSize()
      const display = screen.getDisplayMatching({ x: wx, y: wy, width: ww, height: mainWindow.getHeight() })
      const bounds = display.workArea
      const EDGE = 8

      if (mainWindow.isMaximized()) {
        if (wy > bounds.y + EDGE) {
          isSnapping = true
          snapCooldown = Date.now() + 300
          mainWindow.unmaximize()
          isSnapping = false
        }
        return
      }

      if (wy <= bounds.y + EDGE) {
        isSnapping = true
        snapCooldown = Date.now() + 300
        mainWindow.maximize()
        isSnapping = false
        return
      }

      if (wx <= bounds.x + EDGE) {
        isSnapping = true
        snapCooldown = Date.now() + 300
        const halfW = Math.round(bounds.width / 2)
        mainWindow.setBounds({ x: bounds.x, y: bounds.y, width: halfW, height: bounds.height })
        isSnapping = false
        return
      }

      if (wx + ww >= bounds.x + bounds.width - EDGE) {
        isSnapping = true
        snapCooldown = Date.now() + 300
        const halfW = Math.round(bounds.width / 2)
        mainWindow.setBounds({ x: bounds.x + halfW, y: bounds.y, width: halfW, height: bounds.height })
        isSnapping = false
        return
      }
    } catch {} }, 150)

  mainWindow.on('closed', () => clearInterval(snapPoll))
  mainWindow.on('maximize', () => { windowState.maximized = true; try { mainWindow.webContents.send('window-maximize-change', true) } catch {} })
  mainWindow.on('unmaximize', () => { windowState.maximized = false; try { mainWindow.webContents.send('window-maximize-change', false) } catch {} })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  const systemHandler = require('./handlers/system')
  const fileOpsHandler = require('./handlers/fileOps')
  const thumbnailsHandler = require('./handlers/thumbnails')
  const searchHandler = require('./handlers/search')
  const transferHandler = require('./handlers/transfer')
  const clipboardHandler = require('./handlers/clipboard')
  const windowControlsHandler = require('./handlers/windowControls')

  const deps = {
    getMainWindow,
    app,
    BrowserWindow,
    clipboard,
    shell,
  }

  fileOpsHandler.register(ipcMain, { ...deps, addRecentFile: (fp) => systemHandler.addRecentFile(app, fp) })
  thumbnailsHandler.register(ipcMain, deps)
  searchHandler.register(ipcMain, deps)
  transferHandler.register(ipcMain, deps)
  clipboardHandler.register(ipcMain, deps)
  systemHandler.register(ipcMain, deps)
  windowControlsHandler.register(ipcMain, deps)

  globalShortcut.register('CommandOrControl+N', () => {
    createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  const systemHandler = require('./handlers/system')
  const workspace = systemHandler.loadWorkspace(app) || {}
  workspace.window = windowState
  if (mainWindow) {
    try {
      mainWindow.webContents.send('save-workspace-request')
    } catch {}
  }
  setTimeout(() => systemHandler.saveWorkspace(app, workspace), 100)
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
