import { calcStrips } from '../../lib/cutting/stripLayout'
import { scrapYield } from '../../lib/cutting/scrapYield'
import type { PieceGroup } from '../../lib/cutting/cutSize'

const FABRIC_WIDTH = 42

interface CuttingSectionProps {
  color: string
  pieces: PieceGroup[]   // all pieces for this color, already sorted largest first
  allPieces: PieceGroup[] // all pieces across all colors (for scrap cross-color suggestions)
}

export function CuttingSection({ color, pieces, allPieces }: CuttingSectionProps) {
  const totalInches = pieces.reduce((sum, p) => {
    return sum + calcStrips(p.cutSize, p.count, FABRIC_WIDTH).totalInches
  }, 0)
  const yards = (totalInches / 36).toFixed(2)

  return (
    <div style={{ marginBottom: 24, borderLeft: `6px solid ${color}`, paddingLeft: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div
          style={{ width: 20, height: 20, backgroundColor: color, border: '1px solid #ccc', borderRadius: 2 }}
          aria-hidden="true"
        />
        <strong>{color}</strong>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
        Total: {yards} yd ({totalInches.toFixed(1)}")
      </p>

      {pieces.map((piece) => {
        const plan = calcStrips(piece.cutSize, piece.count, FABRIC_WIDTH)
        const scrap = scrapYield(plan, allPieces.filter((p) => p !== piece && p.color === color))

        return (
          <div
            key={`${piece.color}-${piece.cutSize}-${piece.shape}`}
            style={{ marginBottom: 8, fontSize: 13, paddingLeft: 4 }}
          >
            <div>
              <strong>
                {piece.count}× {piece.cutSize}" {piece.shape === 'hst' ? 'HST starting squares' : 'squares'}
              </strong>
            </div>
            <div style={{ color: '#333' }}>
              → Cut {plan.stripCount} strip{plan.stripCount > 1 ? 's' : ''} at {piece.cutSize}" × {FABRIC_WIDTH}"
              ({plan.piecesPerStrip} pieces/strip)
            </div>
            {scrap.suggestions.length > 0 && (
              <div style={{ color: '#777', fontStyle: 'italic' }}>
                Scrap from last strip: {scrap.leftoverLength.toFixed(1)}" — can sub-cut:
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
