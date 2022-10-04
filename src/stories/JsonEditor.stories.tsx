import { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { JsonEditor } from '~/components/form'

import { decorators } from '../../.storybook/preview'

export default {
  title: 'Form/JsonEditor',
  component: JsonEditor,
  decorators,
  argTypes: {
    value: { table: { disable: true } },
    name: { table: { disable: true } },
  },
} as ComponentMeta<typeof JsonEditor>

const Template: ComponentStory<typeof JsonEditor> = (props) => {
  const [value, setValue] = useState<string | undefined>()

  return <JsonEditor {...props} value={value} onChange={(v) => setValue(v)} />
}

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  error: undefined,
  infoText: 'Info text',
  helperText: 'Helper text',
  placeholder: 'Placeholder',
  disabled: false,
}
