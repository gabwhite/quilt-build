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
  mergeCells: (r1: number, c1: number, r2: number, c2: number) => void
  unmergeCells: (r: number, c: number) => void

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
  palette: ['#ffffff'],
  grayscale: false,
  activeColor: '#ffffff',
  toolMode: 'fill',

  setGridSize: (size) =>
    set((s) => {
      if (size === s.block.gridSize) return s
      return { block: { ...s.block, gridSize: size, cells: makeEmptyGrid(size) } }
    }),

  setFinishedSize: (size) =>
    set((s) => ({ block: { ...s.block, finishedSize: size } })),

  setSeamAllowance: (sa) =>
    set((s) => ({ block: { ...s.block, seamAllowance: sa } })),

  fillCell: (row, col, color) =>
    set((s) => {
      const cell = s.block.cells[row][col]
      if (cell.absorbed) return s
      if (cell.shape !== 'square') return s
      const cells = s.block.cells.map((r) => [...r])
      cells[row][col] = { ...cell, colors: [color] }
      return { block: { ...s.block, cells } }
    }),

  fillHSTTriangle: (row, col, idx, color) =>
    set((s) => {
      const existing = s.block.cells[row][col]
      if (existing.shape === 'square') return s
      const cells = s.block.cells.map((r) => [...r])
      const cell = { ...existing }
      const colors: [string, string] = [cell.colors[0], cell.colors[1] ?? '#ffffff']
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
        // Second triangle defaults to white; user fills it with the fill tool
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

  mergeCells: (r1, c1, r2, c2) =>
    set((s) => {
      const minR = Math.min(r1, r2), maxR = Math.max(r1, r2)
      const minC = Math.min(c1, c2), maxC = Math.max(c1, c2)
      const cells = s.block.cells.map((r) => [...r])

      // Un-merge any existing origins within the selection
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const cell = cells[r][c]
          if (cell.colSpan && cell.rowSpan) {
            const baseColor = cell.colors[0]
            for (let dr = 0; dr < cell.rowSpan; dr++) {
              for (let dc = 0; dc < cell.colSpan; dc++) {
                const tr = r + dr, tc = c + dc
                if (tr < cells.length && tc < cells[0].length) {
                  cells[tr][tc] = { shape: 'square', colors: [baseColor] }
                }
              }
            }
          }
        }
      }

      // Set origin cell
      cells[minR][minC] = {
        shape: 'square',
        colors: [s.activeColor],
        colSpan: maxC - minC + 1,
        rowSpan: maxR - minR + 1,
      }

      // Mark all other cells in region as absorbed
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (r === minR && c === minC) continue
          cells[r][c] = { shape: 'square', colors: [s.activeColor], absorbed: true }
        }
      }

      return { block: { ...s.block, cells } }
    }),

  unmergeCells: (r, c) =>
    set((s) => {
      const origin = s.block.cells[r][c]
      if (!origin.colSpan || !origin.rowSpan) return s
      const cells = s.block.cells.map((row) => [...row])
      const baseColor = origin.colors[0]
      for (let dr = 0; dr < origin.rowSpan; dr++) {
        for (let dc = 0; dc < origin.colSpan; dc++) {
          cells[r + dr][c + dc] = { shape: 'square', colors: [baseColor] }
        }
      }
      return { block: { ...s.block, cells } }
    }),

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

  loadProject: (project) =>
    set({
      ...project,
      activeColor: project.palette[0] ?? '#000000',
      toolMode: 'fill',
    }),
}))
