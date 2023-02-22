import { ComponentStory, ComponentMeta } from '@storybook/react'

import { decorators } from '../../.storybook/preview'
import { Skeleton } from '../components/designSystem/Skeleton'

export default {
  title: 'Design System/Skeleton',
  component: Skeleton,
  decorators,
  argTypes: {
    className: { table: { disable: true } },
  },
} as ComponentMeta<typeof Skeleton>

const Template: ComponentStory<typeof Skeleton> = (args) => <Skeleton {...args} />

export const Text = Template.bind({})
Text.args = {
  variant: 'text',
  width: '200px',
  height: '12px',
  marginBottom: 12,
  marginRight: 12,
}
Text.argTypes = {
  size: { table: { disable: true } },
  variant: { table: { disable: true } },
}

export const Circular = Template.bind({})
Circular.args = {
  variant: 'circular',
  width: '200px',
  height: '200px',
  marginBottom: 12,
  marginRight: 12,
}
Circular.argTypes = {
  size: { table: { disable: true } },
  variant: { table: { disable: true } },
}

export const Avatar = Template.bind({})
Avatar.args = {
  variant: 'connectorAvatar',
  size: 'large',
  marginBottom: 12,
  marginRight: 12,
}
Avatar.argTypes = {
  height: { table: { disable: true } },
  width: { table: { disable: true } },
  variant: {
    options: ['connectorAvatar', 'userAvatar'],
    defaultValue: 'connectorAvatar',
    mapping: {
      connectorAvatar: 'connectorAvatar',
      userAvatar: 'userAvatar',
    },
  },
}
