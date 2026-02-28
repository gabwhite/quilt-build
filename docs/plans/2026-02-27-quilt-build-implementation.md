# Quilt Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based quilt design app with a grid block editor, quilt assembler, and fabric cutting plan calculator.

**Architecture:** Vite + React SPA with SVG rendering for block and quilt editors. Pure functions for all cutting plan math, tested in isolation with Vitest. Zustand for shared app state. No backend — LocalStorage auto-saves on every state change, JSON download/upload for project persistence, @react-pdf/renderer for PDF export.

**Tech Stack:** Vite 5, React 18, TypeScript, Zustand 4, tinycolor2, colorthief, @react-pdf/renderer, Vitest, @testing-library/react, @testing-library/jest-dom

---

## File Structure

```
src/
  types/index.ts
  store/useQuiltStore.ts
  lib/
    cutting/cutSize.ts
    cutting/stripLayout.ts
    cutting/scrapYield.ts
    colorHarmonies.ts
  components/
    Nav.tsx
    Layout.tsx
    BlockEditor/
      BlockEditor.tsx
      SVGGrid.tsx
    ColorPanel/
      ColorPanel.tsx
      HarmonyPanel.tsx
      FabricPhotoImport.tsx
    QuiltAssembler/
      QuiltAssembler.tsx
      QuiltGrid.tsx
    CuttingPlan/
      CuttingPlan.tsx
      CuttingSection.tsx
  App.tsx
  main.tsx
  test-setup.ts
tests/
  lib/
    cutting/cutSize.test.ts
    cutting/stripLayout.test.ts
    cutting/scrapYield.test.ts
    colorHarmonies.test.ts
  components/
    Nav.test.tsx
    SVGGrid.test.tsx
```

---

### Task 1: Project Scaffolding

**Files:** Project root

**Step 1: Scaffold the project**

Run from `/Users/gabwhite/Dropbox (Personal)/websites/`:
```bash
npm create vite@latest quilt-build -- --template react-ts
cd quilt-build
npm install
```

**Step 2: Install runtime dependencies**
```bash
npm install zustand tinycolor2 colorthief @react-pdf/renderer
```

**Step 3: Install dev dependencies**
```bash
npm install -D @types/tinycolor2 vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 4: Configure Vitest in `vite.config.ts`**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

**Step 5: Create `src/test-setup.ts`**
```ts
import '@testing-library/jest-dom'
```

**Step 6: Add test script to `package.json`**

Add to the `scripts` block:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 7: Clean up Vite boilerplate**

Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`
Clear contents of `src/index.css` (keep the file).

**Step 8: Verify Vitest starts**
```bash
npm test
```
Expected: Vitest starts, reports no test files found (OK).

**Step 9: Commit**
```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project with Vitest"
```

---

### Task 2: Define Data Model Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create the types file**
```ts
// src/types/index.ts

export type CellShape = 'square' | 'hst-down' | 'hst-up'
// hst-down: diagonal from top-left → bottom-right
// hst-up:   diagonal from top-right → bottom-left

export interface Cell {
  shape: CellShape
  // square: one color; HST: [top triangle color, bottom triangle color]
  colors: [string] | [string, string]
}

export interface Block {
  gridSize: number      // grid is gridSize × gridSize cells
  finishedSize: number  // finished block size in inches (e.g. 12)
  seamAllowance: number // default 0.25
  cells: Cell[][]       // [row][col], gridSize × gridSize
}

export interface QuiltSettings {
  blocksWide: number
  blocksTall: number
  borderWidth: number    // 0 = no border; in inches
  rotations: number[][]  // rotation degrees per block [row][col]
}

export interface Project {
  block: Block
  quiltSettings: QuiltSettings
  palette: string[]    // hex strings, e.g. "#3a7bd5"
  grayscale: boolean   // contrast check mode
}

export type ToolMode = 'fill' | 'hst'
// fill: clicking a cell/triangle fills it with active color
// hst:  clicking cycles cell shape: square → hst-down → hst-up → square
```

**Step 2: Commit**
```bash
git add src/types/index.ts
git commit -m "feat: define core data model types"
```

---

### Task 3: Zustand Store

**Files:**
- Create: `src/store/useQuiltStore.ts`

