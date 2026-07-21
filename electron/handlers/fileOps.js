const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')

const dirCache = new Map()
const DIR_CACHE_MAX = 100
const DIR_CACHE_TTL = 5000

function isPathSafe(filePath) {
  const normalized = path.normalize(filePath)
  return !normalized.includes('..')
}

const mimeMap = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
}

function metaPath(dirPath) {
  return path.join(dirPath, '.powerdesk_meta.json')
}

function readMeta(dirPath) {
  try {
    const mp = metaPath(dirPath)
    if (fs.existsSync(mp)) {
      return JSON.parse(fs.readFileSync(mp, 'utf-8'))
    }
  } catch (e) { console.error('[PowerDesk] readMeta:', e.message) }
  return {}
}

function writeMeta(dirPath, data) {
  try {
    fs.writeFileSync(metaPath(dirPath), JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) { console.error('[PowerDesk] writeMeta:', e.message) }
}

function getItemMeta(dirPath, itemName) {
  return readMeta(dirPath)[itemName] || {}
}

function setItemMeta(dirPath, itemName, updates) {
  const meta = readMeta(dirPath)
  meta[itemName] = { ...(meta[itemName] || {}), ...updates }
  writeMeta(dirPath, meta)
}

async function readDirectory(dirPath) {
  const now = Date.now()
  const cached = dirCache.get(dirPath)
  if (cached && now - cached.timestamp < DIR_CACHE_TTL) {
    return cached.data
  }
  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true })
    const meta = readMeta(dirPath)
    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        const stat = await fsPromises.stat(fullPath)
        const itemMeta = meta[entry.name] || {}
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          extension: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
          color: itemMeta.color,
          tags: itemMeta.tags || [],
        }
      })
    )
    const files = []
    for (const r of results) {
      if (r.status === 'fulfilled') files.push(r.value)
    }
    if (dirCache.size >= DIR_CACHE_MAX) {
      const firstKey = dirCache.keys().next().value
      dirCache.delete(firstKey)
    }
    dirCache.set(dirPath, { data: files, timestamp: now })
    return files
  } catch (e) { console.error('[PowerDesk] readDirectory:', e.message); return null }
}

async function copyFile(src, dest) {
  try {
    await fsPromises.cp(src, dest, { recursive: true, errorOnExist: false })
    return true
  } catch (e) { console.error('[PowerDesk] copyFile:', e.message); return false }
}

async function deleteFile(filePath) {
  try {
    await fsPromises.rm(filePath, { recursive: true, force: true })
    return true
  } catch (e) { console.error('[PowerDesk] deleteFile:', e.message); return false }
}

async function renameFile(oldPath, newPath) {
  try {
    await fsPromises.rename(oldPath, newPath)
    return true
  } catch (e) { console.error('[PowerDesk] renameFile:', e.message); return false }
}

async function createFolder(dirPath, name) {
  try {
    const fullPath = path.join(dirPath, name)
    await fsPromises.mkdir(fullPath, { recursive: true })
    return { success: true, path: fullPath }
  } catch (e) { return { success: false, error: e.message } }
}

async function createFile(dirPath, name) {
  try {
    const fullPath = path.join(dirPath, name)
    await fsPromises.writeFile(fullPath, '', { flag: 'wx' })
    return { success: true, path: fullPath }
  } catch (e) { return { success: false, error: e.message } }
}

async function getFolderSize(dirPath, depth = 0) {
  if (depth > 10) return 0
  let totalSize = 0
  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true })
    const promises = entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name)
      try {
        const stat = await fsPromises.stat(fullPath)
        if (entry.isDirectory()) {
          return await getFolderSize(fullPath, depth + 1)
        }
        return stat.size
      } catch (e) { console.error('[PowerDesk] getFolderSize stat:', e.message); return 0 }
    })
    const sizes = await Promise.allSettled(promises)
    for (const r of sizes) {
      if (r.status === 'fulfilled') totalSize += r.value
    }
  } catch (e) { console.error('[PowerDesk] getFolderSize:', e.message) }
  return totalSize
}

