const path = require('path')
const fs = require('fs')

function workspacePath(app) {
  return path.join(app.getPath('userData'), 'workspace.json')
}

function loadWorkspace(app) {
  try {
    const wp = workspacePath(app)
    if (fs.existsSync(wp)) {
      return JSON.parse(fs.readFileSync(wp, 'utf-8'))
    }
  } catch {}
  return null
}

function saveWorkspace(app, workspace) {
  try {
    fs.writeFileSync(workspacePath(app), JSON.stringify(workspace, null, 2), 'utf-8')
  } catch {}
}

function loadRecentFiles(app) {
  try {
    const workspace = loadWorkspace(app)
    return workspace?.recentFiles || []
  } catch {}
  return []
}

function addRecentFile(app, filePath) {
  try {
    const workspace = loadWorkspace(app) || {}
    if (!workspace.recentFiles) workspace.recentFiles = []
    const folderPath = path.dirname(filePath)
    const folderName = path.basename(folderPath) || folderPath
    workspace.recentFiles = workspace.recentFiles.filter((f) => f.path !== folderPath)
    workspace.recentFiles.unshift({ path: folderPath, name: folderName, accessedAt: new Date().toISOString() })
    workspace.recentFiles = workspace.recentFiles.slice(0, 50)
    saveWorkspace(app, workspace)
  } catch {}
}

