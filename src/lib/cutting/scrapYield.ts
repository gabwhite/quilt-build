import type { StripPlan } from './stripLayout'
import type { PieceGroup } from './cutSize'

export interface ScrapSuggestion {
  cutSize: number
  yield: number
}

export interface ScrapResult {
  leftoverLength: number
  stripWidth: number
  suggestions: ScrapSuggestion[]
}

export function scrapYield(plan: StripPlan, otherPieces: PieceGroup[]): ScrapResult {
  const { lastStripLeftover, cutSize } = plan

  if (lastStripLeftover === 0) {
    return { leftoverLength: 0, stripWidth: cutSize, suggestions: [] }
  }

  const suggestions: ScrapSuggestion[] = otherPieces
    .filter((p) => p.cutSize < cutSize)  // piece must fit within strip width
    .map((p) => ({
      cutSize: p.cutSize,
      yield: Math.floor(lastStripLeftover / p.cutSize),
    }))
    .filter((s) => s.yield > 0)

  return {
    leftoverLength: lastStripLeftover,
    stripWidth: cutSize,
    suggestions,
  }
}
