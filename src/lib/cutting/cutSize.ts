import type { Block } from '../../types'

export function cellFinishedSize(finishedSize: number, gridSize: number): number {
  return finishedSize / gridSize
}

export function squareCutSize(cellFinished: number): number {
  return cellFinished + 0.5
}

export function hstCutSize(cellFinished: number): number {
  return cellFinished + 1.0
}

export interface PieceGroup {
  color: string
  shape: 'square' | 'hst' | 'rect'
  cutSize: number     // for square/hst: the single cut dimension; for rect: cutHeight (strip width)
  cutWidth?: number   // rect only: piece width within the strip
  cutHeight?: number  // rect only: piece height = strip width
  count: number       // number of pieces to cut
}

export function analyzePieces(block: Block, numBlocks: number): PieceGroup[] {
  const cellSize = cellFinishedSize(block.finishedSize, block.gridSize)
  const sqCut = squareCutSize(cellSize)
  const hstCut = hstCutSize(cellSize)

  const squareCounts = new Map<string, number>()
  const hstCounts = new Map<string, number>()
  const rectCounts = new Map<string, { color: string; colSpan: number; rowSpan: number; count: number }>()

  for (const row of block.cells) {
    for (const cell of row) {
      if (cell.absorbed) continue
      if (cell.shape === 'square') {
        const colSpan = cell.colSpan ?? 1
        const rowSpan = cell.rowSpan ?? 1
        const c = cell.colors[0]
        if (colSpan > 1 || rowSpan > 1) {
          // Normalise orientation: smaller span first so 1×3 and 3×1 share the same key
          const minSpan = Math.min(colSpan, rowSpan)
          const maxSpan = Math.max(colSpan, rowSpan)
          const key = `${c}:${minSpan}:${maxSpan}`
          const existing = rectCounts.get(key)
          if (existing) {
            existing.count++
          } else {
            rectCounts.set(key, { color: c, colSpan: minSpan, rowSpan: maxSpan, count: 1 })
          }
        } else {
          squareCounts.set(c, (squareCounts.get(c) ?? 0) + 1)
        }
      } else {
        // HST: each cell contributes 1 unit per color
        // 2 same-color starting squares yield 2 HST units, so starting squares = ceil(units / 2)
        const [c0, c1] = cell.colors as [string, string]
        hstCounts.set(c0, (hstCounts.get(c0) ?? 0) + 1)
        hstCounts.set(c1, (hstCounts.get(c1) ?? 0) + 1)
      }
    }
  }

  const groups: PieceGroup[] = []

  for (const [color, count] of squareCounts) {
    groups.push({ color, shape: 'square', cutSize: sqCut, count: count * numBlocks })
  }

  for (const [color, hstUnits] of hstCounts) {
    const startingSquares = Math.ceil(hstUnits / 2)
    groups.push({ color, shape: 'hst', cutSize: hstCut, count: startingSquares * numBlocks })
  }

  for (const { color, colSpan: minSpan, rowSpan: maxSpan, count } of rectCounts.values()) {
    // cutHeight = strip width (narrower dimension); cutWidth = piece width along strip (longer)
    const cutHeight = squareCutSize(minSpan * cellSize)
    const cutWidth = squareCutSize(maxSpan * cellSize)
    groups.push({
      color,
      shape: 'rect',
      cutSize: cutHeight,  // strip width — used for sorting
      cutWidth,
      cutHeight,
      count: count * numBlocks,
    })
  }

  // Sort largest cutSize first (cut large to small)
  groups.sort((a, b) => b.cutSize - a.cutSize)

  return groups
}
