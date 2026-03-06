import { calcStrips } from '../../lib/cutting/stripLayout'
import { scrapYield } from '../../lib/cutting/scrapYield'
import type { PieceGroup } from '../../lib/cutting/cutSize'
import type { StripPlan } from '../../lib/cutting/stripLayout'

const FABRIC_WIDTH = 42

interface CuttingSectionProps {
  color: string
  pieces: PieceGroup[]
  allPieces: PieceGroup[]
}

function getPlan(piece: PieceGroup): StripPlan {
  if (piece.shape === 'rect') {
    return calcStrips(piece.cutHeight!, piece.count, FABRIC_WIDTH, piece.cutWidth!)
  }
  return calcStrips(piece.cutSize, piece.count, FABRIC_WIDTH)
}

export function CuttingSection({ color, pieces, allPieces }: CuttingSectionProps) {
  const totalInches = pieces.reduce((sum, p) => sum + getPlan(p).totalInches, 0)
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
        const plan = getPlan(piece)
        const scrap = scrapYield(plan, allPieces.filter((p) => p !== piece && p.color === color))

        const isRect = piece.shape === 'rect'
        const key = isRect
          ? `${piece.color}-${piece.cutWidth}-${piece.cutHeight}-rect`
          : `${piece.color}-${piece.cutSize}-${piece.shape}`

        return (
          <div key={key} className="cutting-piece">
            <div className="cutting-piece-title">
              {isRect
                ? `${piece.count}× ${piece.cutWidth}"×${piece.cutHeight}" rectangles`
                : `${piece.count}× ${piece.cutSize}" ${piece.shape === 'hst' ? 'HST starting squares' : 'squares'}`
              }
            </div>
            <div className="cutting-piece-detail">
              {isRect
                ? `→ Cut ${plan.stripCount} strip${plan.stripCount > 1 ? 's' : ''} at ${piece.cutHeight}" × ${FABRIC_WIDTH}" (${plan.piecesPerStrip} pieces/strip, each ${piece.cutWidth}" wide)`
                : `→ Cut ${plan.stripCount} strip${plan.stripCount > 1 ? 's' : ''} at ${piece.cutSize}" × ${FABRIC_WIDTH}" (${plan.piecesPerStrip} pieces/strip)`
              }
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
