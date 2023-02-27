import { ComponentStory, ComponentMeta } from '@storybook/react'

import { decorators } from '../../.storybook/preview'
import { Chip } from '../components/designSystem/Chip'

export default {
  title: 'Design System/Chip',
  component: Chip,
  decorators,
  argTypes: {
    className: { table: { disable: true } },
    onClose: {
      options: ['canClose', 'disabled'],
      defaultValue: 'canClose',
      control: { type: 'select' },
      mapping: {
        // eslint-disable-next-line no-alert
        canClose: () => alert('You clicked !'),
        disabled: undefined,
      },
    },
  },
} as ComponentMeta<typeof Chip>

const Template: ComponentStory<typeof Chip> = (args) => <Chip {...args} />

export const Default = Template.bind({})
Default.argTypes = {
  avatarProps: { table: { disable: true } },
}
Default.args = {
  label: "I'm a Chip",
  type: 'default',
  icon: 'apps',
}

export const WithAvatar = Template.bind({})
WithAvatar.argTypes = {
  icon: { table: { disable: true } },
}
WithAvatar.args = {
  label: "I'm a Chip",
  type: 'default',
  avatarProps: {
    initials: 'LC',
    identifier: 'Lago Corp',
  },
}
