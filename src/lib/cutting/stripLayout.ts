export interface StripPlan {
  cutSize: number
  count: number
  piecesPerStrip: number
  stripCount: number
  lastStripLeftover: number  // inches of leftover from last strip's length
  totalInches: number        // total fabric length needed (inches)
}

// cutSize   = strip width (the dimension that stacks down the fabric length)
// pieceWidth = piece width within the strip (defaults to cutSize for square pieces)
export function calcStrips(cutSize: number, count: number, fabricWidth: number, pieceWidth = cutSize): StripPlan {
  const piecesPerStrip = Math.floor(fabricWidth / pieceWidth)
  const stripCount = Math.ceil(count / piecesPerStrip)
  const piecesInLastStrip = count % piecesPerStrip || piecesPerStrip
  const lastStripLeftover =
    piecesInLastStrip === piecesPerStrip ? 0 : (piecesPerStrip - piecesInLastStrip) * pieceWidth
  const totalInches = stripCount * cutSize

  return { cutSize, count, piecesPerStrip, stripCount, lastStripLeftover, totalInches }
}
