import { Copy, Download, Plus } from 'lucide-react'
import { generatePath } from 'react-router'

import { Button } from '~/components/ui/button'
import { ColorTheme } from '~/components/ui/color-theme'
import { IconButton } from '~/components/ui/icon-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const actions = [
  { label: 'Add customer', icon: Plus },
  { label: 'Copy invoice number', icon: Copy },
  { label: 'Download invoice', icon: Download },
]

export const TooltipTest = () => (
  <TooltipProvider>
    <section aria-label="Shadcn tooltip showcase" className="space-y-8">
      <h2 className="v2-text-page-title">Tooltips</h2>
      <p className="v2-text-body">
        First hover: 300ms. Move between icons within 500ms: instant. Keyboard focus: instant.
        Escape dismisses. Keep the pointer over the tooltip to keep it open.
      </p>
      {(['light', 'dark'] as const).map((mode) => (
        <ColorTheme
          key={mode}
          mode={mode}
          className="space-y-8 rounded-lg bg-canvas p-8 text-text-default"
        >
          <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'} theme</h3>
          <div className="flex gap-4" role="group" aria-label={`${mode} icon actions`}>
            {actions.map(({ label, icon: Icon }, index) => (
              <IconButton
                key={label}
                label={label}
                variant="secondary"
                size={(['icon-sm', 'icon', 'icon-lg'] as const)[index]}
              >
                <Icon aria-hidden="true" />
              </IconButton>
            ))}
          </div>
          <p className="v2-text-caption">
            IconButton: small 32px, default 36px, large 40px. Icons remain 14px.
          </p>
          <div className="flex gap-4" role="group" aria-label={`${mode} blocked icon actions`}>
            <IconButton label="Copy unavailable" variant="secondary" disabled>
              <Copy aria-hidden="true" />
            </IconButton>
            <IconButton label="Downloading invoice" variant="secondary" loading>
              <Download aria-hidden="true" />
            </IconButton>
          </div>
          <div className="flex flex-wrap gap-6">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <Tooltip key={side}>
                <TooltipTrigger asChild>
                  <Button variant="outline">{side} placement</Button>
                </TooltipTrigger>
                <TooltipContent side={side}>Tooltip on the {side}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Paragraph example</Button>
            </TooltipTrigger>
            <TooltipContent>
              Add a new customer to your organization. You can edit their billing details later.
            </TooltipContent>
          </Tooltip>
          <p className="v2-text-caption">
            Maximum width 240px, left-aligned text, 12px horizontal / 8px vertical padding. Resize
            the window to check collision handling.
          </p>
        </ColorTheme>
      ))}
    </section>
  </TooltipProvider>
)

export const shadcnTooltipTab = {
  title: 'Shadcn-tooltip',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-tooltip' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <TooltipTest />
    </div>
  ),
}
