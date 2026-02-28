import { useQuiltStore } from '../../store/useQuiltStore'
import { HarmonyPanel } from './HarmonyPanel'
import { FabricPhotoImport } from './FabricPhotoImport'

export function ColorPanel() {
  const { palette, activeColor, addColor, removeColor, setActiveColor } = useQuiltStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Colors</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {palette.map((color) => (
            <div key={color} style={{ position: 'relative' }}>
              <button
                aria-label={`Select color ${color}`}
                aria-pressed={color === activeColor}
                onClick={() => setActiveColor(color)}
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: color,
                  border: color === activeColor ? '3px solid #333' : '1px solid #999',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'block',
                }}
              />
              <button
                aria-label={`Remove color ${color}`}
                onClick={() => removeColor(color)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  fontSize: 10,
                  lineHeight: '14px',
                  textAlign: 'center',
                  border: '1px solid #999',
                  background: '#fff',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Add color
          <input
            type="color"
            onChange={(e) => {
              addColor(e.target.value)
              setActiveColor(e.target.value)
            }}
          />
        </label>
      </div>

      <HarmonyPanel />
      <FabricPhotoImport />
    </div>
  )
}
