import tinycolor from 'tinycolor2'

export interface Harmonies {
  complementary: string
  analogous: [string, string]
  triadic: [string, string]
  neutrals: string[]
}

export function getHarmonies(hex: string): Harmonies {
  const base = tinycolor(hex)
  const [, a1, a2] = base.analogous()
  const [, t1, t2] = base.triad()

  return {
    complementary: tinycolor(hex).complement().toHexString(),
    analogous: [a1.toHexString(), a2.toHexString()],
    triadic: [t1.toHexString(), t2.toHexString()],
    neutrals: [
      tinycolor(hex).desaturate(80).toHexString(),
      tinycolor(hex).desaturate(60).toHexString(),
      tinycolor(hex).lighten(40).desaturate(60).toHexString(),
    ],
  }
}
