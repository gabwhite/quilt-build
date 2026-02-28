import { useState } from 'react'
import { Layout } from './components/Layout'
import { BlockEditor } from './components/BlockEditor/BlockEditor'
import type { View } from './types'

export default function App() {
  const [view, setView] = useState<View>('editor')
  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'editor' && <BlockEditor />}
      {view === 'assembler' && <div>Quilt Assembler (coming soon)</div>}
      {view === 'cutting' && <div>Cutting Plan (coming soon)</div>}
    </Layout>
  )
}
