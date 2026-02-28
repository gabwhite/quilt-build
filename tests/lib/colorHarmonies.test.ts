import { getHarmonies } from '../../src/lib/colorHarmonies'

test('returns complementary color', () => {
  const result = getHarmonies('#ff0000')
  expect(result.complementary).toBeDefined()
  expect(result.complementary).not.toBe('#ff0000')
})

test('returns 2 analogous colors', () => {
  const result = getHarmonies('#ff0000')
  expect(result.analogous).toHaveLength(2)
})

test('returns 2 triadic colors', () => {
  const result = getHarmonies('#ff0000')
  expect(result.triadic).toHaveLength(2)
})

test('returns neutrals array with at least one entry', () => {
  const result = getHarmonies('#ff0000')
  expect(result.neutrals.length).toBeGreaterThan(0)
})
