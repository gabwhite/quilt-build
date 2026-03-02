import { useQuiltStore } from '../../store/useQuiltStore'
import { SVGGrid } from './SVGGrid'
import { ColorPanel } from '../ColorPanel/ColorPanel'

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
      const cell = block.cells[row][col]
      if (cell.shape === 'square') {
        fillCell(row, col, activeColor)
      } else if (triangleIdx !== undefined) {
        fillHSTTriangle(row, col, triangleIdx, activeColor)
      }
    }
  }

  return (
    <div className="view-layout">
      {/* Controls — left */}
      <div className="controls-panel">
        <div className="form-field">
          <label className="form-label" htmlFor="grid-size">Grid size</label>
          <select
            id="grid-size"
            className="form-select"
            value={block.gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
          >
            {[4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>{n}×{n}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="finished-size">Finished block size (in)</label>
          <input
            id="finished-size"
            className="form-input"
            type="number"
            value={block.finishedSize}
            min={1}
            step={0.5}
            onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) setFinishedSize(v) }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="seam-allowance">Seam allowance (in)</label>
          <input
            id="seam-allowance"
            className="form-input"
            type="number"
            value={block.seamAllowance}
            min={0.125}
            step={0.125}
            onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) setSeamAllowance(v) }}
          />
        </div>

        <hr className="divider" />

        <div>
          <div className="section-heading">Tool</div>
          <div className="tool-group">
            <button
              className={`btn ${toolMode === 'fill' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setToolMode('fill')}
              aria-pressed={toolMode === 'fill'}
            >
              Fill
            </button>
            <button
              className={`btn ${toolMode === 'hst' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setToolMode('hst')}
              aria-pressed={toolMode === 'hst'}
            >
              Toggle HST
            </button>
          </div>
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={grayscale}
            onChange={(e) => setGrayscale(e.target.checked)}
          />
          Grayscale contrast check
        </label>

        <button className="btn btn-outline" onClick={clearBlock}>Clear block</button>

        <hr className="divider" />

        <ColorPanel />
      </div>

      {/* Canvas — right */}
      <div className="canvas-area">
        <SVGGrid block={block} grayscale={grayscale} onCellClick={handleCellClick} />
      </div>
    </div>
  )
}
