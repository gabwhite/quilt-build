// tests/lib/cutting/stripLayout.test.ts
import { calcStrips } from '../../../src/lib/cutting/stripLayout'

const FABRIC_WIDTH = 42

test('piecesPerStrip: floor(42 / 2.5) = 16', () => {
  expect(calcStrips(2.5, 35, FABRIC_WIDTH).piecesPerStrip).toBe(16)
})

test('stripCount: ceil(35 / 16) = 3', () => {
  expect(calcStrips(2.5, 35, FABRIC_WIDTH).stripCount).toBe(3)
})

test('lastStripLeftover: (16-3) * 2.5" = 32.5" when last strip has 3 pieces', () => {
  // 35 pieces: strip1=16, strip2=16, strip3=3 → leftover = (16-3)*2.5 = 32.5"
  expect(calcStrips(2.5, 35, FABRIC_WIDTH).lastStripLeftover).toBeCloseTo(32.5)
})

test('no leftover when evenly divisible', () => {
  // 32 pieces / 16 per strip = 2 strips exactly
  expect(calcStrips(2.5, 32, FABRIC_WIDTH).lastStripLeftover).toBe(0)
})

test('totalInches: stripCount * cutSize', () => {
  // 3 strips × 2.5" = 7.5"
  expect(calcStrips(2.5, 35, FABRIC_WIDTH).totalInches).toBeCloseTo(7.5)
})

test('single piece still needs one strip', () => {
  const result = calcStrips(4.5, 1, FABRIC_WIDTH)
  expect(result.stripCount).toBe(1)
  expect(result.piecesPerStrip).toBe(9) // floor(42/4.5) = 9
})
