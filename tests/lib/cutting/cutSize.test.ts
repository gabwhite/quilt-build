// tests/lib/cutting/cutSize.test.ts
import { cellFinishedSize, squareCutSize, hstCutSize, analyzePieces } from '../../../src/lib/cutting/cutSize'
import type { Block } from '../../../src/types'

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    gridSize: 4,
    finishedSize: 8,
    seamAllowance: 0.25,
    cells: Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => ({ shape: 'square' as const, colors: ['#ff0000'] as [string] }))
    ),
    ...overrides,
  }
}

test('cellFinishedSize: 8" block / 4 grid = 2"', () => {
  expect(cellFinishedSize(8, 4)).toBe(2)
})

test('squareCutSize: finished + 0.5"', () => {
  expect(squareCutSize(2)).toBe(2.5)
})

test('hstCutSize: finished + 1.0"', () => {
  expect(hstCutSize(2)).toBe(3.0)
})

test('analyzePieces: counts squares by color', () => {
  const block = makeBlock()
  const pieces = analyzePieces(block, 1)
  expect(pieces).toContainEqual(
    expect.objectContaining({ color: '#ff0000', shape: 'square', count: 16, cutSize: 2.5 })
  )
})

test('analyzePieces: scales by number of blocks', () => {
  const block = makeBlock()
  const pieces = analyzePieces(block, 6)
  const group = pieces.find((p) => p.color === '#ff0000' && p.shape === 'square')
  expect(group?.count).toBe(96) // 16 cells × 6 blocks
})

test('analyzePieces: counts HST starting squares correctly', () => {
  const cells: Block['cells'] = Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () => ({
      shape: 'hst-down' as const,
      colors: ['#ff0000', '#0000ff'] as [string, string],
    }))
  )
  const block: Block = { gridSize: 2, finishedSize: 4, seamAllowance: 0.25, cells }
  // 4 HST units of each color. Starting squares = ceil(4/2) = 2 per color.
  const pieces = analyzePieces(block, 1)
  const red = pieces.find((p) => p.color === '#ff0000' && p.shape === 'hst')
  const blue = pieces.find((p) => p.color === '#0000ff' && p.shape === 'hst')
  expect(red?.count).toBe(2)
  expect(blue?.count).toBe(2)
  expect(red?.cutSize).toBe(3.0) // 2" cell + 1.0"
})

test('analyzePieces: results sorted largest cutSize first', () => {
  const cells: Block['cells'] = [
    [
      { shape: 'square', colors: ['#ff0000'] },
      { shape: 'hst-down', colors: ['#ff0000', '#0000ff'] },
    ],
    [
      { shape: 'square', colors: ['#ff0000'] },
      { shape: 'square', colors: ['#ff0000'] },
    ],
  ]
  const block: Block = { gridSize: 2, finishedSize: 4, seamAllowance: 0.25, cells }
  const pieces = analyzePieces(block, 1)
  for (let i = 1; i < pieces.length; i++) {
    expect(pieces[i].cutSize).toBeLessThanOrEqual(pieces[i - 1].cutSize)
  }
})
