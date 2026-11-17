import type { Meta, StoryObj } from '@storybook/react-vite'

import { OverflowTabs, OverflowTabsList, OverflowTabsTrigger } from './overflow-tabs'
import docs from './overflow-tabs.md?raw'
import { TabsContent, TabsCounter } from './tabs'

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

const meta = {
  title: 'Components/OverflowTabs',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: OverflowTabs,
} satisfies Meta<typeof OverflowTabs>

export default meta

type Story = StoryObj<typeof meta>

export const Resizable: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="v2-text-caption">
        Resize the box from its bottom-right handle. Select a hidden tab from More to replace the
        last visible one.
      </div>
      <div
        className="w-full max-w-full resize-x overflow-auto pb-4"
        style={{ width: 440, minWidth: 180 }}
      >
        <OverflowTabs defaultValue="Overview">
          <OverflowTabsList aria-label="Customer sections">
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
    </div>
  ),
}
