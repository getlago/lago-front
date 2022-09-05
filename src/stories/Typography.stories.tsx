import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Typography } from '~/components/designSystem'

import { decorators } from '../../.storybook/preview'

export default {
  title: 'Design System/Typography',
  component: Typography,
  decorators,
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    component: {
      options: ['div', 'span'],
      defaultValue: 'div',
      mapping: {
        div: 'div',
        span: 'span',
      },
    },
    variant: {
      options: [
        'headline',
        'subhead',
        'bodyHl',
        'body',
        'captionHl',
        'caption',
        'captionCode',
        'note',
      ],
    },
  },
} as ComponentMeta<typeof Typography>

const Template: ComponentStory<typeof Typography> = (props) => (
  <Typography {...props}>I am a styled text</Typography>
)

export const Default = Template.bind({})
Default.args = {
  noWrap: false,
}
Default.argTypes = {
  html: { table: { disable: true } },
}

const HTMLTemplate: ComponentStory<typeof Typography> = (props) => <Typography {...props} />

export const HTML = HTMLTemplate.bind({})
HTML.args = {
  html: "I'm an <i>html</i> text",
  noWrap: false,
}
