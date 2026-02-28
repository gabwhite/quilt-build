import { getHarmonies } from '../../lib/colorHarmonies'
import { useQuiltStore } from '../../store/useQuiltStore'

export function HarmonyPanel() {
  const { activeColor, addColor, setActiveColor } = useQuiltStore()
  const harmonies = getHarmonies(activeColor)

  const groups = [
    { label: 'Complementary', colors: [harmonies.complementary] },
    { label: 'Analogous', colors: harmonies.analogous },
    { label: 'Triadic', colors: harmonies.triadic },
    { label: 'Neutrals', colors: harmonies.neutrals },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 'bold' }}>Suggestions for {activeColor}</div>
      {groups.map(({ label, colors }) => (
        <div key={label}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {colors.map((c) => (
              <button
                key={c}
                aria-label={`Add color ${c}`}
                title={c}
                onClick={() => {
                  addColor(c)
                  setActiveColor(c)
                }}
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: c,
                  border: '1px solid #999',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
