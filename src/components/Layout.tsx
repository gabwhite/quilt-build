import { ReactNode } from 'react'
import { Nav } from './Nav'
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
      <Nav view={view} onChange={onViewChange} />
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  )
}
