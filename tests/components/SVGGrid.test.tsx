// tests/components/SVGGrid.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SVGGrid } from '../../src/components/BlockEditor/SVGGrid'
import type { Block } from '../../src/types'

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    gridSize: 2,
    finishedSize: 4,
    seamAllowance: 0.25,
    cells: [
      [{ shape: 'square', colors: ['#ff0000'] }, { shape: 'square', colors: ['#0000ff'] }],
      [{ shape: 'hst-down', colors: ['#ff0000', '#0000ff'] }, { shape: 'square', colors: ['#ffffff'] }],
    ],
    ...overrides,
  }
}

test('renders an SVG element', () => {
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={false} onCellClick={() => {}} />)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('renders correct number of shapes for a 2x2 grid with one HST', () => {
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={false} onCellClick={() => {}} />)
  // 3 square cells = 3 rects; 1 HST cell = 2 polygons → 5 shapes total
  const rects = container.querySelectorAll('rect[data-testid]')
  const polys = container.querySelectorAll('polygon[data-testid]')
  expect(rects.length + polys.length).toBe(5)
})

test('clicking a square cell calls onCellClick with row and col', async () => {
  const onCellClick = vi.fn()
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={false} onCellClick={onCellClick} />)
  const rect = container.querySelector('rect[data-testid="cell-0-0"]')!
  await userEvent.click(rect)
  expect(onCellClick).toHaveBeenCalledWith(0, 0, undefined)
})

test('clicking an HST triangle calls onCellClick with triangle index', async () => {
  const onCellClick = vi.fn()
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={false} onCellClick={onCellClick} />)
  const tri = container.querySelector('polygon[data-testid="cell-1-0-t0"]')!
  await userEvent.click(tri)
  expect(onCellClick).toHaveBeenCalledWith(1, 0, 0)
})

test('grayscale mode desaturates fill colors', () => {
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={true} onCellClick={() => {}} />)
  const rect = container.querySelector('rect[data-testid="cell-0-0"]') as SVGRectElement
  // #ff0000 in grayscale (luminance): R=255,G=0,B=0 → 0.299*255 ≈ 76 → #4c4c4c
  expect(rect.getAttribute('fill')).toBe('#4c4c4c')
})
