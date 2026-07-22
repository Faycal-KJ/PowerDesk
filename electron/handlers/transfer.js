const path = require('path')
const fs = require('fs')

const transfers = new Map()

function getAllFiles(dirPath) {
  const files = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllFiles(full))
      } else {
        files.push(full)
      }
    }
  } catch {}
  return files
}

function getDirSize(dirPath) {
  let total = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += getDirSize(full)
      } else {
        try { total += fs.statSync(full).size } catch {}
      }
    }
  } catch {}
  return total
}

function sendTransferProgress(id, getMainWindow) {
  const t = transfers.get(id)
  const mainWindow = getMainWindow()
  if (!t || !mainWindow) return
  mainWindow.webContents.send('transfer-progress', {
    id: t.id,
    name: t.name,
    type: t.type,
    operation: t.operation,
    status: t.status,
    totalFiles: t.totalFiles,
    completedFiles: t.completedFiles,
    totalBytes: t.totalBytes,
    transferredBytes: t.transferredBytes,
    speed: t.speed,
    error: t.error,
    errors: t.errors,
    startTime: t.startTime,
    src: t.src,
    dest: t.dest,
  })
}

function copyFileSync(src, dest, fileSize, transfer) {
  const BLOCK = 64 * 1024
  const srcFd = fs.openSync(src, 'r')
  const destFd = fs.openSync(dest, 'w')
  const buf = Buffer.alloc(BLOCK)
  let offset = 0

  try {
    while (offset < fileSize) {
      if (transfer.status === 'cancelled') break
      while (transfer.status === 'paused') {
        const start = Date.now()
        while (transfer.status === 'paused' && transfer.status !== 'cancelled') {
          if (Date.now() - start > 100) break
        }
      }

      const bytesRead = fs.readSync(srcFd, buf, 0, BLOCK, offset)
      if (bytesRead === 0) break
      fs.writeSync(destFd, buf, 0, bytesRead, offset)
      offset += bytesRead
      transfer.transferredBytes += bytesRead
    }
  } finally {
    fs.closeSync(srcFd)
    fs.closeSync(destFd)
  }
}

function calcSpeed(t) {
  const elapsed = (Date.now() - t.startTime) / 1000
  if (elapsed <= 0) return 0
  return Math.round(t.transferredBytes / elapsed)
}

async function processTransfer(id, getMainWindow) {
  const t = transfers.get(id)
  if (!t) return

  for (let i = t.currentFileIdx; i < t.files.length; i++) {
    if (t.status === 'cancelled') return
    while (t.status === 'paused') {
      await new Promise((r) => setTimeout(r, 200))
      if (t.status === 'cancelled') return
    }

    t.currentFileIdx = i
    const srcFile = t.files[i]
    const rel = path.relative(t.src, srcFile)
    const destFile = path.join(t.dest, rel)

    try {
      const destDir = path.dirname(destFile)
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

      if (t.operation === 'move') {
        try {
          fs.renameSync(srcFile, destFile)
        } catch {
          const stat = fs.statSync(srcFile)
          copyFileSync(srcFile, destFile, stat.size, t)
          try { fs.unlinkSync(srcFile) } catch {}
        }
      } else {
        const stat = fs.statSync(srcFile)
        copyFileSync(srcFile, destFile, stat.size, t)
      }
      t.completedFiles++
      t.speed = calcSpeed(t)
    } catch (e) {
      t.errors.push({ file: srcFile, error: e.message })
    }
    sendTransferProgress(id, getMainWindow)
  }

  t.status = 'completed'
  t.speed = calcSpeed(t)
  sendTransferProgress(id, getMainWindow)
}

function register(ipcMain, deps) {
  const { getMainWindow } = deps

  ipcMain.handle('transfer-start', (_event, { id, src, dest, operation }) => {
    const isDir = fs.existsSync(src) && fs.statSync(src).isDirectory()
    const files = isDir ? getAllFiles(src) : [src]
    const totalBytes = files.reduce((acc, f) => {
      try { return acc + fs.statSync(f).size } catch { return acc }
    }, 0)

    const transfer = {
      id,
      name: path.basename(src),
      src,
      dest,
      operation,
      type: isDir ? 'directory' : 'file',
      status: 'running',
      totalFiles: files.length,
      completedFiles: 0,
      totalBytes,
      transferredBytes: 0,
      speed: 0,
      currentFileIdx: 0,
      files,
      errors: [],
      startTime: Date.now(),
      error: null,
    }
    transfers.set(id, transfer)
    sendTransferProgress(id, getMainWindow)
    processTransfer(id, getMainWindow)
    return true
  })

  ipcMain.handle('transfer-pause', (_event, id) => {
    const t = transfers.get(id)
    if (t && t.status === 'running') { t.status = 'paused'; sendTransferProgress(id, getMainWindow) }
    return true
  })

  ipcMain.handle('transfer-resume', (_event, id) => {
    const t = transfers.get(id)
    if (t && t.status === 'paused') { t.status = 'running'; sendTransferProgress(id, getMainWindow) }
    return true
  })

  ipcMain.handle('transfer-cancel', (_event, id) => {
    const t = transfers.get(id)
    if (t) { t.status = 'cancelled'; sendTransferProgress(id, getMainWindow) }
    return true
  })

  ipcMain.handle('transfer-retry', (_event, id) => {
    const t = transfers.get(id)
    if (t && t.status === 'completed') {
      t.status = 'running'
      t.completedFiles = 0
      t.transferredBytes = 0
      t.currentFileIdx = 0
      t.errors = []
      t.startTime = Date.now()
      sendTransferProgress(id, getMainWindow)
      processTransfer(id, getMainWindow)
    }
    return true
  })
}

module.exports = { register }
