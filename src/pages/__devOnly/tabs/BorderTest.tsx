import { ColorTheme } from '~/components/ui/color-theme'

const widths = [
  ['border-0', '0px'],
  ['border', '1px'],
  ['border-2', '2px'],
] as const
const borders = [
  ['border-subtle', 'border-border-subtle'],
  ['border-default', 'border-border-default'],
  ['border-strong', 'border-border-strong'],
  ['focus-border', 'border-focus-border'],
  ['disabled-border', 'border-disabled-border'],
  ['danger-border', 'border-danger-border'],
  ['info-border', 'border-info-border'],
  ['success-border', 'border-success-border'],
  ['warning-border', 'border-warning-border'],
] as const
const placements = [
  ['All sides', 'border'],
  ['Top', 'border-t'],
  ['Bottom', 'border-b'],
  ['Start', 'border-s'],
  ['End', 'border-e'],
  ['Horizontal pair', 'border-x'],
  ['Vertical pair', 'border-y'],
] as const

export const BorderTest = (): JSX.Element => (
  <section aria-label="Border foundation" className="my-12 space-y-6">
    <h2 className="v2-text-section-title">Borders and focus</h2>
    <p className="v2-text-body">
      Use 0, 1 or 2px borders with solid or dashed strokes. Emphasis changes color, not thickness.
    </p>
    <p className="v2-text-body">
      Focus foundation rule: a 4px ring using the focus-ring color, no gap, shown with
      focus-visible. Preserve error borders and avoid layout shifts. Apply and validate this rule
      one component at a time as each component is designed; component adoption is pending.
    </p>
    <div className="grid gap-6 xl:grid-cols-2">
      {(['light', 'dark'] as const).map((mode) => (
        <ColorTheme
          key={mode}
          mode={mode}
          aria-label={`Borders ${mode}`}
          className="v2-text-body min-w-0 space-y-8 bg-canvas p-6 text-text-default"
        >
          <h3 className="v2-text-label capitalize">{mode}</h3>
          <div className="space-y-3">
            <h4 className="v2-text-label">Width</h4>
            {widths.map(([utility, value]) => (
              <div key={utility} className={`${utility} rounded-md border-border-default p-3`}>
                {utility} · {value}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="v2-text-label">Style</h4>
            <div className="rounded-md border border-solid border-border-default p-3">Solid</div>
            <div className="rounded-md border-2 border-dashed border-border-default p-3">
              Dashed · Drop zone specimen
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <h4 className="v2-text-label col-span-2">Placement</h4>
            {placements.map(([label, utility]) => (
              <div key={utility} className={`${utility} border-border-default p-3`}>
                {label} · {utility}
              </div>
            ))}
            <div className="divide-y divide-border-subtle">
              <div className="p-3">Row one</div>
              <div className="p-3">Row two · divide-y</div>
            </div>
            <div className="flex divide-x divide-border-subtle">
              <div className="p-3">One</div>
              <div className="p-3">Two · divide-x</div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="v2-text-label">Semantic colors · 1px</h4>
            {borders.map(([name, utility]) => (
              <div key={name} className={`rounded-md border ${utility} p-3`}>
                {name}
              </div>
            ))}
          </div>
        </ColorTheme>
      ))}
    </div>
  </section>
)
