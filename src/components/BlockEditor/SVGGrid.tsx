import { useState } from 'react'
import type { Block, Cell, ToolMode } from '../../types'
import { resolveColor } from '../../lib/colorUtils'

const CANVAS_SIZE = 400 // px

interface SVGGridProps {
  block: Block
  grayscale: boolean
  onCellClick: (row: number, col: number, triangleIdx?: 0 | 1) => void
  toolMode?: ToolMode
  onMerge?: (r1: number, c1: number, r2: number, c2: number) => void
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
    const width = (cell.colSpan ?? 1) * size
    const height = (cell.rowSpan ?? 1) * size
    return (
      <rect
        data-testid={`cell-${row}-${col}`}
        x={x} y={y} width={width} height={height}
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

export function SVGGrid({ block, grayscale, onCellClick, toolMode = 'fill', onMerge }: SVGGridProps) {
  const cellSize = CANVAS_SIZE / block.gridSize
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ row: number; col: number } | null>(null)

  function coordsToCell(e: React.MouseEvent<SVGSVGElement>) {
    const svgRect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - svgRect.left
    const y = e.clientY - svgRect.top
    const vx = (x / svgRect.width) * CANVAS_SIZE
    const vy = (y / svgRect.height) * CANVAS_SIZE
    const col = Math.floor(vx / cellSize)
    const row = Math.floor(vy / cellSize)
    return {
      row: Math.max(0, Math.min(block.gridSize - 1, row)),
      col: Math.max(0, Math.min(block.gridSize - 1, col)),
    }
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (toolMode !== 'merge') return
    const cell = coordsToCell(e)
    setDragStart(cell)
    setDragCurrent(cell)
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (toolMode !== 'merge' || !dragStart) return
    setDragCurrent(coordsToCell(e))
  }

  function handleMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (toolMode !== 'merge' || !dragStart) return
    const end = coordsToCell(e)
    // Only fire onMerge for actual drags (different start/end cell)
    if (onMerge && (end.row !== dragStart.row || end.col !== dragStart.col)) {
      onMerge(dragStart.row, dragStart.col, end.row, end.col)
    }
    setDragStart(null)
    setDragCurrent(null)
  }

  // Selection overlay bounds
  let selRect: { x: number; y: number; width: number; height: number } | null = null
  if (toolMode === 'merge' && dragStart && dragCurrent) {
    const minC = Math.min(dragStart.col, dragCurrent.col)
    const minR = Math.min(dragStart.row, dragCurrent.row)
    const maxC = Math.max(dragStart.col, dragCurrent.col)
    const maxR = Math.max(dragStart.row, dragCurrent.row)
    selRect = {
      x: minC * cellSize,
      y: minR * cellSize,
      width: (maxC - minC + 1) * cellSize,
      height: (maxR - minR + 1) * cellSize,
    }
  }

  return (
    <svg
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ border: '1px solid #999' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {block.cells.map((row, ri) =>
        row.map((cell, ci) => {
          if (cell.absorbed) return null
          return (
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
          )
        })
      )}
      {selRect && (
        <rect
          x={selRect.x}
          y={selRect.y}
          width={selRect.width}
          height={selRect.height}
          fill="var(--color-accent, #7c3aed)"
          fillOpacity={0.3}
          pointerEvents="none"
        />
      )}
    </svg>
  )
}
