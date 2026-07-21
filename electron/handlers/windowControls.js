function register(ipcMain, deps) {
  const { getMainWindow, BrowserWindow } = deps

  ipcMain.on('window-minimize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) mainWindow.close()
  })

  ipcMain.handle('window-is-maximized', () => {
    const mainWindow = getMainWindow()
    return mainWindow ? mainWindow.isMaximized() : false
  })

  ipcMain.handle('set-window-opacity', (_event, opacity) => {
    const mainWindow = getMainWindow()
    if (mainWindow) mainWindow.setOpacity(opacity)
    return true
  })

  ipcMain.handle('set-window-bg', (_event, hex) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.setBackgroundColor(hex || '#00000000')
    }
    return true
  })

  ipcMain.on('sync-broadcast', (event, channel, data) => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const win of allWindows) {
      if (win.webContents.id !== event.sender.id && !win.isDestroyed()) {
        win.webContents.send('sync-message', channel, data)
      }
    }
  })
}

module.exports = { register }
