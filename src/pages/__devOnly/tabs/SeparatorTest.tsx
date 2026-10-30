import { generatePath } from 'react-router'

import { ColorTheme } from '~/components/ui/color-theme'
import { Separator } from '~/components/ui/separator'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

export const SeparatorTest = () => (
  <section aria-label="Shadcn separator showcase" className="space-y-8">
    <h2 className="v2-text-page-title">Separator</h2>
    <p className="v2-text-body">
      A 1px divider using border-divider. The parent controls spacing and length. Vertical
      separators need a parent with an explicit height. Decorative by default; use decorative=false
      when the separator conveys a meaningful division of content.
    </p>
    {(['light', 'dark'] as const).map((mode) => (
      <ColorTheme
        key={mode}
        mode={mode}
        className="space-y-6 rounded-lg bg-canvas p-8 text-text-default"
      >
        <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'} theme</h3>
        <div className="v2-text-body space-y-4">
          <p>Account details</p>
          <Separator decorative={false} />
          <p>Billing details</p>
        </div>
        <div className="v2-text-body flex h-10 items-center gap-4">
          <span>Details</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
        </div>
      </ColorTheme>
    ))}
  </section>
)

export const shadcnSeparatorTab = {
  title: 'Shadcn-separator',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-separator' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <SeparatorTest />
    </div>
  ),
}
