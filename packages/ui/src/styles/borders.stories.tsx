import type { Meta, StoryObj } from '@storybook/react-vite'

const widths = [
  ['border-0', '0px'],
  ['border', '1px'],
  ['border-2', '2px'],
] as const
const borders = [
  ['border-divider', 'border-border-divider'],
  ['border-control', 'border-border-control'],
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

const BordersShowcase = (): JSX.Element => (
  <section aria-label="Border foundation" className="v2-text-body max-w-3xl space-y-8">
    <h2 className="v2-text-section-title">Borders and focus</h2>
    <p>
      Use 0, 1 or 2px borders with solid or dashed strokes. Emphasis changes color, not thickness.
    </p>
    <p>
      Focus foundation rule: a 4px ring using the focus-ring color, no gap, shown with
      focus-visible. Preserve error borders and avoid layout shifts. Apply and validate this rule
      one component at a time as each component is designed; component adoption is pending.
    </p>
    <div className="space-y-3">
      <h3 className="v2-text-label">Width</h3>
      {widths.map(([utility, value]) => (
        <div key={utility} className={`${utility} rounded-md border-border-control p-3`}>
          {utility} · {value}
        </div>
      ))}
    </div>
    <div className="space-y-3">
      <h3 className="v2-text-label">Style</h3>
      <div className="rounded-md border border-solid border-border-control p-3">Solid</div>
      <div className="rounded-md border-2 border-dashed border-border-control p-3">
        Dashed · Drop zone specimen
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <h3 className="v2-text-label col-span-2">Placement</h3>
      {placements.map(([label, utility]) => (
        <div key={utility} className={`${utility} border-border-control p-3`}>
          {label} · {utility}
        </div>
      ))}
      <div className="divide-y divide-border-divider">
        <div className="p-3">Row one</div>
        <div className="p-3">Row two · divide-y</div>
      </div>
      <div className="flex divide-x divide-border-divider">
        <div className="p-3">One</div>
        <div className="p-3">Two · divide-x</div>
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="v2-text-label">Semantic colors · 1px</h3>
      {borders.map(([name, utility]) => (
        <div key={name} className={`rounded-md border ${utility} p-3`}>
          {name}
        </div>
      ))}
    </div>
  </section>
)

const SurfacesShowcase = (): JSX.Element => (
  <section
    aria-label="Surface and elevation examples"
    className="v2-text-body grid max-w-3xl gap-8 md:grid-cols-2"
  >
    <div className="rounded-lg border border-border-divider bg-surface p-6">
      <h3 className="v2-text-label">Surface</h3>
      <p className="text-text-muted">Follows canvas; no elevation.</p>
    </div>
    <div className="rounded-lg border border-border-divider bg-surface p-6 shadow-v2-interactive">
      <h3 className="v2-text-label">Interactive</h3>
      <p className="text-text-muted">
        Secondary button and clickable card elevation; preview only.
      </p>
    </div>
    <div className="rounded-lg border border-border-divider bg-surface-floating p-6 shadow-v2-floating">
      <h3 className="v2-text-label">Floating</h3>
      <p className="text-text-muted">Toast and popover elevation.</p>
    </div>
    <div className="rounded-lg border border-border-divider bg-surface-floating p-6 shadow-v2-dialog">
      <h3 className="v2-text-label">Dialog</h3>
      <p className="text-text-muted">Dialog elevation; preview only.</p>
    </div>
  </section>
)

const meta = {
  title: 'Foundations/Borders & surfaces',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Borders: Story = {
  render: () => <BordersShowcase />,
}

export const Surfaces: Story = {
  render: () => <SurfacesShowcase />,
}
