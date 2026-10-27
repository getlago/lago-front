import { CircleCheck } from 'lucide-react'
import { generatePath } from 'react-router'

import { Badge, BadgeProps } from '~/components/ui/badge'
import { ColorTheme } from '~/components/ui/color-theme'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const variants: NonNullable<BadgeProps['variant']>[] = [
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
  'disabled',
  'outline',
]

export const BadgeTest = () => (
  <section aria-label="Shadcn badge showcase" className="space-y-8">
    <h2 className="v2-text-page-title">Badges</h2>
    <p className="v2-text-body">
      Static labels: small 20px, default 24px. Caption typography, 8px horizontal inset, 4px icon
      gap, 6px radius, 1px border, no shadow. Icons are 14px with strokeWidth=2.
    </p>
    {(['light', 'dark'] as const).map((mode) => (
      <ColorTheme
        key={mode}
        mode={mode}
        className="space-y-6 rounded-lg bg-canvas p-8 text-text-default"
      >
        <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'} theme</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="v2-text-caption">
              <tr>
                <th className="p-2 text-text-muted">Variant</th>
                <th className="p-2 text-text-muted">Small</th>
                <th className="p-2 text-text-muted">Default</th>
                <th className="p-2 text-text-muted">Long label</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant}>
                  <th scope="row" className="v2-text-caption p-2 text-text-muted">
                    {variant}
                  </th>
                  {(['sm', 'default'] as const).map((size) => (
                    <td key={size} className="p-2">
                      <div className="flex items-center gap-4">
                        <Badge variant={variant} size={size}>
                          Badge
                        </Badge>
                        <Badge variant={variant} size={size}>
                          <CircleCheck size={14} strokeWidth={2} aria-hidden="true" />
                          Badge
                        </Badge>
                      </div>
                    </td>
                  ))}
                  <td className="p-2">
                    <Badge variant={variant}>Awaiting payment confirmation</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="v2-text-caption">
          Disabled and Outline are visual tones, not interactive controls. Their subdued text needs
          contrast review before use for essential information.
        </p>
      </ColorTheme>
    ))}
  </section>
)

export const shadcnBadgeTab = {
  title: 'Shadcn-badge',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-badge' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <BadgeTest />
    </div>
  ),
}
