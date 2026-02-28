import type { Project } from '../types'

const STORAGE_KEY = 'quilt-build-project'

export function saveToLocalStorage(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function loadFromLocalStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Project
  } catch {
    return null
  }
}
