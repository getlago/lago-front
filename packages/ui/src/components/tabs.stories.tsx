import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, Archive, Receipt, Settings } from 'lucide-react'

import { Tabs, TabsContent, TabsCounter, TabsList, TabsTrigger } from './tabs'
import docs from './tabs.md?raw'

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

const sectionIcons: Record<string, JSX.Element> = {
  Activity: <Activity aria-hidden="true" />,
  Invoices: <Receipt aria-hidden="true" />,
  Settings: <Settings aria-hidden="true" />,
  Archived: <Archive aria-hidden="true" />,
}

const sectionCounts: Record<string, number> = { Overview: 12, Invoices: 24, Archived: 3 }

const meta = {
  title: 'Components/Tabs',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <Tabs defaultValue="Overview">
      <TabsList aria-label="Customer sections">
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
      {['Overview', 'Activity', 'Settings'].map((label) => (
        <TabsContent key={label} value={label}>
          {label} panel
        </TabsContent>
      ))}
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="Overview" orientation="vertical" className="flex items-start gap-6">
      <TabsList aria-label="Customer sections">
        {sections.map((label) => (
          <TabsTrigger
            key={label}
            value={label}
            className="justify-start"
            disabled={label === 'Archived'}
          >
            {sectionIcons[label]}
            <span className="v2-text-label min-w-0 flex-1 text-left">{label}</span>
            {sectionCounts[label] !== undefined && <TabsCounter value={sectionCounts[label]} />}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((label) => (
        <TabsContent key={label} value={label}>
          {label} panel
        </TabsContent>
      ))}
    </Tabs>
  ),
}
