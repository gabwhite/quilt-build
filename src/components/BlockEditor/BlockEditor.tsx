import { useQuiltStore } from '../../store/useQuiltStore'
import { SVGGrid } from './SVGGrid'

export function BlockEditor() {
  const {
    block, grayscale, activeColor, toolMode,
    fillCell, fillHSTTriangle, cycleHST,
    setGridSize, setFinishedSize, setSeamAllowance,
    clearBlock, setGrayscale, setToolMode,
  } = useQuiltStore()

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
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <SVGGrid block={block} grayscale={grayscale} onCellClick={handleCellClick} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Grid size
          <select value={block.gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
            {[4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>{n}×{n}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Finished block size (in)
          <input
            type="number"
            value={block.finishedSize}
            min={1}
            step={0.5}
            onChange={(e) => setFinishedSize(Number(e.target.value))}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Seam allowance (in)
          <input
            type="number"
            value={block.seamAllowance}
            min={0.125}
            step={0.125}
            onChange={(e) => setSeamAllowance(Number(e.target.value))}
          />
        </label>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Tool</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setToolMode('fill')}
              style={{ fontWeight: toolMode === 'fill' ? 'bold' : 'normal' }}
              aria-pressed={toolMode === 'fill'}
            >
              Fill
            </button>
            <button
              onClick={() => setToolMode('hst')}
              style={{ fontWeight: toolMode === 'hst' ? 'bold' : 'normal' }}
              aria-pressed={toolMode === 'hst'}
            >
              Toggle HST
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={grayscale}
            onChange={(e) => setGrayscale(e.target.checked)}
          />
          Grayscale contrast check
        </label>

        <button onClick={clearBlock}>Clear block</button>
      </div>
    </div>
  )
}
