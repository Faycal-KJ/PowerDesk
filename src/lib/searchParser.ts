import type { SearchFilters } from '../types'

interface ParsedQuery {
  textQuery: string
  filters: Partial<SearchFilters>
}

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
  tb: 1024 * 1024 * 1024 * 1024,
}

function parseSize(str: string): number | null {
  const match = str.match(/^([\d.]+)\s*(b|kb|mb|gb|tb)$/i)
  if (!match) return null
  const num = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  return Math.round(num * (SIZE_UNITS[unit] || 1))
}

function parseRelativeDate(str: string): Date | null {
  const now = new Date()
  const lower = str.toLowerCase().trim()

  if (lower === 'today' || lower === 'today\'s') {
    now.setHours(0, 0, 0, 0)
    return now
  }
  if (lower === 'yesterday') {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (lower === 'this week' || lower === 'thisweek') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (lower === 'last week') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay() - 7)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (lower === 'this month' || lower === 'thismonth') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (lower === 'last month') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  }
  if (lower === 'this year' || lower === 'thisyear') {
    return new Date(now.getFullYear(), 0, 1)
  }
  if (lower === 'last year') {
    return new Date(now.getFullYear() - 1, 0, 1)
  }
  // "last summer", "last winter", etc.
  const seasons: Record<string, [number, number]> = {
    spring: [2, 1], summer: [5, 1], autumn: [8, 1], fall: [8, 1], winter: [11, 1],
  }
  for (const [name, [month, day]] of Object.entries(seasons)) {
    if (lower.includes(name)) {
      const year = now.getMonth() >= month ? now.getFullYear() : now.getFullYear() - 1
      return new Date(year, month, day)
    }
  }
  // "N days/weeks/months ago"
  const agoMatch = lower.match(/(\d+)\s*(day|week|month|year)s?\s*ago/)
  if (agoMatch) {
    const n = parseInt(agoMatch[1])
    const unit = agoMatch[2]
    const d = new Date(now)
    if (unit === 'day') d.setDate(d.getDate() - n)
    else if (unit === 'week') d.setDate(d.getDate() - n * 7)
    else if (unit === 'month') d.setMonth(d.getMonth() - n)
    else if (unit === 'year') d.setFullYear(d.getFullYear() - n)
    d.setHours(0, 0, 0, 0)
    return d
  }
  // "N days/weeks/months from now"
  const fromMatch = lower.match(/(\d+)\s*(day|week|month|year)s?\s*from\s*now/)
  if (fromMatch) {
    const n = parseInt(fromMatch[1])
    const unit = fromMatch[2]
    const d = new Date(now)
    if (unit === 'day') d.setDate(d.getDate() + n)
    else if (unit === 'week') d.setDate(d.getDate() + n * 7)
    else if (unit === 'month') d.setMonth(d.getMonth() + n)
    else if (unit === 'year') d.setFullYear(d.getFullYear() + n)
    d.setHours(0, 0, 0, 0)
    return d
  }
  // "june 2024", "jan 2023"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  for (let i = 0; i < 12; i++) {
    if (lower.includes(monthNames[i]) || lower.includes(shortMonths[i])) {
      const yearMatch = lower.match(/\d{4}/)
      const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear()
      return new Date(year, i, 1)
    }
  }
  return null
}

const EXTENSION_MAP: Record<string, string> = {
  image: 'jpg', images: 'jpg', photo: 'jpg', photos: 'jpg', picture: 'jpg', pictures: 'jpg',
  video: 'mp4', videos: 'mp4', movie: 'mp4', movies: 'mp4',
  audio: 'mp3', music: 'mp3', song: 'mp3', songs: 'mp3',
  document: 'pdf', documents: 'pdf', doc: 'pdf', docs: 'pdf',
  text: 'txt',
  code: 'js', source: 'js',
  pdf: 'pdf',
  zip: 'zip', archive: 'zip',
  image_ext: 'png',
  spreadsheet: 'xlsx',
  presentation: 'pptx',
  word: 'docx',
  excel: 'xlsx',
  powerpoint: 'pptx',
  python: 'py', javascript: 'js', typescript: 'ts', go: 'go', rust: 'rs',
  java: 'java', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', 'c#': 'cs',
  unity: 'unity', unreal: 'uasset', blender: 'blend', godot: 'gd',
  psd: 'psd', ai: 'ai', svg: 'svg', figma: 'fig',
}

