import { ReactNode } from 'react'
import { Nav } from './Nav'
import { ProjectIO } from './ProjectIO'
import { ExportPDFButton } from './ExportPDFButton'
import type { View } from '../types'

export function Layout({
  view,
  onViewChange,
  children,
}: {
  view: View
  onViewChange: (v: View) => void
  children: ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <span className="app-header-title">Quilt Build</span>
        <Nav view={view} onChange={onViewChange} />
        <div className="app-header-actions">
          <ProjectIO />
          <ExportPDFButton />
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
