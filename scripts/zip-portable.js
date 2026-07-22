const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '..', 'dist', 'win-unpacked')
const outDir = path.join(__dirname, '..', 'release')
const outFile = path.join(outDir, 'PowerDesk_Portable.zip')

if (!fs.existsSync(srcDir)) {
  console.error('win-unpacked not found. Run electron-builder --win dir first.')
  process.exit(1)
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

console.log('Creating PowerDesk_Portable.zip...')
const output = fs.createWriteStream(outFile)
const archive = new archiver.Archiver('zip', { zlib: { level: 1 } })

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(1)
  console.log(`Done: ${outFile} (${mb} MB)`)
})

archive.pipe(output)
archive.directory(srcDir, 'PowerDesk')
archive.finalize()
