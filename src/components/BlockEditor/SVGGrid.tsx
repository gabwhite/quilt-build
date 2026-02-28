import type { Block, Cell } from '../../types'
import { resolveColor } from '../../lib/colorUtils'

const CANVAS_SIZE = 400 // px

interface SVGGridProps {
  block: Block
  grayscale: boolean
  onCellClick: (row: number, col: number, triangleIdx?: 0 | 1) => void
}

interface CellShapeProps {
  cell: Cell
  x: number
  y: number
  size: number
  grayscale: boolean
  row: number
  col: number
  onClick: (row: number, col: number, idx?: 0 | 1) => void
}

function CellShape({ cell, x, y, size, grayscale, row, col, onClick }: CellShapeProps) {
  if (cell.shape === 'square') {
    return (
      <rect
        data-testid={`cell-${row}-${col}`}
        x={x} y={y} width={size} height={size}
        fill={resolveColor(cell.colors[0], grayscale)}
        stroke="#ccc"
        strokeWidth={0.5}
        style={{ cursor: 'pointer' }}
        onClick={() => onClick(row, col, undefined)}
      />
    )
  }

  const [c0, c1] = cell.colors as [string, string]
  let t1Points: string, t2Points: string

  if (cell.shape === 'hst-down') {
    // diagonal: top-left → bottom-right
    t1Points = `${x},${y} ${x + size},${y} ${x},${y + size}`
    t2Points = `${x + size},${y} ${x + size},${y + size} ${x},${y + size}`
  } else {
    // hst-up: diagonal: top-right → bottom-left
    t1Points = `${x},${y} ${x + size},${y} ${x + size},${y + size}`
    t2Points = `${x},${y} ${x + size},${y + size} ${x},${y + size}`
  }

  return (
    <>
      <polygon
        data-testid={`cell-${row}-${col}-t0`}
        points={t1Points}
        fill={resolveColor(c0, grayscale)}
        stroke="#ccc"
        strokeWidth={0.5}
        style={{ cursor: 'pointer' }}
        onClick={() => onClick(row, col, 0)}
      />
      <polygon
        data-testid={`cell-${row}-${col}-t1`}
        points={t2Points}
        fill={resolveColor(c1, grayscale)}
        stroke="#ccc"
        strokeWidth={0.5}
        style={{ cursor: 'pointer' }}
        onClick={() => onClick(row, col, 1)}
      />
    </>
  )
}

export function SVGGrid({ block, grayscale, onCellClick }: SVGGridProps) {
  const cellSize = CANVAS_SIZE / block.gridSize
  return (
    <svg
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ border: '1px solid #999' }}
    >
      {block.cells.map((row, ri) =>
        row.map((cell, ci) => (
          <CellShape
            key={`${ri}-${ci}`}
            cell={cell}
            x={ci * cellSize}
            y={ri * cellSize}
            size={cellSize}
            grayscale={grayscale}
            row={ri}
            col={ci}
            onClick={onCellClick}
          />
        ))
      )}
    </svg>
  )
}
