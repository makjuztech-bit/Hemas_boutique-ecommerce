const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function generate() {
  console.log('--- Generating Brand Icons for Hema\'s Boutique ---')
  const logoSource = path.join(__dirname, '../public/logo.jpg')

  if (!fs.existsSync(logoSource)) {
    console.error('Source logo not found at', logoSource)
    process.exit(1)
  }

  // 1. Generate multi-size ICO file for /favicon.ico
  // Google requires 48x48 (or multiple of 48) for search result favicons.
  const icoSizes = [16, 32, 48, 64]
  const pngBuffers = []
  for (const s of icoSizes) {
    const buf = await sharp(logoSource)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .ensureAlpha()
      .png()
      .toBuffer()
    pngBuffers.push({ width: s, height: s, buffer: buf })
  }

  const count = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // ICO format
  header.writeUInt16LE(count, 4) // count

  let offset = 6 + count * 16
  const dirEntries = []
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0)
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(item.buffer.length, 8)
    entry.writeUInt32LE(offset, 12)
    dirEntries.push(entry)
    offset += item.buffer.length
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...pngBuffers.map((b) => b.buffer)])

  // Save favicon.ico to both src/app/ and public/
  fs.writeFileSync(path.join(__dirname, '../src/app/favicon.ico'), icoBuffer)
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer)
  console.log('✓ Created src/app/favicon.ico and public/favicon.ico')

  // 2. Generate standard PNG icons for Next.js App Router and PWA
  const appIconBuffer = await sharp(logoSource)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(__dirname, '../src/app/icon.png'), appIconBuffer)
  fs.writeFileSync(path.join(__dirname, '../public/icon.png'), appIconBuffer)
  fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), appIconBuffer)
  console.log('✓ Created 512x512 icons (src/app/icon.png, public/icon.png, public/icon-512.png)')

  const icon192Buffer = await sharp(logoSource)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), icon192Buffer)
  console.log('✓ Created 192x192 icon (public/icon-192.png)')

  // 3. Apple Touch Icon (180x180)
  const appleIconBuffer = await sharp(logoSource)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(__dirname, '../src/app/apple-icon.png'), appleIconBuffer)
  fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.png'), appleIconBuffer)
  console.log('✓ Created Apple Touch Icons (src/app/apple-icon.png, public/apple-touch-icon.png)')

  // 4. Convert public/logo.png into a true high-res PNG (it was previously a renamed JPEG)
  const trueLogoPng = await sharp(logoSource).png().toBuffer()
  fs.writeFileSync(path.join(__dirname, '../public/logo.png'), trueLogoPng)
  console.log('✓ Converted public/logo.png to authentic true PNG')

  // 5. OpenGraph & Twitter Social Share Cards (1200x630)
  // Background in royal burgundy (#3B1522), with Hema's emblem resized to 480x480 centered
  const logoResizedForOg = await sharp(logoSource)
    .resize(460, 460, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer()

  const ogCard = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 59, g: 21, b: 34, alpha: 1 }, // #3B1522 royal burgundy
    },
  })
    .composite([
      {
        input: logoResizedForOg,
        top: 85,
        left: 370,
      },
    ])
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(__dirname, '../src/app/opengraph-image.png'), ogCard)
  fs.writeFileSync(path.join(__dirname, '../src/app/twitter-image.png'), ogCard)
  fs.writeFileSync(path.join(__dirname, '../public/og-image.png'), ogCard)
  console.log('✓ Created OpenGraph & Twitter Cards (src/app/opengraph-image.png, twitter-image.png, public/og-image.png)')

  console.log('\nAll brand icons generated successfully!')
}

generate().catch((err) => {
  console.error('Error generating brand icons:', err)
  process.exit(1)
})
