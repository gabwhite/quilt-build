export interface StripPlan {
  cutSize: number
  count: number
  piecesPerStrip: number
  stripCount: number
  lastStripLeftover: number  // inches of leftover from last strip's length
  totalInches: number        // total fabric length needed (inches)
}

export function calcStrips(cutSize: number, count: number, fabricWidth: number): StripPlan {
  const piecesPerStrip = Math.floor(fabricWidth / cutSize)
  const stripCount = Math.ceil(count / piecesPerStrip)
  const piecesInLastStrip = count % piecesPerStrip || piecesPerStrip
  const lastStripLeftover =
    piecesInLastStrip === piecesPerStrip ? 0 : (piecesPerStrip - piecesInLastStrip) * cutSize
  const totalInches = stripCount * cutSize

  return { cutSize, count, piecesPerStrip, stripCount, lastStripLeftover, totalInches }
}
