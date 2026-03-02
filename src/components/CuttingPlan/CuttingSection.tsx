import { calcStrips } from '../../lib/cutting/stripLayout'
import { scrapYield } from '../../lib/cutting/scrapYield'
import type { PieceGroup } from '../../lib/cutting/cutSize'

const FABRIC_WIDTH = 42

interface CuttingSectionProps {
  color: string
  pieces: PieceGroup[]
  allPieces: PieceGroup[]
}

export function CuttingSection({ color, pieces, allPieces }: CuttingSectionProps) {
  const totalInches = pieces.reduce((sum, p) => {
    return sum + calcStrips(p.cutSize, p.count, FABRIC_WIDTH).totalInches
  }, 0)
  const yards = (totalInches / 36).toFixed(2)

  return (
    <div className="cutting-section" style={{ borderLeftColor: color }}>
      <div className="cutting-section-header">
        <div
          style={{ width: 18, height: 18, backgroundColor: color, border: '1px solid var(--color-border)', borderRadius: 3 }}
          aria-hidden="true"
        />
        <strong>{color}</strong>
      </div>
      <p className="cutting-total">
        Total: {yards} yd ({totalInches.toFixed(1)}")
      </p>

      {pieces.map((piece) => {
        const plan = calcStrips(piece.cutSize, piece.count, FABRIC_WIDTH)
        const scrap = scrapYield(plan, allPieces.filter((p) => p !== piece && p.color === color))

        return (
          <div
            key={`${piece.color}-${piece.cutSize}-${piece.shape}`}
            className="cutting-piece"
          >
            <div className="cutting-piece-title">
              {piece.count}× {piece.cutSize}" {piece.shape === 'hst' ? 'HST starting squares' : 'squares'}
            </div>
            <div className="cutting-piece-detail">
              → Cut {plan.stripCount} strip{plan.stripCount > 1 ? 's' : ''} at {piece.cutSize}" × {FABRIC_WIDTH}"
              ({plan.piecesPerStrip} pieces/strip)
            </div>
            {scrap.suggestions.length > 0 && (
              <div className="cutting-piece-scrap">
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
