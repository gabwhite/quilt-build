export function toGray(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const h = lum.toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

export function resolveColor(hex: string, grayscale: boolean): string {
  return grayscale ? toGray(hex) : hex
}
