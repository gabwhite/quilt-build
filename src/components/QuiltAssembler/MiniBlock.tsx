import type { Block, Cell } from '../../types'

const BLOCK_SIZE = 80

function toGray(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const h = lum.toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

function resolveColor(hex: string, grayscale: boolean): string {
  return grayscale ? toGray(hex) : hex
}

interface MiniCellProps {
  cell: Cell
  x: number
  y: number
  size: number
  grayscale: boolean
}

function MiniCell({ cell, x, y, size, grayscale }: MiniCellProps) {
  if (cell.shape === 'square') {
    return (
      <rect
        x={x} y={y} width={size} height={size}
        fill={resolveColor(cell.colors[0], grayscale)}
        stroke="#ccc"
        strokeWidth={0.3}
      />
    )
  }
  const [c0, c1] = cell.colors as [string, string]
  let t1Points: string, t2Points: string
  if (cell.shape === 'hst-down') {
    t1Points = `${x},${y} ${x + size},${y} ${x},${y + size}`
    t2Points = `${x + size},${y} ${x + size},${y + size} ${x},${y + size}`
  } else {
    t1Points = `${x},${y} ${x + size},${y} ${x + size},${y + size}`
    t2Points = `${x},${y} ${x + size},${y + size} ${x},${y + size}`
  }
  return (
    <>
      <polygon points={t1Points} fill={resolveColor(c0, grayscale)} stroke="#ccc" strokeWidth={0.3} />
      <polygon points={t2Points} fill={resolveColor(c1, grayscale)} stroke="#ccc" strokeWidth={0.3} />
    </>
  )
}

interface MiniBlockProps {
  block: Block
  grayscale: boolean
  rotation?: number  // degrees: 0, 90, 180, 270
  x: number
  y: number
}

export function MiniBlock({ block, grayscale, rotation = 0, x, y }: MiniBlockProps) {
  const cellSize = BLOCK_SIZE / block.gridSize
  const cx = x + BLOCK_SIZE / 2
  const cy = y + BLOCK_SIZE / 2

  return (
    <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
      {block.cells.map((row, ri) =>
        row.map((cell, ci) => (
          <MiniCell
            key={`${ri}-${ci}`}
            cell={cell}
            x={x + ci * cellSize}
            y={y + ri * cellSize}
            size={cellSize}
            grayscale={grayscale}
          />
        ))
      )}
    </g>
  )
}

export { BLOCK_SIZE }