function register(ipcMain, deps) {
  const { addRecentFile } = deps

  ipcMain.handle('read-dir', async (_event, dirPath) => {
    return await readDirectory(dirPath)
  })

  ipcMain.handle('refresh-dir', async (_event, dirPath) => {
    dirCache.delete(dirPath)
    return await readDirectory(dirPath)
  })

  ipcMain.handle('open-path', (_event, filePath) => {
    try {
      addRecentFile(filePath)
      require('electron').shell.openPath(filePath)
      return true
    } catch (e) { console.error('[PowerDesk] openPath:', e.message); return false }
  })

  ipcMain.handle('read-file-text', async (_event, filePath) => {
    try {
      const stat = await fsPromises.stat(filePath)
      if (stat.size > 1_048_576) return { error: 'File too large for preview', size: stat.size }
      const content = await fsPromises.readFile(filePath, 'utf-8')
      return { content, size: stat.size }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('get-file-stat', async (_event, filePath) => {
    try {
      const stat = await fsPromises.stat(filePath)
      return {
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
      }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('check-files-exist', async (_event, paths) => {
    const results = {}
    const checks = paths.map(async (p) => {
      try {
        const stat = await fsPromises.stat(p)
        results[p] = { exists: true, isDirectory: stat.isDirectory(), size: stat.size }
      } catch (e) { console.error('[PowerDesk] check-files-exist:', p, e.message); results[p] = { exists: false } }
    })
    await Promise.allSettled(checks)
    return results
  })

  ipcMain.handle('file-copy', async (_event, src, dest) => {
    return await copyFile(src, dest)
  })

  ipcMain.handle('file-delete', async (_event, filePath) => {
    return await deleteFile(filePath)
  })

  ipcMain.handle('trash-file', async (_event, filePath) => {
    if (!isPathSafe(filePath)) return { error: 'Invalid path' }
    try {
      const { app } = require('electron')
      const trashDir = path.join(app.getPath('userData'), 'trash')
      if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true })
      const baseName = path.basename(filePath)
      const uniqueName = `${Date.now()}_${baseName}`
      const destPath = path.join(trashDir, uniqueName)
      fs.renameSync(filePath, destPath)
      return { success: true, trashPath: destPath }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('restore-from-trash', async (_event, trashPath, originalPath) => {
    try {
      const destDir = path.dirname(originalPath)
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
      fs.renameSync(trashPath, originalPath)
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('file-rename', async (_event, oldPath, newPath) => {
    if (!isPathSafe(oldPath) || !isPathSafe(newPath)) return { error: 'Invalid path' }
    return await renameFile(oldPath, newPath)
  })

  ipcMain.handle('create-folder', async (_event, dirPath, name) => {
    if (!isPathSafe(dirPath)) return { success: false, error: 'Invalid path' }
    return await createFolder(dirPath, name)
  })

  ipcMain.handle('create-file', async (_event, dirPath, name) => {
    if (!isPathSafe(dirPath)) return { success: false, error: 'Invalid path' }
    return await createFile(dirPath, name)
  })

  ipcMain.handle('write-file-text', async (_event, filePath, content) => {
    if (!isPathSafe(filePath)) return { error: 'Invalid path' }
    try {
      await fsPromises.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('get-folder-size', async (_event, dirPath) => {
    return await getFolderSize(dirPath)
  })

  ipcMain.handle('get-folder-sizes-batch', async (_event, dirPaths) => {
    const results = {}
    const promises = dirPaths.map(async (dp) => {
      results[dp] = await getFolderSize(dp)
    })
    await Promise.allSettled(promises)
    return results
  })

  ipcMain.handle('get-item-meta', (_event, dirPath, itemName) => {
    return getItemMeta(dirPath, itemName)
  })

  ipcMain.handle('set-item-meta', (_event, dirPath, itemName, updates) => {
    setItemMeta(dirPath, itemName, updates)
    return true
  })
}

module.exports = { register, dirCache, mimeMap }