const COLOR_MAP: Record<string, string> = {
  red: '#e74c3c', orange: '#e67e22', yellow: '#f1c40f', green: '#2ecc71',
  blue: '#3498db', purple: '#9b59b6', pink: '#e91e63',
}

// Smart filter syntax: type:pdf size>5MB tag:important modified:yesterday
function parseSmartFilters(query: string): ParsedQuery {
  const tokens = query.split(/\s+/)
  const textParts: string[] = []
  const filters: Partial<SearchFilters> = {}

  for (const token of tokens) {
    // key:value pattern
    const colonMatch = token.match(/^(\w+):(.+)$/)
    if (colonMatch) {
      const [, key, value] = colonMatch
      const k = key.toLowerCase()
      const v = value.toLowerCase()

      if (k === 'type' || k === 't') {
        if (v === 'file' || v === 'files' || v === 'f') filters.type = 'files'
        else if (v === 'folder' || v === 'folders' || v === 'dir' || v === 'd') filters.type = 'folders'
        else if (EXTENSION_MAP[v]) filters.extension = '.' + EXTENSION_MAP[v]
        else if (v.startsWith('.')) filters.extension = v
        else filters.extension = '.' + v
        continue
      }
      if (k === 'ext' || k === 'extension') {
        filters.extension = v.startsWith('.') ? v : '.' + v
        continue
      }
      if (k === 'tag' || k === 'tags') {
        filters.tags = value
        continue
      }
      if (k === 'color' || k === 'colour') {
        filters.color = COLOR_MAP[v] || v
        continue
      }
      if (k === 'author') {
        filters.author = value
        continue
      }
      if (k === 'modified' || k === 'date' || k === 'after') {
        const date = parseRelativeDate(value)
        if (date) filters.minDate = date.toISOString().split('T')[0]
        continue
      }
      if (k === 'before') {
        const date = parseRelativeDate(value)
        if (date) filters.maxDate = date.toISOString().split('T')[0]
        continue
      }
    }

    // key>value or key<value pattern (size comparisons)
    const compMatch = token.match(/^(\w+)([><=]+)(.+)$/)
    if (compMatch) {
      const [, key, op, value] = compMatch
      const k = key.toLowerCase()
      const bytes = parseSize(value)

      if ((k === 'size' || k === 's') && bytes !== null) {
        if (op === '>' || op === '>=') filters.minSize = bytes
        else if (op === '<' || op === '<=') filters.maxSize = bytes
        else if (op === '=') { filters.minSize = bytes; filters.maxSize = bytes }
        continue
      }
      if ((k === 'width' || k === 'w') && op === '>') {
        // Store as text query hint for now
        textParts.push(token)
        continue
      }
    }

    // Natural language patterns within the query
    const lower = token.toLowerCase()

    // "larger than Xmb" handled by natural language parser below
    // "modified yesterday" — just pass through as text
    textParts.push(token)
  }

  return { textQuery: textParts.join(' '), filters }
}

