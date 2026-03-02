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
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? 'Generating…' : 'Export PDF'}
    </button>
  )
}
