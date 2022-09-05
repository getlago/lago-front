/* eslint-disable react/prop-types */
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Button } from '~/components/designSystem'

import { decorators } from '../../.storybook/preview'

export default {
  title: 'Design System/Button',
  component: Button,
  decorators,
  argTypes: {
    className: { table: { disable: true } },
    inheritColor: { table: { disable: true } },
  },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = ({ children, ...props }) => {
  // @ts-ignore
  return <Button {...props}>{children}</Button>
}

export const Default = Template.bind({})
Default.args = {
  danger: false,
  size: 'medium',
  align: 'center',
  loading: false,
  variant: 'primary',
  fullWidth: false,
  children: 'Label',
  disabled: false,
}
Default.argTypes = {
  icon: { table: { disable: true } },
}

export const OnlyIcon = Template.bind({})
OnlyIcon.args = {
  danger: false,
  size: 'medium',
  align: 'center',
  loading: false,
  variant: 'primary',
  fullWidth: false,
  icon: 'ascending',
  disabled: false,
}
OnlyIcon.argTypes = {
  children: { table: { disable: true } },
  startIcon: { table: { disable: true } },
  endIcon: { table: { disable: true } },
  align: { table: { disable: true } },
}
