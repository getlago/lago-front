import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import docs from './select.md?raw'

import { SelectExample, SelectResetExample, SelectStates } from '../stories/select-examples'

export default {
  title: 'Components/Select',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
} satisfies Meta

export const Default = {
  render: (): JSX.Element => (
    <div className="w-[280px]">
      <SelectExample />
    </div>
  ),
}
export const States = { render: (): JSX.Element => <SelectStates /> }
export const LabelAndDescription = {
  render: (): JSX.Element => (
    <div className="w-[280px]">
      <SelectExample descriptions />
    </div>
  ),
}
export const Grouped = {
  render: (): JSX.Element => (
    <div className="w-[280px]">
      <SelectExample grouped />
    </div>
  ),
}
export const ControlledReset = { render: (): JSX.Element => <SelectResetExample /> }

export const LongList = {
  render: (): JSX.Element => {
    const items = Array.from({ length: 40 }, (_, index) => ({
      value: index,
      label: `Billing schedule ${index + 1}`,
    }))

    return (
      <div className="w-[280px]">
        <Select items={items} defaultValue={0}>
          <SelectTrigger aria-label="Billing schedule">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} {...item} />
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}
export const LongLabels = {
  render: (): JSX.Element => {
    const items = [
      { value: 'annual', label: 'Annual billing with a very long localized schedule description' },
    ]

    return (
      <div className="w-[200px]">
        <Select items={items} defaultValue="annual">
          <SelectTrigger aria-label="Billing schedule">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              {...items[0]}
              description="Descriptions can wrap inside a narrow menu without displacing the selection indicator."
            />
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const ReadOnlyFocus: StoryObj = {
  render: (): JSX.Element => (
    <div className="w-[280px]">
      <SelectExample state="Read-only" />
    </div>
  ),
  play: async ({ canvasElement }): Promise<void> => {
    const trigger = within(canvasElement).getByRole('combobox')
    const background = getComputedStyle(trigger).backgroundColor

    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveAttribute('aria-readonly', 'true')
    await expect(getComputedStyle(trigger).backgroundColor).toBe(background)
    await expect(getComputedStyle(trigger).boxShadow).not.toBe('none')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  },
}

export const CustomAccessibleName = {
  render: (): JSX.Element => (
    <div className="w-[280px]">
      <Select items={[{ value: 'month', label: 'Monthly' }]}>
        <SelectTrigger aria-label="Billing period">
          <SelectValue placeholder="Choose a billing period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="month"
            label="Monthly"
            aria-label="Monthly billing"
            description="Bill every month"
          />
        </SelectContent>
      </Select>
    </div>
  ),
}
