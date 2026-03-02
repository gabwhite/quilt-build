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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="form-label">Select colour</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={pickerColor}
              style={{ width: 36, height: 36, cursor: 'pointer', border: '1.5px solid var(--color-border)', borderRadius: 6, padding: 2, flexShrink: 0 }}
              onChange={(e) => {
                setPickerColor(e.target.value)
                setActiveColor(e.target.value)
              }}
            />
            <div
              style={{ width: 36, height: 36, backgroundColor: pickerColor, border: '1.5px solid var(--color-border)', borderRadius: 6, flexShrink: 0 }}
              aria-hidden="true"
            />
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => addColor(pickerColor)}
            >
              Add to palette
            </button>
          </div>
        </div>
      </div>

      <hr className="divider" />
      <HarmonyPanel />

      <hr className="divider" />
      <FabricPhotoImport />
    </div>
  )
}
