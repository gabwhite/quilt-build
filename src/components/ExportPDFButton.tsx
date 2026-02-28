import { useState } from 'react'
import { useQuiltStore } from '../store/useQuiltStore'
import { generatePDF } from '../lib/generatePDF'

export function ExportPDFButton() {
  const { block, quiltSettings, palette, grayscale } = useQuiltStore()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await generatePDF({ block, quiltSettings, palette, grayscale })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} style={{ fontSize: 13 }}>
      {loading ? 'Generating…' : 'Export PDF'}
    </button>
  )
}
