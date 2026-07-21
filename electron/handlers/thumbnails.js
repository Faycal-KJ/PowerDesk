const path = require('path')
const fs = require('fs')

let _sharp
function getSharp() {
  if (!_sharp) _sharp = require('sharp')
  return _sharp
}

const thumbnailCache = new Map()
const THUMB_SIZE = 200
const PREVIEW_SIZE = 1200
const CACHE_MAX = 500

const mimeMap = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
}

async function generateThumbnail(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (!mimeMap[ext]) return null

  const key = `${filePath}@${THUMB_SIZE}`
  if (thumbnailCache.has(key)) {
    return thumbnailCache.get(key)
  }

  try {
    const resized = await getSharp()(filePath)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer()

    const base64 = resized.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    if (thumbnailCache.size >= CACHE_MAX) {
      const firstKey = thumbnailCache.keys().next().value
      thumbnailCache.delete(firstKey)
    }
    thumbnailCache.set(key, dataUrl)

    return dataUrl
  } catch (e) {
    console.error('[PowerDesk] generateThumbnail:', e.message)
    return null
  }
}

async function generateThumbnailBatch(filePaths) {
  const results = await Promise.allSettled(
    filePaths.map(async (fp) => ({
      path: fp,
      dataUrl: await generateThumbnail(fp),
    }))
  )
  const out = {}
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.dataUrl) {
      out[r.value.path] = r.value.dataUrl
    }
  }
  return out
}

async function generateImagePreview(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (!mimeMap[ext]) return null
  const key = `${filePath}@${PREVIEW_SIZE}`
  if (thumbnailCache.has(key)) return thumbnailCache.get(key)
  try {
    const resized = await getSharp()(filePath)
      .rotate()
      .resize(PREVIEW_SIZE, PREVIEW_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    const dataUrl = `data:image/jpeg;base64,${resized.toString('base64')}`
    if (thumbnailCache.size >= CACHE_MAX) {
      const firstKey = thumbnailCache.keys().next().value
      thumbnailCache.delete(firstKey)
    }
    thumbnailCache.set(key, dataUrl)
    return dataUrl
  } catch (e) { console.error('[PowerDesk] generateImagePreview:', e.message); return null }
}

function parseExif(exifBuf) {
  try {
    const exifStr = exifBuf.toString('hex')
    const result = {}

    const tags = {
      0x010F: 'make',
      0x0110: 'model',
      0x0112: 'orientation',
      0x011A: 'xResolution',
      0x011B: 'yResolution',
      0x0131: 'software',
      0x0132: 'dateTime',
      0x013B: 'artist',
      0x8298: 'copyright',
      0x8769: 'exifIFDPointer',
      0x8825: 'gpsIFDPointer',
    }

    const str = exifBuf.toString('utf8')
    const makeMatch = str.match(/Nikon|Canon|Sony|FUJI|Apple|Samsung|Google|OnePlus|Huawei|Xiaomi|DJI|GoPro|Leica|Panasonic|Olympus|Pentax|Sigma|Tamron|Minolta|Konica|Agfa|Kodak/i)
    if (makeMatch) result.make = makeMatch[0]

    const modelPatterns = str.match(/[\w-]+(?:[\s][\w-]+){0,3}(?:DSC|EOS|ILCE|X-T|GH|Z\s?\d|Q\s?\d|D\d|α\d)/g)
    if (modelPatterns) result.model = modelPatterns[0]?.trim()

    const isoMatch = str.match(/ISO[:\s]*(\d{1,4})/i)
    if (isoMatch) result.iso = parseInt(isoMatch[1])

    const focalMatch = str.match(/(\d+(?:\.\d+)?)\s*mm/)
    if (focalMatch) result.focalLength = focalMatch[1] + ' mm'

    const apertureMatch = str.match(/[fF][/\\]\s*(\d+(?:\.\d+)?)/)
    if (apertureMatch) result.aperture = 'f/' + apertureMatch[1]

    const exposureMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:sec|s)\b/)
    if (exposureMatch) result.exposureTime = exposureMatch[1] + 's'

    const dateMatch = str.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (dateMatch) result.dateTimeOriginal = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`

    const softMatch = str.match(/(?:Adobe Photoshop|Lightroom|Capture One|DxO|Snapseed|VSCO|Afterlight)[\w\s.]*/)
    if (softMatch) result.software = softMatch[0].trim().substring(0, 50)

    return result
  } catch (e) {
    console.error('[PowerDesk] parseExif:', e.message)
    return null
  }
}

function register(ipcMain, deps) {
  ipcMain.handle('read-image-thumbnail', async (_event, filePath) => {
    return await generateThumbnail(filePath)
  })

  ipcMain.handle('read-image-thumbnails-batch', async (_event, filePaths) => {
    return await generateThumbnailBatch(filePaths)
  })

  ipcMain.handle('read-image-preview', async (_event, filePath) => {
    return await generateImagePreview(filePath)
  })

  ipcMain.handle('file-inspect', async (_event, filePath) => {
    const stat = fs.statSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const baseName = path.basename(filePath)

    const result = {
      name: baseName,
      path: filePath,
      size: stat.size,
      created: stat.birthtimeMs,
      modified: stat.mtimeMs,
      accessed: stat.atimeMs,
      ext,
      isDirectory: stat.isDirectory(),
      image: null,
      video: null,
      audio: null,
    }

    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp', '.svg', '.avif', '.heic', '.heif']
    if (imageExts.includes(ext)) {
      try {
        const meta = await getSharp()(filePath).metadata()
        const stats = await getSharp()(filePath).stats()
        result.image = {
          format: meta.format,
          width: meta.width,
          height: meta.height,
          density: meta.density,
          hasAlpha: meta.hasAlpha,
          channels: meta.channels,
          space: meta.space,
          depth: meta.depth,
          codec: meta.codec,
          isProgressive: meta.isProgressive,
          pages: meta.pages,
          exif: meta.exif ? parseExif(meta.exif) : null,
          dominant: stats.dominant ? { r: stats.dominant.r, g: stats.dominant.g, b: stats.dominant.b } : null,
          isOpaque: stats.isOpaque,
          entropy: stats.entropy,
        }
      } catch (e) { console.error('[PowerDesk] file-inspect image:', e.message) }
    }

    return result
  })
}

module.exports = { register }
