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
  shape: 'square' | 'hst'
  cutSize: number  // both width and height (always square pieces)
  count: number    // number of pieces to cut
}

export function analyzePieces(block: Block, numBlocks: number): PieceGroup[] {
  const cellSize = cellFinishedSize(block.finishedSize, block.gridSize)
  const sqCut = squareCutSize(cellSize)
  const hstCut = hstCutSize(cellSize)

  const squareCounts = new Map<string, number>()
  const hstCounts = new Map<string, number>()

  for (const row of block.cells) {
    for (const cell of row) {
      if (cell.shape === 'square') {
        const c = cell.colors[0]
        squareCounts.set(c, (squareCounts.get(c) ?? 0) + 1)
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

  // Sort largest cutSize first (cut large to small)
  groups.sort((a, b) => b.cutSize - a.cutSize)

  return groups
}
