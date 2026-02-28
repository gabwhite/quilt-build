import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { BlockEditor } from './components/BlockEditor/BlockEditor'
import { QuiltAssembler } from './components/QuiltAssembler/QuiltAssembler'
import { CuttingPlan } from './components/CuttingPlan/CuttingPlan'
import { useQuiltStore } from './store/useQuiltStore'
import { saveToLocalStorage, loadFromLocalStorage } from './lib/persistence'
import type { View } from './types'

export default function App() {
  const [view, setView] = useState<View>('editor')
  const { loadProject, block, quiltSettings, palette, grayscale } = useQuiltStore()

  // Load saved project on first mount
  useEffect(() => {
    const saved = loadFromLocalStorage()
    if (saved) loadProject(saved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save whenever project state changes
  useEffect(() => {
    saveToLocalStorage({ block, quiltSettings, palette, grayscale })
  }, [block, quiltSettings, palette, grayscale])

  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'editor' && <BlockEditor />}
      {view === 'assembler' && <QuiltAssembler />}
      {view === 'cutting' && <CuttingPlan />}
    </Layout>
  )
}
