import { useQuiltStore } from '../../store/useQuiltStore'
import { analyzePieces } from '../../lib/cutting/cutSize'
import { CuttingSection } from './CuttingSection'

export function CuttingPlan() {
  const { block, quiltSettings } = useQuiltStore()
  const numBlocks = quiltSettings.blocksWide * quiltSettings.blocksTall
  const pieces = analyzePieces(block, numBlocks)

  // Group by color, preserving the sorted order (largest cutSize first within each color)
  const byColor = new Map<string, typeof pieces>()
  for (const piece of pieces) {
    const existing = byColor.get(piece.color) ?? []
    byColor.set(piece.color, [...existing, piece])
  }

  if (pieces.length === 0) {
    return (
      <div>
        <h2>Cutting Plan</h2>
        <p style={{ color: '#666' }}>Design a block first to see cutting instructions.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginTop: 0 }}>Cutting Plan</h2>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
        Fabric width: {42}". Seam allowance: {block.seamAllowance}". Cutting largest pieces first.
        ({numBlocks} blocks: {quiltSettings.blocksWide}×{quiltSettings.blocksTall})
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
