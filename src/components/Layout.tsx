import { ReactNode } from 'react'
import { Nav } from './Nav'
import { ProjectIO } from './ProjectIO'
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
      <header style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <Nav view={view} onChange={onViewChange} />
        <div style={{ marginLeft: 'auto', padding: '0 16px' }}>
          <ProjectIO />
        </div>
      </header>
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  )
}
