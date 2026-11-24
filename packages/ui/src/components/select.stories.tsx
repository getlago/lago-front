import type { Meta } from '@storybook/react-vite'

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