function register(ipcMain, deps) {
  const { app } = deps

  ipcMain.handle('get-home-dir', () => app.getPath('home'))
  ipcMain.handle('get-documents-dir', () => app.getPath('documents'))
  ipcMain.handle('get-desktop-dir', () => app.getPath('desktop'))
  ipcMain.handle('get-downloads-dir', () => app.getPath('downloads'))
  ipcMain.handle('get-pictures-dir', () => app.getPath('pictures'))
  ipcMain.handle('get-music-dir', () => app.getPath('music'))
  ipcMain.handle('get-videos-dir', () => app.getPath('videos'))

  ipcMain.handle('get-drives-windows', () => {
    const drives = []
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i)
      const drivePath = `${letter}:\\`
      try { fs.accessSync(drivePath); drives.push(drivePath) } catch {}
    }
    return drives
  })

  ipcMain.handle('get-initial-dirs', () => ({
    home: app.getPath('home'),
    documents: app.getPath('documents'),
    desktop: app.getPath('desktop'),
    downloads: app.getPath('downloads'),
    pictures: app.getPath('pictures'),
    music: app.getPath('music'),
    videos: app.getPath('videos'),
  }))

  ipcMain.handle('get-recent-files', () => {
    return loadRecentFiles(app)
  })

  ipcMain.handle('track-recent', (_event, filePath) => {
    addRecentFile(app, filePath)
    return true
  })

  ipcMain.handle('clear-recent-files', () => {
    try {
      const workspace = loadWorkspace(app) || {}
      workspace.recentFiles = []
      saveWorkspace(app, workspace)
    } catch {}
    return true
  })

  ipcMain.handle('compress-files', async (_event, filePaths, outputPath) => {
    const archiver = require('archiver')
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      output.on('close', () => resolve(true))
      archive.on('error', reject)
      archive.pipe(output)
      for (const fp of filePaths) {
        const name = path.basename(fp)
        try {
          const stat = fs.statSync(fp)
          if (stat.isDirectory()) {
            archive.directory(fp, name)
          } else {
            archive.file(fp, { name })
          }
        } catch {}
      }
      archive.finalize()
    })
  })

  ipcMain.handle('terminal-exec', async (_event, cwd, command) => {
    const { exec } = require('child_process')
    return new Promise((resolve) => {
      exec(command, { cwd, shell: 'powershell.exe', timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({ stdout: stdout || '', stderr: stderr || '', error: err?.message || null })
      })
    })
  })

  ipcMain.handle('analyze-folder', async (_event, dirPath) => {
    const files = []
    const dirs = []

    function walk(dir, depth) {
      if (depth > 20) return
      let entries
      try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
      for (const entry of entries) {
        if (entry.name === '.powerdesk-trash') continue
        const fullPath = path.join(dir, entry.name)
        try {
          if (entry.isDirectory()) {
            dirs.push(fullPath)
            walk(fullPath, depth + 1)
          } else {
            const stat = fs.statSync(fullPath)
            files.push({
              name: entry.name,
              path: fullPath,
              dir,
              size: stat.size,
              modified: stat.mtimeMs,
              ext: path.extname(entry.name).toLowerCase(),
            })
          }
        } catch {}
      }
    }
    walk(dirPath, 0)

    const totalSize = files.reduce((a, f) => a + f.size, 0)
    const totalFiles = files.length
    const totalDirs = dirs.length

    const extMap = {}
    for (const f of files) {
      const ext = f.ext || '(none)'
      if (!extMap[ext]) extMap[ext] = { count: 0, size: 0 }
      extMap[ext].count++
      extMap[ext].size += f.size
    }
    const extBreakdown = Object.entries(extMap)
      .map(([ext, data]) => ({ ext, count: data.count, size: data.size }))
      .sort((a, b) => b.size - a.size)

    const largestFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 20)

    const folderSizes = {}
    for (const f of files) {
      let cur = f.dir
      while (cur && cur.startsWith(dirPath)) {
        if (!folderSizes[cur]) folderSizes[cur] = 0
        folderSizes[cur] += f.size
        cur = path.dirname(cur)
      }
    }
    const largestFolders = Object.entries(folderSizes)
      .map(([fp, size]) => ({ path: fp, name: path.basename(fp) || fp, size }))
      .filter((f) => f.path !== dirPath)
      .sort((a, b) => b.size - a.size)
      .slice(0, 15)

    const sizeMap = {}
    for (const f of files) {
      const key = f.name + '|' + f.size
      if (!sizeMap[key]) sizeMap[key] = []
      sizeMap[key].push(f)
    }
    const duplicates = Object.values(sizeMap)
      .filter((group) => group.length > 1)
      .sort((a, b) => b[0].size * b.length - a[0].size * a.length)
      .slice(0, 20)

    const emptyFolders = dirs.filter((d) => {
      let hasContent = false
      for (const f of files) { if (f.dir === d) { hasContent = true; break } }
      if (hasContent) return false
      for (const sub of dirs) { if (path.dirname(sub) === d) { hasContent = true; break } }
      return !hasContent
    }).slice(0, 30)

    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    const oldFiles = files.filter((f) => f.modified < cutoff)

    const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentFiles = files.filter((f) => f.modified > recentCutoff).sort((a, b) => b.modified - a.modified).slice(0, 20)

    const sizeBuckets = { '< 1 MB': 0, '1-10 MB': 0, '10-100 MB': 0, '100 MB - 1 GB': 0, '> 1 GB': 0 }
    for (const f of files) {
      if (f.size < 1024 * 1024) sizeBuckets['< 1 MB']++
      else if (f.size < 10 * 1024 * 1024) sizeBuckets['1-10 MB']++
      else if (f.size < 100 * 1024 * 1024) sizeBuckets['10-100 MB']++
      else if (f.size < 1024 * 1024 * 1024) sizeBuckets['100 MB - 1 GB']++
      else sizeBuckets['> 1 GB']++
    }

    return {
      totalSize, totalFiles, totalDirs, extBreakdown, largestFiles, largestFolders,
      duplicates, emptyFolders, oldFilesCount: oldFiles.length, recentFiles,
      sizeBuckets, avgFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
    }
  })

  ipcMain.handle('load-workspace', () => {
    const saved = loadWorkspace(app)
    return saved?.tabs || null
  })

  ipcMain.handle('save-workspace', (_event, tabs) => {
    const workspace = loadWorkspace(app) || {}
    workspace.tabs = tabs
    saveWorkspace(app, workspace)
    return true
  })

  ipcMain.handle('get-plugins-dir', () => {
    const pluginsDir = path.join(app.getPath('userData'), 'plugins')
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true })
    }
    return pluginsDir
  })

  ipcMain.handle('get-plugin-guide-path', () => {
    const devPath = path.join(app.getAppPath(), 'docs', 'PluginDevelopmentGuide.html')
    if (fs.existsSync(devPath)) return devPath
    const prodPath = path.join(path.dirname(app.getPath('exe')), 'resources', 'docs', 'PluginDevelopmentGuide.html')
    if (fs.existsSync(prodPath)) return prodPath
    return devPath
  })
}

module.exports = { register, loadWorkspace, saveWorkspace, addRecentFile }
