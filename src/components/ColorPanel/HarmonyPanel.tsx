import { getHarmonies } from '../../lib/colorHarmonies'
import { useQuiltStore } from '../../store/useQuiltStore'

export function HarmonyPanel() {
  const { activeColor, setActiveColor } = useQuiltStore()
  if (!activeColor || !/^#[0-9a-f]{6}$/i.test(activeColor)) {
    return <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>No color selected</div>
  }
  const harmonies = getHarmonies(activeColor)

  const groups = [
    { label: 'Complementary', colors: [harmonies.complementary] },
    { label: 'Analogous', colors: harmonies.analogous },
    { label: 'Triadic', colors: harmonies.triadic },
    { label: 'Neutrals', colors: harmonies.neutrals },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-heading">Suggestions for {activeColor}</div>
      {groups.map(({ label, colors }) => (
        <div key={label} className="harmony-group">
          <div className="harmony-label">{label}</div>
          <div className="harmony-swatches">
            {colors.map((c) => (
              <button
                key={c}
                aria-label={`Add color ${c}`}
                title={c}
                onClick={() => setActiveColor(c)}
                className="harmony-swatch"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
