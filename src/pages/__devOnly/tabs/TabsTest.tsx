import { Activity, Archive, Receipt, Settings } from 'lucide-react'
import { generatePath } from 'react-router'

import { ColorTheme } from '~/components/ui/color-theme'
import { OverflowTabs, OverflowTabsList, OverflowTabsTrigger } from '~/components/ui/overflow-tabs'
import { Tabs, TabsContent, TabsCounter, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const sections = [
  'Overview',
  'Activity',
  'Invoices',
  'Payments',
  'Settings',
  'Subscriptions',
  'Credit notes',
  'Archived',
]

export const TabsTest = (): JSX.Element => (
  <section aria-label="Shadcn tabs showcase" className="space-y-8">
    <h2 className="v2-text-page-title">Tabs</h2>
    <p className="v2-text-body">
      Resize the overflow example using its bottom-right handle. Select a hidden tab from More to
      replace the last visible item. Arrow keys move focus; Enter or Space selects.
    </p>
    {(['light', 'dark'] as const).map((mode) => (
      <ColorTheme
        key={mode}
        mode={mode}
        className="space-y-8 rounded-xl bg-canvas p-6 text-text-default"
      >
        <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'}</h3>
        <Tabs defaultValue="Overview">
          <TabsList aria-label={`${mode} basic tabs`}>
            <TabsTrigger value="Overview">
              <span className="v2-text-label">Overview</span>
              <TabsCounter value={12} />
            </TabsTrigger>
            <TabsTrigger value="Activity">
              <Settings aria-hidden="true" />
              <span className="v2-text-label">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="Settings">
              <span className="v2-text-label">Settings</span>
              <TabsCounter value={0} />
            </TabsTrigger>
            <TabsTrigger value="Archived" disabled>
              <span className="v2-text-label">Archived</span>
            </TabsTrigger>
          </TabsList>
          {['Overview', 'Activity'].map((label) => (
            <TabsContent key={label} value={label}>
              {label} panel
            </TabsContent>
          ))}
          <TabsContent value="Settings">Settings panel</TabsContent>
        </Tabs>
        <div
          className="w-full max-w-full resize-x overflow-auto pb-4"
          style={{ width: 440, minWidth: 180 }}
        >
          <OverflowTabs defaultValue="Overview">
            <OverflowTabsList aria-label={`${mode} customer sections`}>
              {sections.map((label) => (
                <OverflowTabsTrigger
                  key={label}
                  value={label}
                  textValue={label}
                  disabled={label === 'Archived'}
                >
                  <span className="v2-text-label truncate">{label}</span>
                  {label === 'Invoices' && <TabsCounter value={12} />}
                </OverflowTabsTrigger>
              ))}
            </OverflowTabsList>
            {sections.map((label) => (
              <TabsContent key={label} value={label}>
                {label} panel
              </TabsContent>
            ))}
          </OverflowTabs>
        </div>
        <Tabs defaultValue="Overview" orientation="vertical" className="flex items-start gap-6">
          <TabsList aria-label={`${mode} vertical tabs`}>
            {sections.map((label) => (
              <TabsTrigger
                key={label}
                value={label}
                className="justify-start"
                disabled={label === 'Archived'}
              >
                {label === 'Activity' && <Activity aria-hidden="true" strokeWidth={2} />}
                {label === 'Invoices' && <Receipt aria-hidden="true" strokeWidth={2} />}
                {label === 'Settings' && <Settings aria-hidden="true" strokeWidth={2} />}
                {label === 'Archived' && <Archive aria-hidden="true" strokeWidth={2} />}
                <span className="v2-text-label min-w-0 flex-1 text-left">{label}</span>
                {label === 'Overview' && <TabsCounter value={12} />}
                {label === 'Invoices' && <TabsCounter value={24} />}
                {label === 'Archived' && <TabsCounter value={3} />}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((label) => (
            <TabsContent key={label} value={label}>
              {label} panel — vertical list grows naturally.
            </TabsContent>
          ))}
        </Tabs>
      </ColorTheme>
    ))}
  </section>
)

export const shadcnTabsTab = {
  title: 'Shadcn-tabs',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-tabs' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <TabsTest />
    </div>
  ),
}