// Natural language: "pdf larger than 5mb", "photos from last summer", "files modified yesterday"
function parseNaturalLanguage(query: string): ParsedQuery {
  const lower = query.toLowerCase()
  const filters: Partial<SearchFilters> = {}
  let text = query

  // "larger/bigger than Xmb"
  const sizeGt = lower.match(/(?:larger|bigger|greater|over|above)\s+than\s+([\d.]+\s*(?:kb|mb|gb|tb|b))/)
  if (sizeGt) {
    const bytes = parseSize(sizeGt[1])
    if (bytes !== null) { filters.minSize = bytes; text = text.replace(sizeGt[0], '') }
  }

  // "smaller/less than Xmb"
  const sizeLt = lower.match(/(?:smaller|less|under|below)\s+than?\s+([\d.]+\s*(?:kb|mb|gb|tb|b))/)
  if (sizeLt) {
    const bytes = parseSize(sizeLt[1])
    if (bytes !== null) { filters.maxSize = bytes; text = text.replace(sizeLt[0], '') }
  }

  // "size Xmb" standalone
  const sizeEq = lower.match(/(?:size|sized?)\s+([\d.]+\s*(?:kb|mb|gb|tb|b))/)
  if (sizeEq) {
    const bytes = parseSize(sizeEq[1])
    if (bytes !== null) { filters.minSize = bytes; filters.maxSize = bytes; text = text.replace(sizeEq[0], '') }
  }

  // "modified/updated/change yesterday/today/last week"
  const datePatterns = [
    /(?:modified|updated|changed|edited)\s+(.+?)(?:\s|$)/,
    /(?:from|since|after)\s+(.+?)(?:\s|$)/,
    /(?:before|until|till)\s+(.+?)(?:\s|$)/,
  ]
  for (const pattern of datePatterns) {
    const match = lower.match(pattern)
    if (match) {
      const dateStr = match[1].trim()
      const date = parseRelativeDate(dateStr)
      if (date) {
        if (pattern.source.includes('before')) {
          filters.maxDate = date.toISOString().split('T')[0]
        } else {
          filters.minDate = date.toISOString().split('T')[0]
        }
        text = text.replace(match[0], '')
        break
      }
    }
  }

  // "tagged with X" or "tag X"
  const tagMatch = lower.match(/(?:tagged?\s+(?:with\s+)?|tags?\s+)(\w+)/)
  if (tagMatch) {
    filters.tags = tagMatch[1]
    text = text.replace(tagMatch[0], '')
  }

  // "red/green/blue files"
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) {
      filters.color = hex
      text = text.replace(new RegExp(`\\b${name}\\b`, 'gi'), '')
      break
    }
  }

  // "image/photo/picture" type shortcuts
  const typeWords: Record<string, string> = {
    image: '.jpg', images: '.jpg', photo: '.jpg', photos: '.jpg', picture: '.jpg', pictures: '.jpg',
    video: '.mp4', videos: '.mp4', movie: '.mp4', movies: '.mp4',
    audio: '.mp3', music: '.mp3', song: '.mp3',
    document: '.pdf', documents: '.pdf', doc: '.pdf',
    text: '.txt', code: '.js', pdf: '.pdf', zip: '.zip',
    image_ext: '.png', spreadsheet: '.xlsx', presentation: '.pptx',
    word: '.docx', excel: '.xlsx', powerpoint: '.pptx',
    python: '.py', javascript: '.js', typescript: '.ts',
    unity: '.unity', blender: '.blend', psd: '.psd',
  }
  for (const [word, ext] of Object.entries(typeWords)) {
    const re = new RegExp(`\\b${word}s?\\b`, 'gi')
    if (re.test(lower)) {
      filters.extension = ext
      text = text.replace(re, '')
      break
    }
  }

  // "files only" / "folders only"
  if (/\bfiles?\s+only\b/.test(lower)) { filters.type = 'files'; text = text.replace(/\bfiles?\s+only\b/gi, '') }
  if (/\bfolders?\s+only\b/.test(lower)) { filters.type = 'folders'; text = text.replace(/\bfolders?\s+only\b/gi, '') }

  // Clean up residual words that don't help search
  const noiseWords = ['the', 'a', 'an', 'all', 'every', 'find', 'show', 'search', 'for', 'with', 'that', 'which', 'in', 'on', 'at']
  const cleaned = text.split(/\s+/).filter((w) => w.length > 0 && !noiseWords.includes(w.toLowerCase())).join(' ')

  return { textQuery: cleaned, filters }
}

export function parseSearchQuery(query: string): ParsedQuery {
  // First try smart filter syntax (has key:value or key>value patterns)
  const hasFilterSyntax = /\w[:>]=?\S/.test(query)
  if (hasFilterSyntax) {
    return parseSmartFilters(query)
  }

  // Then try natural language
  const hasNaturalLanguage = /\b(larger|bigger|smaller|less|modified|updated|tagged|from|before|after|yesterday|today|week|month|year|ago)\b/i.test(query)
  if (hasNaturalLanguage) {
    return parseNaturalLanguage(query)
  }

  // Plain text search
  return { textQuery: query, filters: {} }
}
