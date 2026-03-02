import { useState } from 'react'
import { useQuiltStore } from '../../store/useQuiltStore'
import { HarmonyPanel } from './HarmonyPanel'
import { FabricPhotoImport } from './FabricPhotoImport'

export function ColorPanel() {
  const { palette, activeColor, addColor, removeColor, setActiveColor } = useQuiltStore()
  const [pickerColor, setPickerColor] = useState('#000000')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="section-heading">Colors</div>
        <div className="swatch-grid" style={{ marginBottom: 10 }}>
          {palette.map((color) => (
            <div key={color} className="swatch-wrap">
              <button
                aria-label={`Select color ${color}`}
                aria-pressed={color === activeColor}
                onClick={() => setActiveColor(color)}
                className="swatch-btn"
                style={{
                  backgroundColor: color,
                  border: color === activeColor ? '2px solid var(--color-text)' : '1.5px solid var(--color-border)',
                }}
              />
              <button
                aria-label={`Remove color ${color}`}
                onClick={() => removeColor(color)}
                className="swatch-remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label className="checkbox-label" style={{ gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Add color</span>
          <input
            type="color"
            value={pickerColor}
            style={{ width: 36, height: 36, cursor: 'pointer', border: '1.5px solid var(--color-border)', borderRadius: 6, padding: 2 }}
            onChange={(e) => {
              setPickerColor(e.target.value)
              setActiveColor(e.target.value)
            }}
            onBlur={(e) => {
              addColor(e.target.value)
            }}
          />
        </label>
      </div>

      <hr className="divider" />
      <HarmonyPanel />

      <hr className="divider" />
      <FabricPhotoImport />
    </div>
  )
}
