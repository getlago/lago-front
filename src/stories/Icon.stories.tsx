import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Icon } from '~/components/designSystem'

import { decorators } from '../../.storybook/preview'

export default {
  title: 'Design System/Icon',
  component: Icon,
  decorators,
  argTypes: {
    className: { table: { disable: true } },
  },
} as ComponentMeta<typeof Icon>

const Template: ComponentStory<typeof Icon> = (props) => <Icon {...props} />

export const Default = Template.bind({})
Default.args = {
  color: undefined,
  animation: undefined,
  size: 'medium',
  name: 'alphabet',
}
