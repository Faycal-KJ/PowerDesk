const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')

const searchIndex = { files: [], built: false, building: false, rootPaths: new Set() }
const INDEX_MAX_FILES = 1_000_000

function getSearchRoots() {
  const { homedir } = require('os')
  const home = homedir()
  const dirs = []
  try { fs.accessSync(home); dirs.push(home) } catch {}
  return dirs
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg',
  '__pycache__', '.cache', 'vendor',
  'bower_components', '.next', '.nuxt',
  'dist', 'build', 'target',
  'bin', 'obj', '.gradle', '.m2',
  '.npm', '.yarn', '.pnpm-store',
  'AppData', 'Application Data', 'Local Settings',
  '$Recycle.Bin', 'System Volume Information',
  'Recovery', 'Windows', 'WinSxS', 'Installer',
  'MSOCache', 'Intel', 'AMD', 'NVIDIA',
  'Temp', 'tmp', 'logs', 'log',
])

function isSkipDir(name) {
  return name.startsWith('.') || SKIP_DIRS.has(name)
}

const INDEXER_CONCURRENCY = 128

async function buildIndexWorker_Node(rootPaths, onProgress) {
  searchIndex.files = []
  const pending = [...rootPaths]
  const visited = new Set()
  let scanned = 0
  let active = 0

  async function walkDir(dirPath) {
    if (!dirPath || visited.has(dirPath)) return
    visited.add(dirPath)
    let entries
    try { entries = await fsPromises.readdir(dirPath, { withFileTypes: true }) } catch { return }

    const dirs = []
    for (const e of entries) {
      try {
        if (e.isDirectory() && isSkipDir(e.name)) continue
        const fp = path.join(dirPath, e.name)
        const isDir = e.isDirectory()
        scanned++
        let size = 0
        let modifiedAt = ''
        try {
          const st = await fsPromises.stat(fp)
          size = st.size
          modifiedAt = st.mtime.toISOString()
        } catch {}
        searchIndex.files.push({
          name: e.name,
          path: fp,
          isDirectory: isDir,
          size,
          modifiedAt,
          extension: isDir ? '' : path.extname(e.name).toLowerCase(),
        })
        if (searchIndex.files.length >= INDEX_MAX_FILES) {
          if (onProgress) onProgress(scanned)
          return
        }
        if (isDir) dirs.push(fp)
      } catch {}
    }

    if (dirs.length > 0) pending.push(...dirs)
    if (onProgress && scanned % 1000 === 0) onProgress(scanned)
  }

  while (pending.length > 0 || active > 0) {
    while (pending.length > 0 && active < INDEXER_CONCURRENCY) {
      const dir = pending.pop()
      active++
      walkDir(dir).finally(() => active--)
    }
    if (active > 0) await new Promise(r => setImmediate(r))
  }
}

async function buildIndex_Go(binPath, rootPaths, onProgress) {
  const { spawn } = require('child_process')
  const nativeRoots = rootPaths.length > 0 ? rootPaths : getSearchRoots()

  const child = spawn(binPath, ['-roots', nativeRoots.join(',')], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let buf = ''
  let lastProgress = 0

  for await (const chunk of child.stdout) {
    buf += chunk.toString()
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        if (obj._progress) {
          lastProgress = obj._progress
          if (onProgress) onProgress(lastProgress)
        } else if (obj._done) {
          if (onProgress) onProgress(lastProgress)
        } else {
          searchIndex.files.push(obj)
        }
      } catch {}
    }
  }

  if (buf.trim()) {
    try {
      const obj = JSON.parse(buf.trim())
      if (obj._done) {
        if (onProgress) onProgress(lastProgress)
      } else {
        searchIndex.files.push(obj)
      }
    } catch {}
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Go indexer exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function buildIndex(rootPaths, app, onProgress) {
  if (searchIndex.building) return
  searchIndex.building = true
  searchIndex.built = false
  searchIndex.rootPaths = new Set(rootPaths)
  searchIndex.files = []

  const binName = process.platform === 'win32' ? 'pdx-index.exe' : 'pdx-index'
  const goBinaryPath = path.join(__dirname, '..', 'bin', binName)
  const binPath = app.isPackaged
    ? path.join(process.resourcesPath, 'bin', binName)
    : goBinaryPath

  if (fs.existsSync(binPath)) {
    try {
      await buildIndex_Go(binPath, rootPaths, onProgress)
    } catch (e) {
      console.error('Go indexer failed, falling back to Node:', e.message)
      await buildIndexWorker_Node(rootPaths, onProgress)
    }
  } else {
    console.log('[PowerDesk] Go indexer not found, using Node.js indexer')
    await buildIndexWorker_Node(rootPaths, onProgress)
  }

  searchIndex.built = true
  searchIndex.building = false
}

function searchFiles(query) {
  if (!query || !query.trim()) return []
  const q = query.toLowerCase().trim()
  const terms = q.split(/\s+/)
  const results = []

  for (const f of searchIndex.files) {
    let score = 0
    const nl = f.name.toLowerCase()
    const pl = f.path.toLowerCase()
    if (nl === q) score += 100
    else if (nl.startsWith(q)) score += 50
    else if (nl.includes(q)) score += 30
    else if (pl.includes(q)) score += 10
    if (terms.length > 1) {
      let m = 0
      for (const t of terms) if (nl.includes(t)) m++
      score += m * 15
    }
    if (score > 0) results.push({ ...f, _score: score })
    if (results.length >= 2000) break
  }
  return results.sort((a, b) => b._score - a._score).slice(0, 200)
}

function register(ipcMain, deps) {
  const { getMainWindow, app } = deps

  ipcMain.handle('search-build-index', async (_event, rootPaths) => {
    await buildIndex(rootPaths || getSearchRoots(), app, (count) => {
      const mainWindow = getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send('index-progress', count)
      }
    })
    return { total: searchIndex.files.length }
  })

  ipcMain.handle('search-query', (_event, query) => {
    return searchFiles(query)
  })

  ipcMain.handle('search-status', () => ({
    built: searchIndex.built,
    building: searchIndex.building,
    total: searchIndex.files.length,
    roots: Array.from(searchIndex.rootPaths),
  }))
}

module.exports = { register }
