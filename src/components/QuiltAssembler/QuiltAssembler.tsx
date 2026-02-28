import { useQuiltStore } from '../../store/useQuiltStore'
import { MiniBlock, BLOCK_SIZE } from './MiniBlock'

export function QuiltAssembler() {
  const {
    block, quiltSettings, grayscale,
    setBlocksWide, setBlocksTall, setBorderWidth, setBlockRotation,
  } = useQuiltStore()
  const { blocksWide, blocksTall, borderWidth, rotations } = quiltSettings

  // Convert border inches to pixels (using block's finished size as reference scale)
  const borderPx = block.finishedSize > 0
    ? (borderWidth / block.finishedSize) * BLOCK_SIZE
    : 0

  const svgWidth = blocksWide * BLOCK_SIZE + borderPx * 2
  const svgHeight = blocksTall * BLOCK_SIZE + borderPx * 2
  const finishedW = blocksWide * block.finishedSize + borderWidth * 2
  const finishedH = blocksTall * block.finishedSize + borderWidth * 2

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13 }}>
          Finished size: {finishedW}" × {finishedH}"
        </p>
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ border: '1px solid #999', display: 'block' }}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Blocks wide
          <input
            type="number"
            value={blocksWide}
            min={1}
            max={20}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 1) setBlocksWide(v)
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Blocks tall
          <input
            type="number"
            value={blocksTall}
            min={1}
            max={20}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 1) setBlocksTall(v)
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Border width (in)
          <input
            type="number"
            value={borderWidth}
            min={0}
            step={0.5}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= 0) setBorderWidth(v)
            }}
          />
        </label>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Block rotations</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Array.from({ length: blocksTall }, (_, ri) =>
              Array.from({ length: blocksWide }, (_, ci) => (
                <label
                  key={`${ri}-${ci}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 2 }}
                >
                  <span style={{ minWidth: 40 }}>R{ri} C{ci}</span>
                  <select
                    value={rotations[ri]?.[ci] ?? 0}
                    onChange={(e) => setBlockRotation(ri, ci, Number(e.target.value))}
                  >
                    {[0, 90, 180, 270].map((d) => (
                      <option key={d} value={d}>{d}°</option>
                    ))}
                  </select>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