**Step 1: Create the store**
```ts
// src/store/useQuiltStore.ts
import { create } from 'zustand'
import type { Block, Cell, Project, QuiltSettings, ToolMode } from '../types'

function makeEmptyGrid(size: number): Cell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (): Cell => ({
      shape: 'square',
      colors: ['#ffffff'],
    }))
  )
}

function makeRotations(tall: number, wide: number): number[][] {
  return Array.from({ length: tall }, () => Array(wide).fill(0))
}

const DEFAULT_BLOCK: Block = {
  gridSize: 8,
  finishedSize: 12,
  seamAllowance: 0.25,
  cells: makeEmptyGrid(8),
}

const DEFAULT_QUILT: QuiltSettings = {
  blocksWide: 4,
  blocksTall: 5,
  borderWidth: 0,
  rotations: makeRotations(5, 4),
}

interface QuiltStore extends Project {
  activeColor: string
  toolMode: ToolMode

  // Block
  setGridSize: (size: number) => void
  setFinishedSize: (size: number) => void
  setSeamAllowance: (sa: number) => void
  fillCell: (row: number, col: number, color: string) => void
  fillHSTTriangle: (row: number, col: number, idx: 0 | 1, color: string) => void
  cycleHST: (row: number, col: number) => void
  clearBlock: () => void

  // Palette + tool
  addColor: (color: string) => void
  removeColor: (color: string) => void
  setActiveColor: (color: string) => void
  setToolMode: (mode: ToolMode) => void
  setGrayscale: (on: boolean) => void

  // Quilt
  setBlocksWide: (n: number) => void
  setBlocksTall: (n: number) => void
  setBorderWidth: (w: number) => void
  setBlockRotation: (row: number, col: number, deg: number) => void

  // Persistence
  loadProject: (project: Project) => void
}

export const useQuiltStore = create<QuiltStore>((set) => ({
  block: DEFAULT_BLOCK,
  quiltSettings: DEFAULT_QUILT,
  palette: ['#ffffff', '#000000'],
  grayscale: false,
  activeColor: '#000000',
  toolMode: 'fill',

  setGridSize: (size) =>
    set((s) => ({ block: { ...s.block, gridSize: size, cells: makeEmptyGrid(size) } })),

  setFinishedSize: (size) =>
    set((s) => ({ block: { ...s.block, finishedSize: size } })),

  setSeamAllowance: (sa) =>
    set((s) => ({ block: { ...s.block, seamAllowance: sa } })),

  fillCell: (row, col, color) =>
    set((s) => {
      const cells = s.block.cells.map((r) => [...r])
      cells[row][col] = { ...cells[row][col], colors: [color] }
      return { block: { ...s.block, cells } }
    }),

  fillHSTTriangle: (row, col, idx, color) =>
    set((s) => {
      const cells = s.block.cells.map((r) => [...r])
      const cell = { ...cells[row][col] }
      const colors = [...cell.colors] as [string, string]
      colors[idx] = color
      cell.colors = colors
      cells[row][col] = cell
      return { block: { ...s.block, cells } }
    }),

  cycleHST: (row, col) =>
    set((s) => {
      const cells = s.block.cells.map((r) => [...r])
      const cell = { ...cells[row][col] }
      if (cell.shape === 'square') {
        cell.shape = 'hst-down'
        cell.colors = [cell.colors[0], '#ffffff']
      } else if (cell.shape === 'hst-down') {
        cell.shape = 'hst-up'
      } else {
        cell.shape = 'square'
        cell.colors = [cell.colors[0]]
      }
      cells[row][col] = cell
      return { block: { ...s.block, cells } }
    }),

  clearBlock: () =>
    set((s) => ({ block: { ...s.block, cells: makeEmptyGrid(s.block.gridSize) } })),

  addColor: (color) =>
    set((s) => ({
      palette: s.palette.includes(color) ? s.palette : [...s.palette, color],
    })),

  removeColor: (color) =>
    set((s) => ({ palette: s.palette.filter((c) => c !== color) })),

  setActiveColor: (color) => set({ activeColor: color }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setGrayscale: (on) => set({ grayscale: on }),

  setBlocksWide: (n) =>
    set((s) => ({
      quiltSettings: {
        ...s.quiltSettings,
        blocksWide: n,
        rotations: makeRotations(s.quiltSettings.blocksTall, n),
      },
    })),

  setBlocksTall: (n) =>
    set((s) => ({
      quiltSettings: {
        ...s.quiltSettings,
        blocksTall: n,
        rotations: makeRotations(n, s.quiltSettings.blocksWide),
      },
    })),

  setBorderWidth: (w) =>
    set((s) => ({ quiltSettings: { ...s.quiltSettings, borderWidth: w } })),

  setBlockRotation: (row, col, deg) =>
    set((s) => {
      const rotations = s.quiltSettings.rotations.map((r) => [...r])
      rotations[row][col] = deg
      return { quiltSettings: { ...s.quiltSettings, rotations } }
    }),

  loadProject: (project) => set(project),
}))
```

**Step 2: Commit**
```bash
git add src/store/useQuiltStore.ts
git commit -m "feat: add Zustand store with all actions"
```

---

### Task 4: App Layout + Navigation

**Files:**
- Create: `src/components/Nav.tsx`
- Create: `src/components/Layout.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `tests/components/Nav.test.tsx`

**Step 1: Write the failing test**
```tsx
// tests/components/Nav.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Nav } from '../../src/components/Nav'

test('renders all three nav tabs', () => {
  render(<Nav view="editor" onChange={() => {}} />)
  expect(screen.getByText('Block Editor')).toBeInTheDocument()
  expect(screen.getByText('Quilt Assembler')).toBeInTheDocument()
  expect(screen.getByText('Cutting Plan')).toBeInTheDocument()
})

