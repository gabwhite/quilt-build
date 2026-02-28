declare module 'colorthief' {
  type RGBColor = [number, number, number]
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): RGBColor
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): RGBColor[]
  }
}
