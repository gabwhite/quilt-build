import { useQuiltStore } from '../store/useQuiltStore'
import type { Project } from '../types'

export function ProjectIO() {
  const { block, quiltSettings, palette, grayscale, loadProject } = useQuiltStore()

  function handleExport() {
    const project: Project = { block, quiltSettings, palette, grayscale }
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quilt-project.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result
        if (typeof raw !== 'string') return
        const project = JSON.parse(raw) as Project
        // Basic validation: check required top-level keys
        if (!project.block || !project.quiltSettings || !project.palette) {
          alert('Invalid project file — missing required fields.')
          return
        }
        loadProject(project)
      } catch {
        alert('Invalid project file — could not parse JSON.')
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-imported
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={handleExport} style={{ fontSize: 13 }}>
        Save project
      </button>
      <label style={{ fontSize: 13, cursor: 'pointer' }}>
        Load project
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  )
}
