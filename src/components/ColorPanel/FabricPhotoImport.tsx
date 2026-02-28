import { useRef, useState } from 'react'
import { useQuiltStore } from '../../store/useQuiltStore'

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function FabricPhotoImport() {
  const { addColor, setActiveColor } = useQuiltStore()
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const px = ctx.getImageData(Math.floor(x * scaleX), Math.floor(y * scaleY), 1, 1).data
    const hex = rgbToHex(px[0], px[1], px[2])
    addColor(hex)
    setActiveColor(hex)
  }

  async function handleExtractDominant() {
    const img = imgRef.current
    if (!img) return
    try {
      const ColorThief = (await import('colorthief')).default
      const thief = new ColorThief()
      const dominantPalette = thief.getPalette(img, 5) as [number, number, number][]
      dominantPalette.forEach(([r, g, b]) => {
        const hex = rgbToHex(r, g, b)
        addColor(hex)
      })
    } catch {
      console.error('Failed to extract colors from photo')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 'bold' }}>Import Fabric Photo</div>
      <input type="file" accept="image/*" onChange={handleFile} />
      {imgSrc && (
        <>
          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
            Click anywhere on the photo to sample that color.
          </p>
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Fabric photo for color sampling"
            crossOrigin="anonymous"
            style={{ maxWidth: 240, cursor: 'crosshair', border: '1px solid #ccc' }}
            onClick={handleImageClick}
          />
          <button onClick={handleExtractDominant}>Extract 5 dominant colors</button>
        </>
      )}
    </div>
  )
}
