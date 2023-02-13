import { ComponentStory, ComponentMeta } from '@storybook/react'

import { decorators } from '../../.storybook/preview'
import { Chip } from '../components/designSystem/Chip'

export default {
  title: 'Design System/Chip',
  component: Chip,
  decorators,
} as ComponentMeta<typeof Chip>

const Template: ComponentStory<typeof Chip> = (args) => (
  <Chip type={args.type} label={args.label} className={args.className} />
)

export const Default = Template.bind({})
Default.argTypes = {
  avatarProps: { table: { disable: true } },
}
Default.args = {
  label: "I'm a Chip",
  type: 'default',
  icon: 'apps',
  onClose: () => {},
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
  onClose: () => {},
}
