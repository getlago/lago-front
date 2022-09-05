import { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { TextInput } from '~/components/form'

import { decorators } from '../../.storybook/preview'

export default {
  title: 'Form/TextInput',
  component: TextInput,
  decorators,
  argTypes: {
    beforeChangeFormatter: {
      options: ['int', 'decimal', 'positiveNumber', 'code', 'chargeDecimal'],
    },
    value: { table: { disable: true } },
    name: { table: { disable: true } },
  },
} as ComponentMeta<typeof TextInput>

const Template: ComponentStory<typeof TextInput> = (props) => {
  const [value, setValue] = useState<string | undefined>()

  return <TextInput {...props} value={value} onChange={(v) => setValue(v)} />
}

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  error: false,
  infoText: 'Info text',
  password: false,
  cleanable: false,
  helperText: 'Helper text',
  placeholder: 'Placeholder',
}
