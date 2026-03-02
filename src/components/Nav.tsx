import type { View } from '../types'

interface NavProps {
  view: View
  onChange: (v: View) => void
}

export function Nav({ view, onChange }: NavProps) {
  const tabs: { id: View; label: string }[] = [
    { id: 'editor', label: 'Block Editor' },
    { id: 'assembler', label: 'Quilt Assembler' },
    { id: 'cutting', label: 'Cutting Plan' },
  ]
  return (
    <nav aria-label="Main navigation" className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="nav-tab"
          aria-current={view === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
