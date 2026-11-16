import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleCheck } from 'lucide-react'

import { Badge, BadgeProps } from './badge'
import docs from './badge.md?raw'

const variants: NonNullable<BadgeProps['variant']>[] = [
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
  'disabled',
  'outline',
]

const meta = {
  title: 'Components/Badge',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Badge,
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
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
    </div>
  ),
}