test('calls onChange with correct view when tab clicked', async () => {
  const onChange = vi.fn()
  render(<Nav view="editor" onChange={onChange} />)
  await userEvent.click(screen.getByText('Quilt Assembler'))
  expect(onChange).toHaveBeenCalledWith('assembler')
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/components/Nav.test.tsx
```
Expected: FAIL — `Nav` not found.

**Step 3: Create `src/components/Nav.tsx`**
```tsx
type View = 'editor' | 'assembler' | 'cutting'

interface NavProps {
  view: View
  onChange: (v: View) => void
}

export function Nav({ view, onChange }: NavProps) {
  const tabs: { id: View; label: string }[] = [
    { id: 'editor', label: 'Block Editor' },
    { id: 'assembler', label: 'Quilt Assembler' },
    { id: 'cutting', label: 'Cutting Plan' },
  ]
  return (
    <nav style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{ fontWeight: view === tab.id ? 'bold' : 'normal' }}
          aria-current={view === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/components/Nav.test.tsx
```
Expected: PASS

**Step 5: Create `src/components/Layout.tsx`**
```tsx
import { ReactNode } from 'react'
import { Nav } from './Nav'

type View = 'editor' | 'assembler' | 'cutting'

export function Layout({
  view,
  onViewChange,
  children,
}: {
  view: View
  onViewChange: (v: View) => void
  children: ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav view={view} onChange={onViewChange} />
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  )
}
```

**Step 6: Update `src/App.tsx`**
```tsx
import { useState } from 'react'
import { Layout } from './components/Layout'

type View = 'editor' | 'assembler' | 'cutting'

export default function App() {
  const [view, setView] = useState<View>('editor')
  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'editor' && <div>Block Editor (coming soon)</div>}
      {view === 'assembler' && <div>Quilt Assembler (coming soon)</div>}
      {view === 'cutting' && <div>Cutting Plan (coming soon)</div>}
    </Layout>
  )
}
```

**Step 7: Update `src/main.tsx`**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

**Step 8: Verify in browser**
```bash
npm run dev
```
Expected: Three nav tabs render. Clicking each shows the placeholder text.

**Step 9: Commit**
```bash
git add src/ tests/
git commit -m "feat: add app layout and navigation"
```

---

### Task 5: SVG Grid Component (read-only rendering)

**Files:**
- Create: `src/components/BlockEditor/SVGGrid.tsx`
- Create: `tests/components/SVGGrid.test.tsx`

**Step 1: Write the failing test**
```tsx
// tests/components/SVGGrid.test.tsx
import { render, screen } from '@testing-library/react'
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

test('renders correct number of cells', () => {
  const { container } = render(<SVGGrid block={makeBlock()} grayscale={false} onCellClick={() => {}} />)
  // 2x2 grid: 2 squares + 1 hst (2 polygons) + 1 square = 5 shapes total
  const rects = container.querySelectorAll('rect[data-testid]')
  const polys = container.querySelectorAll('polygon[data-testid]')
  expect(rects.length + polys.length).toBe(5)
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/components/SVGGrid.test.tsx
```
Expected: FAIL — `SVGGrid` not found.

**Step 3: Create `src/components/BlockEditor/SVGGrid.tsx`**
```tsx
import type { Block, Cell } from '../../types'

const CANVAS_SIZE = 400 // px

interface SVGGridProps {
  block: Block
  grayscale: boolean
  onCellClick: (row: number, col: number, triangleIdx?: 0 | 1) => void
}

function toGray(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const h = lum.toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

function resolveColor(hex: string, grayscale: boolean) {
  return grayscale ? toGray(hex) : hex
}

interface CellProps {
  cell: Cell
  x: number
  y: number
  size: number
  grayscale: boolean
  row: number
  col: number
  onClick: (row: number, col: number, idx?: 0 | 1) => void
}

function CellShape({ cell, x, y, size, grayscale, row, col, onClick }: CellProps) {
  if (cell.shape === 'square') {
    return (
      <rect
        data-testid={`cell-${row}-${col}`}
        x={x} y={y} width={size} height={size}
        fill={resolveColor(cell.colors[0], grayscale)}
        stroke="#ccc" strokeWidth={0.5}
        style={{ cursor: 'pointer' }}
        onClick={() => onClick(row, col)}
      />
    )
  }

  // HST: two triangles
  const [c0, c1] = cell.colors as [string, string]
  let t1Points: string, t2Points: string

  if (cell.shape === 'hst-down') {
    // diagonal: top-left → bottom-right
    t1Points = `${x},${y} ${x + size},${y} ${x},${y + size}`          // top-left triangle
    t2Points = `${x + size},${y} ${x + size},${y + size} ${x},${y + size}` // bottom-right triangle
  } else {
    // hst-up: diagonal: top-right → bottom-left
    t1Points = `${x},${y} ${x + size},${y} ${x + size},${y + size}`        // top-right triangle
    t2Points = `${x},${y} ${x + size},${y + size} ${x},${y + size}`        // bottom-left triangle
  }

  return (
    <>
      <polygon
        data-testid={`cell-${row}-${col}-t0`}
        points={t1Points}
        fill={resolveColor(c0, grayscale)}
        stroke="#ccc" strokeWidth={0.5}
        style={{ cursor: 'pointer' }}
        onClick={() => onClick(row, col, 0)}
      />
      <polygon
        data-testid={`cell-${row}-${col}-t1`}
        points={t2Points}
        fill={resolveColor(c1, grayscale)}
        stroke="#ccc" strokeWidth={0.5}
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
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/components/SVGGrid.test.tsx
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/BlockEditor/SVGGrid.tsx tests/components/SVGGrid.test.tsx
git commit -m "feat: add SVG grid renderer with HST support"
```

---

### Task 6: Block Editor Component (wires grid + store)

**Files:**
- Create: `src/components/BlockEditor/BlockEditor.tsx`
- Modify: `src/App.tsx`

**Step 1: Create `src/components/BlockEditor/BlockEditor.tsx`**
```tsx
import { useQuiltStore } from '../../store/useQuiltStore'
import { SVGGrid } from './SVGGrid'

export function BlockEditor() {
  const { block, grayscale, activeColor, toolMode, fillCell, fillHSTTriangle, cycleHST,
    setGridSize, setFinishedSize, setSeamAllowance, clearBlock, setGrayscale, setToolMode } = useQuiltStore()

  function handleCellClick(row: number, col: number, triangleIdx?: 0 | 1) {
    if (toolMode === 'hst') {
      cycleHST(row, col)
    } else {
      // fill mode
      const cell = block.cells[row][col]
      if (cell.shape === 'square') {
        fillCell(row, col, activeColor)
      } else if (triangleIdx !== undefined) {
        fillHSTTriangle(row, col, triangleIdx, activeColor)
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div>
        <SVGGrid block={block} grayscale={grayscale} onCellClick={handleCellClick} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
        <label>
          Grid size
          <select value={block.gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
            {[4, 6, 8, 12].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
          </select>
        </label>
        <label>
          Finished block size (in)
          <input type="number" value={block.finishedSize} min={1} step={0.5}
            onChange={(e) => setFinishedSize(Number(e.target.value))} />
        </label>
        <label>
          Seam allowance (in)
          <input type="number" value={block.seamAllowance} min={0.125} step={0.125}
            onChange={(e) => setSeamAllowance(Number(e.target.value))} />
        </label>
        <div>
          <strong>Tool</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setToolMode('fill')} style={{ fontWeight: toolMode === 'fill' ? 'bold' : 'normal' }}>
              Fill
            </button>
            <button onClick={() => setToolMode('hst')} style={{ fontWeight: toolMode === 'hst' ? 'bold' : 'normal' }}>
              Toggle HST
            </button>
          </div>
        </div>
        <label>
          <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
          {' '}Grayscale contrast check
        </label>
        <button onClick={clearBlock}>Clear block</button>
      </div>
    </div>
  )
}
```

**Step 2: Update `src/App.tsx` to use BlockEditor**
```tsx
import { useState } from 'react'
import { Layout } from './components/Layout'
import { BlockEditor } from './components/BlockEditor/BlockEditor'

type View = 'editor' | 'assembler' | 'cutting'

export default function App() {
  const [view, setView] = useState<View>('editor')
  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'editor' && <BlockEditor />}
      {view === 'assembler' && <div>Quilt Assembler (coming soon)</div>}
      {view === 'cutting' && <div>Cutting Plan (coming soon)</div>}
    </Layout>
  )
}
```

**Step 3: Verify in browser** — grid renders, clicking cells fills them, HST toggle works.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: wire block editor with store and tool modes"
```

---

### Task 7: Color Panel — Direct Picker + Palette

**Files:**
- Create: `src/components/ColorPanel/ColorPanel.tsx`
- Modify: `src/components/BlockEditor/BlockEditor.tsx`

**Step 1: Create `src/components/ColorPanel/ColorPanel.tsx`**
```tsx
import { useQuiltStore } from '../../store/useQuiltStore'

export function ColorPanel() {
  const { palette, activeColor, addColor, removeColor, setActiveColor } = useQuiltStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <strong>Colors</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {palette.map((color) => (
          <div key={color} style={{ position: 'relative' }}>
            <button
              aria-label={`Select color ${color}`}
              onClick={() => setActiveColor(color)}
              style={{
                width: 36, height: 36,
                backgroundColor: color,
                border: color === activeColor ? '3px solid #333' : '1px solid #999',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />
            <button
              aria-label={`Remove color ${color}`}
              onClick={() => removeColor(color)}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 16, height: 16, borderRadius: '50%',
                fontSize: 10, lineHeight: '14px', textAlign: 'center',
                border: '1px solid #999', background: '#fff', cursor: 'pointer',
              }}
            >×</button>
          </div>
        ))}
      </div>
      <label>
        Add color
        <input
          type="color"
          onChange={(e) => {
            addColor(e.target.value)
            setActiveColor(e.target.value)
          }}
          style={{ marginLeft: 8 }}
        />
      </label>
    </div>
  )
}
```

**Step 2: Add ColorPanel to BlockEditor layout**

In `BlockEditor.tsx`, import and render `<ColorPanel />` below the tool buttons:
```tsx
import { ColorPanel } from '../ColorPanel/ColorPanel'
// ...inside the controls column:
<ColorPanel />
```

**Step 3: Verify in browser** — swatches appear, clicking selects active color, color picker adds new colors.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: add color palette panel with direct color picker"
```

---

### Task 8: Color Harmonies (tinycolor2)

**Files:**
- Create: `src/lib/colorHarmonies.ts`
- Create: `tests/lib/colorHarmonies.test.ts`
- Create: `src/components/ColorPanel/HarmonyPanel.tsx`

**Step 1: Write the failing tests**
```ts
// tests/lib/colorHarmonies.test.ts
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

test('returns neutrals array', () => {
  const result = getHarmonies('#ff0000')
  expect(result.neutrals.length).toBeGreaterThan(0)
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/lib/colorHarmonies.test.ts
```

**Step 3: Create `src/lib/colorHarmonies.ts`**
```ts
import tinycolor from 'tinycolor2'

export interface Harmonies {
  complementary: string
  analogous: [string, string]
  triadic: [string, string]
  neutrals: string[]
}

export function getHarmonies(hex: string): Harmonies {
  const base = tinycolor(hex)

  const [, a1, a2] = base.analogous()
  const [, t1, t2] = base.triad()

  return {
    complementary: tinycolor.complement(hex).toHexString(),
    analogous: [a1.toHexString(), a2.toHexString()],
    triadic: [t1.toHexString(), t2.toHexString()],
    neutrals: [
      tinycolor(hex).desaturate(80).toHexString(),
      tinycolor(hex).desaturate(60).toHexString(),
      tinycolor(hex).lighten(40).desaturate(60).toHexString(),
    ],
  }
}
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/lib/colorHarmonies.test.ts
```

**Step 5: Create `src/components/ColorPanel/HarmonyPanel.tsx`**
```tsx
import { getHarmonies } from '../../lib/colorHarmonies'
import { useQuiltStore } from '../../store/useQuiltStore'

export function HarmonyPanel() {
  const { activeColor, addColor, setActiveColor } = useQuiltStore()
  const harmonies = getHarmonies(activeColor)

  const groups = [
    { label: 'Complementary', colors: [harmonies.complementary] },
    { label: 'Analogous', colors: harmonies.analogous },
    { label: 'Triadic', colors: harmonies.triadic },
    { label: 'Neutrals', colors: harmonies.neutrals },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong>Suggestions for {activeColor}</strong>
      {groups.map(({ label, colors }) => (
        <div key={label}>
          <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {colors.map((c) => (
              <button
                key={c}
                title={`Add ${c}`}
                onClick={() => { addColor(c); setActiveColor(c) }}
                style={{
                  width: 28, height: 28, backgroundColor: c,
                  border: '1px solid #999', borderRadius: 3, cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 6: Add HarmonyPanel to ColorPanel**

In `ColorPanel.tsx`, import and render `<HarmonyPanel />` below the palette swatches.

**Step 7: Verify in browser** — selecting a color shows harmony suggestions; clicking adds to palette.

**Step 8: Commit**
```bash
git add src/ tests/
git commit -m "feat: add color harmony suggestions via tinycolor2"
```

---

### Task 9: Fabric Photo Import + Color Sampling

**Files:**
- Create: `src/components/ColorPanel/FabricPhotoImport.tsx`

**Step 1: Create `src/components/ColorPanel/FabricPhotoImport.tsx`**
```tsx
import { useRef, useState } from 'react'
import ColorThief from 'colorthief'
import { useQuiltStore } from '../../store/useQuiltStore'

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function FabricPhotoImport() {
  const { addColor, setActiveColor } = useQuiltStore()
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const px = ctx.getImageData(Math.floor(x * scaleX), Math.floor(y * scaleY), 1, 1).data
    const hex = rgbToHex(px[0], px[1], px[2])
    addColor(hex)
    setActiveColor(hex)
  }

  function handleExtractDominant() {
    const img = imgRef.current
    if (!img) return
    const thief = new ColorThief()
    const palette = thief.getPalette(img, 5) as [number, number, number][]
    palette.forEach(([r, g, b]) => {
      const hex = rgbToHex(r, g, b)
      addColor(hex)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong>Import Fabric Photo</strong>
      <input type="file" accept="image/*" onChange={handleFile} />
      {imgSrc && (
        <>
          <p style={{ fontSize: 12, color: '#666' }}>Click anywhere on the photo to sample that color.</p>
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Fabric photo"
            crossOrigin="anonymous"
            style={{ maxWidth: 240, cursor: 'crosshair', border: '1px solid #ccc' }}
            onClick={handleImageClick}
          />
          <button onClick={handleExtractDominant}>Extract 5 dominant colors</button>
        </>
      )}
    </div>
  )
}
```

**Step 2: Add FabricPhotoImport to ColorPanel**

In `ColorPanel.tsx`, import and render `<FabricPhotoImport />` at the bottom.

**Step 3: Verify in browser** — upload a photo, click to sample colors, extract dominant colors.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: add fabric photo color sampler and dominant color extraction"
```

---

### Task 10: Quilt Assembler

**Files:**
- Create: `src/components/QuiltAssembler/QuiltGrid.tsx`
- Create: `src/components/QuiltAssembler/QuiltAssembler.tsx`
- Modify: `src/App.tsx`

**Step 1: Create `src/components/QuiltAssembler/QuiltGrid.tsx`**
```tsx
import { Block } from '../../types'
import { SVGGrid } from '../BlockEditor/SVGGrid'

const BLOCK_PREVIEW_SIZE = 80 // px per block in the quilt preview

interface QuiltGridProps {
  block: Block
  blocksWide: number
  blocksTall: number
  rotations: number[][]
  borderWidth: number
  grayscale: boolean
}

export function QuiltGrid({ block, blocksWide, blocksTall, rotations, borderWidth, grayscale }: QuiltGridProps) {
  const totalW = blocksWide * BLOCK_PREVIEW_SIZE + borderWidth * 2 * (BLOCK_PREVIEW_SIZE / block.finishedSize)
  const totalH = blocksTall * BLOCK_PREVIEW_SIZE + borderWidth * 2 * (BLOCK_PREVIEW_SIZE / block.finishedSize)
  const borderPx = borderWidth * (BLOCK_PREVIEW_SIZE / block.finishedSize)
  const finishedW = blocksWide * block.finishedSize + borderWidth * 2
  const finishedH = blocksTall * block.finishedSize + borderWidth * 2

  return (
    <div>
      <p>Finished size: {finishedW}" × {finishedH}"</p>
      <svg width={totalW} height={totalH} style={{ border: '1px solid #999' }}>
        {borderPx > 0 && (
          <rect x={0} y={0} width={totalW} height={totalH} fill="#f0f0f0" />
        )}
        {Array.from({ length: blocksTall }, (_, ri) =>
          Array.from({ length: blocksWide }, (_, ci) => {
            const rotation = rotations[ri]?.[ci] ?? 0
            const cx = borderPx + ci * BLOCK_PREVIEW_SIZE + BLOCK_PREVIEW_SIZE / 2
            const cy = borderPx + ri * BLOCK_PREVIEW_SIZE + BLOCK_PREVIEW_SIZE / 2
            return (
              <g key={`${ri}-${ci}`} transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                <foreignObject
                  x={borderPx + ci * BLOCK_PREVIEW_SIZE}
                  y={borderPx + ri * BLOCK_PREVIEW_SIZE}
                  width={BLOCK_PREVIEW_SIZE}
                  height={BLOCK_PREVIEW_SIZE}
                >
                  <SVGGrid block={block} grayscale={grayscale} onCellClick={() => {}} />
                </foreignObject>
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}
```

**Step 2: Create `src/components/QuiltAssembler/QuiltAssembler.tsx`**
```tsx
import { useQuiltStore } from '../../store/useQuiltStore'
import { QuiltGrid } from './QuiltGrid'

export function QuiltAssembler() {
  const { block, quiltSettings, grayscale,
    setBlocksWide, setBlocksTall, setBorderWidth, setBlockRotation } = useQuiltStore()
  const { blocksWide, blocksTall, borderWidth, rotations } = quiltSettings

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <QuiltGrid
        block={block}
        blocksWide={blocksWide}
        blocksTall={blocksTall}
        rotations={rotations}
        borderWidth={borderWidth}
        grayscale={grayscale}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Blocks wide
          <input type="number" value={blocksWide} min={1}
            onChange={(e) => setBlocksWide(Number(e.target.value))} />
        </label>
        <label>
          Blocks tall
          <input type="number" value={blocksTall} min={1}
            onChange={(e) => setBlocksTall(Number(e.target.value))} />
        </label>
        <label>
          Border width (in)
          <input type="number" value={borderWidth} min={0} step={0.5}
            onChange={(e) => setBorderWidth(Number(e.target.value))} />
        </label>
        <div>
          <strong>Block rotations</strong>
          <p style={{ fontSize: 12, color: '#666' }}>Row, Col → degrees</p>
          {Array.from({ length: blocksTall }, (_, ri) =>
            Array.from({ length: blocksWide }, (_, ci) => (
              <label key={`${ri}-${ci}`} style={{ display: 'block', fontSize: 12 }}>
                [{ri},{ci}]
                <select
                  value={rotations[ri]?.[ci] ?? 0}
                  onChange={(e) => setBlockRotation(ri, ci, Number(e.target.value))}
                >
                  {[0, 90, 180, 270].map((d) => <option key={d} value={d}>{d}°</option>)}
                </select>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Update `src/App.tsx`**
```tsx
import { QuiltAssembler } from './components/QuiltAssembler/QuiltAssembler'
// in JSX:
{view === 'assembler' && <QuiltAssembler />}
```

**Step 4: Verify in browser** — quilt grid renders, controls update layout and finished size.

**Step 5: Commit**
```bash
git add src/
git commit -m "feat: add quilt assembler with tiling, rotation, and border"
```

---

### Task 11: Cut Size Calculator (Pure Functions)

**Files:**
- Create: `src/lib/cutting/cutSize.ts`
- Create: `tests/lib/cutting/cutSize.test.ts`

**Step 1: Write the failing tests**
```ts
// tests/lib/cutting/cutSize.test.ts
import { cellFinishedSize, squareCutSize, hstCutSize, analyzePieces, PieceGroup } from '../../../src/lib/cutting/cutSize'
import type { Block } from '../../../src/types'

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    gridSize: 4,
    finishedSize: 8,
    seamAllowance: 0.25,
    cells: Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => ({ shape: 'square' as const, colors: ['#ff0000'] }))
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
  const cells = Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () => ({ shape: 'hst-down' as const, colors: ['#ff0000', '#0000ff'] as [string, string] }))
  )
  const block: Block = { gridSize: 2, finishedSize: 4, seamAllowance: 0.25, cells }
  // 4 HST cells, each needs 1 starting square per color
  // 4 cells × 2 colors = 4 squares each color, but 2 HSTs per pair → need ceil(4/2)=2 squares each
  const pieces = analyzePieces(block, 1)
  const red = pieces.find((p) => p.color === '#ff0000' && p.shape === 'hst')
  const blue = pieces.find((p) => p.color === '#0000ff' && p.shape === 'hst')
  expect(red?.count).toBe(2) // 4 HST units ÷ 2 per starting square pair
  expect(blue?.count).toBe(2)
  expect(red?.cutSize).toBe(3.0) // 2" cell + 1.0"
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/lib/cutting/cutSize.test.ts
```

**Step 3: Create `src/lib/cutting/cutSize.ts`**
```ts
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
  cutSize: number  // in inches — both width and height (always square)
  count: number    // number of pieces to cut
}

export function analyzePieces(block: Block, numBlocks: number): PieceGroup[] {
  const cellSize = cellFinishedSize(block.finishedSize, block.gridSize)
  const sqCut = squareCutSize(cellSize)
  const hstCut = hstCutSize(cellSize)

  // Count raw HST units per color (each HST cell contributes 1 unit per color)
  const squareCounts = new Map<string, number>()
  const hstCounts = new Map<string, number>()

  for (const row of block.cells) {
    for (const cell of row) {
      if (cell.shape === 'square') {
        const c = cell.colors[0]
        squareCounts.set(c, (squareCounts.get(c) ?? 0) + 1)
      } else {
        // HST: each pair of same-fabric starting squares yields 2 HST units
        // so starting squares needed = ceil(hstUnits / 2)
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

  // Sort largest cutSize first
  groups.sort((a, b) => b.cutSize - a.cutSize)

  return groups
}
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/lib/cutting/cutSize.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/cutting/cutSize.ts tests/lib/cutting/cutSize.test.ts
git commit -m "feat: add cut size calculator with TDD"
```

---

### Task 12: Strip Layout Calculator (Pure Functions)

**Files:**
- Create: `src/lib/cutting/stripLayout.ts`
- Create: `tests/lib/cutting/stripLayout.test.ts`

**Step 1: Write the failing tests**
```ts
// tests/lib/cutting/stripLayout.test.ts
import { calcStrips, StripPlan } from '../../../src/lib/cutting/stripLayout'

const FABRIC_WIDTH = 42

test('calcStrips: correct pieces per strip', () => {
  // 42" / 2.5" = 16 pieces per strip (floor)
  const result = calcStrips(2.5, 35, FABRIC_WIDTH)
  expect(result.piecesPerStrip).toBe(16)
})

test('calcStrips: correct number of strips', () => {
  // 35 pieces / 16 per strip = 3 strips (ceil)
  const result = calcStrips(2.5, 35, FABRIC_WIDTH)
  expect(result.stripCount).toBe(3)
})

test('calcStrips: leftover from last strip', () => {
  // 35 pieces: strip1=16, strip2=16, strip3=3 → leftover = (16-3) * 2.5" = 32.5"
  const result = calcStrips(2.5, 35, FABRIC_WIDTH)
  expect(result.lastStripLeftover).toBeCloseTo(32.5, 5)
})

test('calcStrips: no leftover when evenly divisible', () => {
  // 32 pieces / 16 per strip = 2 strips exactly, no leftover
  const result = calcStrips(2.5, 32, FABRIC_WIDTH)
  expect(result.lastStripLeftover).toBe(0)
})

test('calcStrips: total yardage in inches', () => {
  // 3 strips × 2.5" strip width = 7.5" total fabric length
  const result = calcStrips(2.5, 35, FABRIC_WIDTH)
  expect(result.totalInches).toBeCloseTo(7.5, 5)
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/lib/cutting/stripLayout.test.ts
```

**Step 3: Create `src/lib/cutting/stripLayout.ts`**
```ts
export interface StripPlan {
  cutSize: number       // piece cut size (strip width)
  count: number         // total pieces needed
  piecesPerStrip: number
  stripCount: number
  lastStripLeftover: number  // leftover length (inches) from last strip
  totalInches: number        // total fabric length consumed (inches)
}

export function calcStrips(cutSize: number, count: number, fabricWidth: number): StripPlan {
  const piecesPerStrip = Math.floor(fabricWidth / cutSize)
  const stripCount = Math.ceil(count / piecesPerStrip)
  const piecesInLastStrip = count % piecesPerStrip || piecesPerStrip
  const lastStripLeftover =
    piecesInLastStrip === piecesPerStrip ? 0 : (piecesPerStrip - piecesInLastStrip) * cutSize
  const totalInches = stripCount * cutSize

  return { cutSize, count, piecesPerStrip, stripCount, lastStripLeftover, totalInches }
}
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/lib/cutting/stripLayout.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/cutting/stripLayout.ts tests/lib/cutting/stripLayout.test.ts
git commit -m "feat: add strip layout calculator with TDD"
```

---

### Task 13: Scrap Yield Calculator (Pure Functions)

**Files:**
- Create: `src/lib/cutting/scrapYield.ts`
- Create: `tests/lib/cutting/scrapYield.test.ts`

**Step 1: Write the failing tests**
```ts
// tests/lib/cutting/scrapYield.test.ts
import { scrapYield, ScrapYield } from '../../../src/lib/cutting/scrapYield'
import type { StripPlan } from '../../../src/lib/cutting/stripLayout'
import type { PieceGroup } from '../../../src/lib/cutting/cutSize'

function makePlan(overrides: Partial<StripPlan> = {}): StripPlan {
  return {
    cutSize: 2.5, count: 35, piecesPerStrip: 16,
    stripCount: 3, lastStripLeftover: 32.5, totalInches: 7.5,
    ...overrides,
  }
}

test('scrapYield: no suggestions when no leftover', () => {
  const plan = makePlan({ lastStripLeftover: 0 })
  const result = scrapYield(plan, [])
  expect(result.suggestions).toHaveLength(0)
})

test('scrapYield: suggests smaller pieces that fit in leftover length', () => {
  // leftover is 32.5" long × 2.5" wide
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

test('scrapYield: does not suggest pieces that do not fit in strip width', () => {
  // leftover is 10" long × 2.5" wide; a 3.0" piece does NOT fit in 2.5" width
  const plan = makePlan({ lastStripLeftover: 10, cutSize: 2.5 })
  const largerPieces: PieceGroup[] = [
    { color: '#ff0000', shape: 'square', cutSize: 3.0, count: 10 },
  ]
  const result = scrapYield(plan, largerPieces)
  expect(result.suggestions).toHaveLength(0)
})
```

**Step 2: Run test — verify it fails**
```bash
npm run test:run -- tests/lib/cutting/scrapYield.test.ts
```

**Step 3: Create `src/lib/cutting/scrapYield.ts`**
```ts
import type { StripPlan } from './stripLayout'
import type { PieceGroup } from './cutSize'

export interface ScrapSuggestion {
  cutSize: number
  yield: number
}

export interface ScrapYield {
  leftoverLength: number    // inches
  stripWidth: number        // inches (= cutSize of parent strip)
  suggestions: ScrapSuggestion[]
}

export function scrapYield(plan: StripPlan, otherPieces: PieceGroup[]): ScrapYield {
  const { lastStripLeftover, cutSize } = plan

  if (lastStripLeftover === 0) {
    return { leftoverLength: 0, stripWidth: cutSize, suggestions: [] }
  }

  const suggestions: ScrapSuggestion[] = otherPieces
    .filter((p) => p.cutSize < cutSize) // piece must fit within strip width
    .map((p) => ({
      cutSize: p.cutSize,
      yield: Math.floor(lastStripLeftover / p.cutSize),
    }))
    .filter((s) => s.yield > 0)

  return {
    leftoverLength: lastStripLeftover,
    stripWidth: cutSize,
    suggestions,
  }
}
```

**Step 4: Run test — verify it passes**
```bash
npm run test:run -- tests/lib/cutting/scrapYield.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/cutting/scrapYield.ts tests/lib/cutting/scrapYield.test.ts
git commit -m "feat: add scrap yield calculator with TDD"
```

---

### Task 14: Cutting Plan UI

**Files:**
- Create: `src/components/CuttingPlan/CuttingSection.tsx`
- Create: `src/components/CuttingPlan/CuttingPlan.tsx`
- Modify: `src/App.tsx`

**Step 1: Create `src/components/CuttingPlan/CuttingSection.tsx`**
```tsx
import { calcStrips } from '../../lib/cutting/stripLayout'
import { scrapYield } from '../../lib/cutting/scrapYield'
import type { PieceGroup } from '../../lib/cutting/cutSize'

const FABRIC_WIDTH = 42

interface CuttingSectionProps {
  color: string
  pieces: PieceGroup[]  // all pieces for this color, sorted largest first
  allPieces: PieceGroup[] // all pieces across all colors (for scrap suggestions)
}

export function CuttingSection({ color, pieces, allPieces }: CuttingSectionProps) {
  const totalInches = pieces.reduce((sum, p) => {
    const plan = calcStrips(p.cutSize, p.count, FABRIC_WIDTH)
    return sum + plan.totalInches
  }, 0)
  const yards = (totalInches / 36).toFixed(2)

  return (
    <div style={{ marginBottom: 24, borderLeft: `8px solid ${color}`, paddingLeft: 12 }}>
      <h3 style={{ margin: '0 0 4px' }}>{color}</h3>
      <p style={{ margin: '0 0 8px', fontSize: 13 }}>Total yardage: {yards} yd ({totalInches.toFixed(1)}")</p>

      {pieces.map((piece) => {
        const plan = calcStrips(piece.cutSize, piece.count, FABRIC_WIDTH)
        const scrap = scrapYield(plan, allPieces.filter((p) => p !== piece))

        return (
          <div key={`${piece.cutSize}-${piece.shape}`} style={{ marginBottom: 8, fontSize: 13 }}>
            <strong>
              Cut {piece.count} {piece.shape === 'hst' ? 'HST starting squares' : 'squares'} at {piece.cutSize}"
            </strong>
            <div>
              → {plan.piecesPerStrip} per strip × {plan.stripCount} strip{plan.stripCount > 1 ? 's' : ''} ({piece.cutSize}" × {FABRIC_WIDTH}")
            </div>
            {scrap.suggestions.length > 0 && (
              <div style={{ color: '#666' }}>
                Scrap from last strip: {scrap.leftoverLength.toFixed(1)}" remaining.
                Can sub-cut:
                {scrap.suggestions.map((s) => (
                  <span key={s.cutSize}> {s.yield}× {s.cutSize}" pieces;</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Create `src/components/CuttingPlan/CuttingPlan.tsx`**
```tsx
import { useQuiltStore } from '../../store/useQuiltStore'
import { analyzePieces } from '../../lib/cutting/cutSize'
import { CuttingSection } from './CuttingSection'

export function CuttingPlan() {
  const { block, quiltSettings } = useQuiltStore()
  const numBlocks = quiltSettings.blocksWide * quiltSettings.blocksTall
  const pieces = analyzePieces(block, numBlocks)

  // Group by color
  const byColor = new Map<string, typeof pieces>()
  for (const piece of pieces) {
    const existing = byColor.get(piece.color) ?? []
    byColor.set(piece.color, [...existing, piece])
  }

  return (
    <div>
      <h2>Cutting Plan</h2>
      <p style={{ fontSize: 13, color: '#555' }}>
        Fabric width: 42". Cutting largest pieces first. Seam allowance: {block.seamAllowance}".
      </p>
      {[...byColor.entries()].map(([color, colorPieces]) => (
        <CuttingSection
          key={color}
          color={color}
          pieces={colorPieces}
          allPieces={pieces}
        />
      ))}
    </div>
  )
}
```

**Step 3: Update `src/App.tsx`**
```tsx
import { CuttingPlan } from './components/CuttingPlan/CuttingPlan'
// in JSX:
{view === 'cutting' && <CuttingPlan />}
```

**Step 4: Verify in browser** — design a block, go to cutting plan, verify calculations are correct.

**Step 5: Commit**
```bash
git add src/
git commit -m "feat: add cutting plan UI with strip breakdown and scrap yield"
```

---

### Task 15: LocalStorage Auto-Save

**Files:**
- Create: `src/lib/persistence.ts`
- Modify: `src/App.tsx`

**Step 1: Create `src/lib/persistence.ts`**
```ts
import type { Project } from '../types'

const KEY = 'quilt-build-project'

export function saveToLocalStorage(project: Project): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(project))
  } catch {
    // Storage full — silently ignore
  }
}

export function loadFromLocalStorage(): Project | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Project) : null
  } catch {
    return null
  }
}
```

**Step 2: Subscribe to store changes in `src/App.tsx`**

Import and add to the App component:
```tsx
import { useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage } from './lib/persistence'
import { useQuiltStore } from './store/useQuiltStore'

// Inside App():
const { loadProject, ...state } = useQuiltStore()

// Load on mount
useEffect(() => {
  const saved = loadFromLocalStorage()
  if (saved) loadProject(saved)
}, [])

// Save on every state change
useEffect(() => {
  saveToLocalStorage({
    block: state.block,
    quiltSettings: state.quiltSettings,
    palette: state.palette,
    grayscale: state.grayscale,
  })
}, [state.block, state.quiltSettings, state.palette, state.grayscale])
```

**Step 3: Verify in browser** — make design changes, refresh page, verify state is restored.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: add LocalStorage auto-save and restore"
```

---

### Task 16: JSON Export / Import

**Files:**
- Create: `src/components/ProjectIO.tsx`
- Modify: `src/components/Layout.tsx`

**Step 1: Create `src/components/ProjectIO.tsx`**
```tsx
import { useQuiltStore } from '../store/useQuiltStore'
import type { Project } from '../types'

export function ProjectIO() {
  const { block, quiltSettings, palette, grayscale, loadProject } = useQuiltStore()

  function handleExport() {
    const project: Project = { block, quiltSettings, palette, grayscale }
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quilt-project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const project = JSON.parse(ev.target?.result as string) as Project
        loadProject(project)
      } catch {
        alert('Invalid project file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={handleExport}>Save project</button>
      <label style={{ cursor: 'pointer' }}>
        Load project
        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </label>
    </div>
  )
}
```

**Step 2: Add ProjectIO to Layout nav bar**

In `Layout.tsx`, import and add `<ProjectIO />` in the nav area (right side):
```tsx
import { ProjectIO } from './ProjectIO'
// In the nav section:
<div style={{ marginLeft: 'auto' }}><ProjectIO /></div>
```

**Step 3: Verify in browser** — export a project JSON, clear block, import it back, verify state restores.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: add JSON project export and import"
```

---

### Task 17: PDF Export

**Files:**
- Create: `src/lib/generatePDF.tsx`
- Create: `src/components/ExportPDFButton.tsx`
- Modify: `src/components/Layout.tsx`

**Step 1: Create `src/lib/generatePDF.tsx`**
```tsx
import { pdf, Document, Page, Text, View, StyleSheet, Svg, Rect, Polygon } from '@react-pdf/renderer'
import type { Block, Project } from '../types'
import { analyzePieces } from './cutting/cutSize'
import { calcStrips } from './cutting/stripLayout'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 18, marginBottom: 12 },
  section: { marginBottom: 16 },
  h2: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 2 },
  colorBlock: { width: 12, height: 12, marginRight: 6 },
})

const FABRIC_WIDTH = 42
const CELL_SIZE = 8 // pt per cell in PDF block preview

function PDFBlock({ block }: { block: Block }) {
  const size = block.gridSize * CELL_SIZE
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {block.cells.map((row, ri) =>
        row.map((cell, ci) => {
          const x = ci * CELL_SIZE
          const y = ri * CELL_SIZE
          if (cell.shape === 'square') {
            return <Rect key={`${ri}-${ci}`} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} fill={cell.colors[0]} />
          }
          const [c0, c1] = cell.colors as [string, string]
          const t1 = cell.shape === 'hst-down'
            ? `${x},${y} ${x + CELL_SIZE},${y} ${x},${y + CELL_SIZE}`
            : `${x},${y} ${x + CELL_SIZE},${y} ${x + CELL_SIZE},${y + CELL_SIZE}`
          const t2 = cell.shape === 'hst-down'
            ? `${x + CELL_SIZE},${y} ${x + CELL_SIZE},${y + CELL_SIZE} ${x},${y + CELL_SIZE}`
            : `${x},${y} ${x + CELL_SIZE},${y + CELL_SIZE} ${x},${y + CELL_SIZE}`
          return (
            <React.Fragment key={`${ri}-${ci}`}>
              <Polygon points={t1} fill={c0} />
              <Polygon points={t2} fill={c1} />
            </React.Fragment>
          )
        })
      )}
    </Svg>
  )
}

function QuiltPDFDoc({ project }: { project: Project }) {
  const { block, quiltSettings } = project
  const numBlocks = quiltSettings.blocksWide * quiltSettings.blocksTall
  const pieces = analyzePieces(block, numBlocks)
  const finishedW = quiltSettings.blocksWide * block.finishedSize + quiltSettings.borderWidth * 2
  const finishedH = quiltSettings.blocksTall * block.finishedSize + quiltSettings.borderWidth * 2
  const byColor = new Map<string, typeof pieces>()
  for (const p of pieces) {
    byColor.set(p.color, [...(byColor.get(p.color) ?? []), p])
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Quilt Project</Text>

        <View style={styles.section}>
          <Text style={styles.h2}>Block Design</Text>
          <PDFBlock block={block} />
          <Text>Block size: {block.finishedSize}" finished ({block.gridSize}×{block.gridSize} grid)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Quilt Layout</Text>
          <Text>{quiltSettings.blocksWide} × {quiltSettings.blocksTall} blocks</Text>
          <Text>Finished quilt: {finishedW}" × {finishedH}"</Text>
          {quiltSettings.borderWidth > 0 && (
            <Text>Border: {quiltSettings.borderWidth}"</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Cutting Plan (42" fabric width)</Text>
          {[...byColor.entries()].map(([color, colorPieces]) => {
            const totalIn = colorPieces.reduce((s, p) => s + calcStrips(p.cutSize, p.count, FABRIC_WIDTH).totalInches, 0)
            return (
              <View key={color} style={{ marginBottom: 8 }}>
                <View style={styles.row}>
                  <Rect style={styles.colorBlock} fill={color} />
                  <Text>{color} — {(totalIn / 36).toFixed(2)} yd</Text>
                </View>
                {colorPieces.map((p) => {
                  const plan = calcStrips(p.cutSize, p.count, FABRIC_WIDTH)
                  return (
                    <Text key={p.cutSize} style={{ marginLeft: 18 }}>
                      {p.count}× {p.cutSize}" {p.shape === 'hst' ? 'HST sq' : 'sq'}: {plan.stripCount} strip{plan.stripCount > 1 ? 's' : ''} × {p.cutSize}" ({plan.piecesPerStrip}/strip)
                    </Text>
                  )
                })}
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export async function generatePDF(project: Project): Promise<void> {
  const blob = await pdf(<QuiltPDFDoc project={project} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quilt-project.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
```

**Step 2: Create `src/components/ExportPDFButton.tsx`**
```tsx
import { useQuiltStore } from '../store/useQuiltStore'
import { generatePDF } from '../lib/generatePDF'

export function ExportPDFButton() {
  const { block, quiltSettings, palette, grayscale } = useQuiltStore()
  return (
    <button onClick={() => generatePDF({ block, quiltSettings, palette, grayscale })}>
      Export PDF
    </button>
  )
}
```

**Step 3: Add ExportPDFButton to Layout nav (next to ProjectIO)**

In `Layout.tsx`:
```tsx
import { ExportPDFButton } from './ExportPDFButton'
// In the nav right side:
<ExportPDFButton />
```

**Step 4: Verify in browser** — clicking Export PDF downloads a PDF with block preview, quilt dimensions, and cutting plan.

**Step 5: Commit**
```bash
git add src/
git commit -m "feat: add PDF export with block, layout, and cutting plan"
```

---

### Task 18: Final Polish + Run All Tests

**Step 1: Run all tests**
```bash
npm run test:run
```
Expected: All tests PASS.

**Step 2: Run the dev server and do a full walkthrough**
```bash
npm run dev
```
Verify:
- [ ] Design an 8×8 block with squares and HST cells
- [ ] Color panel: pick a color directly, see harmonies, import a photo and sample/extract colors
- [ ] Grayscale toggle works
- [ ] Quilt assembler: adjust block count, set border, rotate individual blocks
- [ ] Cutting plan: verify piece counts and strip math are correct
- [ ] Save as JSON, reload page, load JSON — state restores correctly
- [ ] Export PDF — opens a PDF with all three sections

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat: complete quilt-build MVP"
```

---

## Summary of Commits

1. `chore: scaffold Vite + React + TypeScript project with Vitest`
2. `feat: define core data model types`
3. `feat: add Zustand store with all actions`
4. `feat: add app layout and navigation`
5. `feat: add SVG grid renderer with HST support`
6. `feat: wire block editor with store and tool modes`
7. `feat: add color palette panel with direct color picker`
8. `feat: add color harmony suggestions via tinycolor2`
9. `feat: add fabric photo color sampler and dominant color extraction`
10. `feat: add quilt assembler with tiling, rotation, and border`
11. `feat: add cut size calculator with TDD`
12. `feat: add strip layout calculator with TDD`
13. `feat: add scrap yield calculator with TDD`
14. `feat: add cutting plan UI with strip breakdown and scrap yield`
15. `feat: add LocalStorage auto-save and restore`
16. `feat: add JSON project export and import`
17. `feat: add PDF export with block, layout, and cutting plan`
18. `feat: complete quilt-build MVP`
