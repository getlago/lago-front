/* eslint-disable react/prop-types */
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { useState } from 'react'

import { Checkbox } from '~/components/form'

export default {
  title: 'Form/Checkbox',
  component: Checkbox,
  argTypes: {
    className: { table: { disable: true } },
    name: { table: { disable: true } },
    onChange: { table: { disable: true } },
    value: { table: { disable: true } },
  },
} as ComponentMeta<typeof Checkbox>

const Template: ComponentStory<typeof Checkbox> = ({ ...props }) => {
  const [isChecked, setIsChecked] = useState<boolean>(false)

  // @ts-ignore
  return (
    <Checkbox
      {...props}
      value={props.canBeIndeterminate ? undefined : isChecked}
      onChange={(_, checked) => {
        setIsChecked(checked)
      }}
    />
  )
}

export const Default = Template.bind({})
Default.args = {
  canBeIndeterminate: false,
  disabled: false,
  label: 'Click me!',
  error: '',
  className: '',
}
