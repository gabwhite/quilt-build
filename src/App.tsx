import { useState } from 'react'
import { Layout } from './components/Layout'
import { BlockEditor } from './components/BlockEditor/BlockEditor'
import { QuiltAssembler } from './components/QuiltAssembler/QuiltAssembler'
import type { View } from './types'

export default function App() {
  const [view, setView] = useState<View>('editor')
  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'editor' && <BlockEditor />}
      {view === 'assembler' && <QuiltAssembler />}
      {view === 'cutting' && <div>Cutting Plan (coming soon)</div>}
    </Layout>
  )
}
