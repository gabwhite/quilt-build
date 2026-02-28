// tests/lib/cutting/scrapYield.test.ts
import { scrapYield } from '../../../src/lib/cutting/scrapYield'
import type { StripPlan } from '../../../src/lib/cutting/stripLayout'
import type { PieceGroup } from '../../../src/lib/cutting/cutSize'

function makePlan(overrides: Partial<StripPlan> = {}): StripPlan {
  return {
    cutSize: 2.5, count: 35, piecesPerStrip: 16,
    stripCount: 3, lastStripLeftover: 32.5, totalInches: 7.5,
    ...overrides,
  }
}

test('no suggestions when no leftover', () => {
  const result = scrapYield(makePlan({ lastStripLeftover: 0 }), [])
  expect(result.suggestions).toHaveLength(0)
})

test('suggests smaller pieces that fit in the leftover length', () => {
  // leftover: 32.5" long × 2.5" wide strip
  // a 2.0" piece fits in 2.5" width: floor(32.5 / 2.0) = 16 pieces
  const plan = makePlan({ lastStripLeftover: 32.5, cutSize: 2.5 })
  const smallerPieces: PieceGroup[] = [
    { color: '#ff0000', shape: 'square', cutSize: 2.0, count: 100 },
  ]
  const result = scrapYield(plan, smallerPieces)
  expect(result.suggestions).toContainEqual(
    expect.objectContaining({ cutSize: 2.0, yield: 16 })
  )
})

test('does not suggest pieces that do not fit in strip width', () => {
  // leftover: 10" long × 2.5" wide; a 3.0" piece does NOT fit in 2.5" width
  const plan = makePlan({ lastStripLeftover: 10, cutSize: 2.5 })
  const largerPieces: PieceGroup[] = [
    { color: '#ff0000', shape: 'square', cutSize: 3.0, count: 10 },
  ]
  const result = scrapYield(plan, largerPieces)
  expect(result.suggestions).toHaveLength(0)
})

test('does not suggest pieces with zero yield', () => {
  // leftover: 1" long × 2.5" wide; a 2.0" piece would yield floor(1/2.0) = 0
  const plan = makePlan({ lastStripLeftover: 1.0, cutSize: 2.5 })
  const pieces: PieceGroup[] = [
    { color: '#ff0000', shape: 'square', cutSize: 2.0, count: 10 },
  ]
  const result = scrapYield(plan, pieces)
  expect(result.suggestions).toHaveLength(0)
})
