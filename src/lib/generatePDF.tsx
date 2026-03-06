import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Polygon,
} from '@react-pdf/renderer'
import type { Project } from '../types'
import type { Cell } from '../types'
import { analyzePieces } from './cutting/cutSize'
import { calcStrips } from './cutting/stripLayout'

const FABRIC_WIDTH = 42
const CELL_PX = 8 // pt per cell in PDF

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 12 },
  h2: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 12 },
  section: { marginBottom: 12 },
  small: { fontSize: 9, color: '#555' },
  row: { flexDirection: 'row', marginBottom: 3 },
  colorDot: { width: 10, height: 10, marginRight: 6, marginTop: 1 },
})

interface PdfCellProps {
  cell: Cell
  x: number
  y: number
  size: number
}

function PdfCell({ cell, x, y, size }: PdfCellProps) {
  if (cell.shape === 'square') {
    const width = (cell.colSpan ?? 1) * size
    const height = (cell.rowSpan ?? 1) * size
    return <Rect x={x} y={y} width={width} height={height} fill={cell.colors[0]} stroke="#ccc" strokeWidth={0.3} />
  }
  const [c0, c1] = cell.colors as [string, string]
  let t1: string, t2: string
  if (cell.shape === 'hst-down') {
    t1 = `${x},${y} ${x + size},${y} ${x},${y + size}`
    t2 = `${x + size},${y} ${x + size},${y + size} ${x},${y + size}`
  } else {
    t1 = `${x},${y} ${x + size},${y} ${x + size},${y + size}`
    t2 = `${x},${y} ${x + size},${y + size} ${x},${y + size}`
  }
  return (
    <>
      <Polygon points={t1} fill={c0} stroke="#ccc" strokeWidth={0.3} />
      <Polygon points={t2} fill={c1} stroke="#ccc" strokeWidth={0.3} />
    </>
  )
}

function PdfBlock({ project }: { project: Project }) {
  const { block } = project
  const svgSize = block.gridSize * CELL_PX
  return (
    <Svg width={svgSize} height={svgSize}>
      {block.cells.map((row, ri) =>
        row.map((cell, ci) => {
          if (cell.absorbed) return null
          return (
            <PdfCell
              key={`${ri}-${ci}`}
              cell={cell}
              x={ci * CELL_PX}
              y={ri * CELL_PX}
              size={CELL_PX}
            />
          )
        })
      )}
    </Svg>
  )
}

function QuiltPDFDocument({ project }: { project: Project }) {
  const { block, quiltSettings } = project
  const numBlocks = quiltSettings.blocksWide * quiltSettings.blocksTall
  const finishedW = quiltSettings.blocksWide * block.finishedSize + quiltSettings.borderWidth * 2
  const finishedH = quiltSettings.blocksTall * block.finishedSize + quiltSettings.borderWidth * 2
  const pieces = analyzePieces(block, numBlocks)

  const byColor = new Map<string, typeof pieces>()
  for (const piece of pieces) {
    byColor.set(piece.color, [...(byColor.get(piece.color) ?? []), piece])
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Quilt Project</Text>

        <Text style={styles.h2}>Block Design</Text>
        <View style={styles.section}>
          <PdfBlock project={project} />
          <Text style={{ marginTop: 4 }}>
            {block.finishedSize}" finished block · {block.gridSize}×{block.gridSize} grid · {block.seamAllowance}" seam allowance
          </Text>
        </View>

        <Text style={styles.h2}>Quilt Layout</Text>
        <View style={styles.section}>
          <Text>{quiltSettings.blocksWide} × {quiltSettings.blocksTall} blocks ({numBlocks} total)</Text>
          <Text>Finished size: {finishedW}" × {finishedH}"</Text>
          {quiltSettings.borderWidth > 0 && (
            <Text>Border: {quiltSettings.borderWidth}"</Text>
          )}
        </View>

        <Text style={styles.h2}>Cutting Plan (42" fabric width)</Text>
        {pieces.length === 0 ? (
          <Text style={styles.small}>No pieces — design a block first.</Text>
        ) : (
          [...byColor.entries()].map(([color, colorPieces]) => {
            const totalIn = colorPieces.reduce(
              (sum, p) => sum + (p.shape === 'rect'
                ? calcStrips(p.cutHeight!, p.count, FABRIC_WIDTH, p.cutWidth!)
                : calcStrips(p.cutSize, p.count, FABRIC_WIDTH)
              ).totalInches,
              0
            )
            return (
              <View key={color} style={{ marginBottom: 8 }}>
                <View style={styles.row}>
                  <Rect style={styles.colorDot as any} width={10} height={10} fill={color} />
                  <Text>{color} — {(totalIn / 36).toFixed(2)} yd</Text>
                </View>
                {colorPieces.map((p) => {
                  const plan = p.shape === 'rect'
                    ? calcStrips(p.cutHeight!, p.count, FABRIC_WIDTH, p.cutWidth!)
                    : calcStrips(p.cutSize, p.count, FABRIC_WIDTH)
                  const label = p.shape === 'rect'
                    ? `${p.cutWidth}"×${p.cutHeight}" rect`
                    : `${p.cutSize}" ${p.shape === 'hst' ? 'HST sq' : 'sq'}`
                  const key = p.shape === 'rect'
                    ? `${p.color}-${p.cutWidth}-${p.cutHeight}-rect`
                    : `${p.color}-${p.cutSize}-${p.shape}`
                  return (
                    <Text key={key} style={{ marginLeft: 16, marginBottom: 2 }}>
                      {p.count}× {label}: {plan.stripCount} strip{plan.stripCount > 1 ? 's' : ''} × {p.shape === 'rect' ? p.cutHeight : p.cutSize}" ({plan.piecesPerStrip}/strip)
                    </Text>
                  )
                })}
              </View>
            )
          })
        )}
      </Page>
    </Document>
  )
}

export async function generatePDF(project: Project): Promise<void> {
  const blob = await pdf(<QuiltPDFDocument project={project} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quilt-project.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
