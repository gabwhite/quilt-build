// src/types/index.ts

export type CellShape = 'square' | 'hst-down' | 'hst-up'
// hst-down: diagonal from top-left → bottom-right
// hst-up:   diagonal from top-right → bottom-left

export interface Cell {
  shape: CellShape
  // square: one color; HST: [top triangle color, bottom triangle color]
  colors: [string] | [string, string]
  colSpan?: number   // >= 1 (only set on origin cells)
  rowSpan?: number   // >= 1 (only set on origin cells)
  absorbed?: true    // marks cells covered by a spanning origin
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

export type ToolMode = 'fill' | 'hst' | 'merge'
// fill:  clicking a cell/triangle fills it with active color
// hst:   clicking cycles cell shape: square → hst-down → hst-up → square
// merge: drag-select a rectangle to merge into one piece; click origin to unmerge

export type View = 'editor' | 'assembler' | 'cutting'
