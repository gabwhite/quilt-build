import { useQuiltStore } from '../../store/useQuiltStore'
import { MiniBlock, BLOCK_SIZE } from './MiniBlock'

export function QuiltAssembler() {
  const {
    block, quiltSettings, grayscale,
    setBlocksWide, setBlocksTall, setBorderWidth, setBlockRotation,
  } = useQuiltStore()
  const { blocksWide, blocksTall, borderWidth, rotations } = quiltSettings

  const borderPx = block.finishedSize > 0
    ? (borderWidth / block.finishedSize) * BLOCK_SIZE
    : 0

  const svgWidth = blocksWide * BLOCK_SIZE + borderPx * 2
  const svgHeight = blocksTall * BLOCK_SIZE + borderPx * 2
  const finishedW = blocksWide * block.finishedSize + borderWidth * 2
  const finishedH = blocksTall * block.finishedSize + borderWidth * 2

  return (
    <div className="view-layout">
      {/* Controls — left */}
      <div className="controls-panel">
        <div className="form-field">
          <label className="form-label" htmlFor="blocks-wide">Blocks wide</label>
          <input
            id="blocks-wide"
            className="form-input"
            type="number"
            value={blocksWide}
            min={1}
            max={20}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 1) setBlocksWide(v)
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="blocks-tall">Blocks tall</label>
          <input
            id="blocks-tall"
            className="form-input"
            type="number"
            value={blocksTall}
            min={1}
            max={20}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 1) setBlocksTall(v)
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="border-width">Border width (in)</label>
          <input
            id="border-width"
            className="form-input"
            type="number"
            value={borderWidth}
            min={0}
            step={0.5}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 0) setBorderWidth(v)
            }}
          />
        </div>

        <hr className="divider" />

        <div>
          <div className="section-heading">Block rotations</div>
          <div className="rotation-grid">
            {Array.from({ length: blocksTall }, (_, ri) =>
              Array.from({ length: blocksWide }, (_, ci) => (
                <div key={`${ri}-${ci}`} className="rotation-row">
                  <span className="rotation-label">R{ri} C{ci}</span>
                  <select
                    className="form-select"
                    value={rotations[ri]?.[ci] ?? 0}
                    onChange={(e) => setBlockRotation(ri, ci, Number(e.target.value))}
                    style={{ padding: '5px 8px', fontSize: 12 }}
                  >
                    {[0, 90, 180, 270].map((d) => (
                      <option key={d} value={d}>{d}°</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Canvas — right */}
      <div className="canvas-area">
        <p className="canvas-label">
          Finished size: {finishedW}" × {finishedH}"
        </p>
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ border: '1px solid #ccc', display: 'block', borderRadius: 4 }}
        >
          {borderPx > 0 && (
            <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#e8e8e8" />
          )}
          {Array.from({ length: blocksTall }, (_, ri) =>
            Array.from({ length: blocksWide }, (_, ci) => (
              <MiniBlock
                key={`${ri}-${ci}`}
                block={block}
                grayscale={grayscale}
                rotation={rotations[ri]?.[ci] ?? 0}
                x={borderPx + ci * BLOCK_SIZE}
                y={borderPx + ri * BLOCK_SIZE}
              />
            ))
          )}
        </svg>
      </div>
    </div>
  )
}
