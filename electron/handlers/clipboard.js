let clipboardState = { items: [], operation: null }

function register(ipcMain, deps) {
  const { clipboard } = deps

  ipcMain.handle('set-clipboard', (_event, items, operation) => {
    clipboardState = { items, operation }
    return true
  })

  ipcMain.handle('get-clipboard', () => clipboardState)

  ipcMain.handle('read-clipboard-text', () => {
    return clipboard.readText() || ''
  })
}

module.exports = { register }
