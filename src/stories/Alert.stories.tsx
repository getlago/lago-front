import { ComponentStory, ComponentMeta } from '@storybook/react'

import Maneki from './assets/maneki.png'

import { decorators } from '../../.storybook/preview'
import { Alert } from '../components/designSystem/Alert'

export default {
  title: 'Design System/Alert',
  component: Alert,
  decorators,
  argTypes: {
    ButtonProps: { table: { disable: true } },
  },
} as ComponentMeta<typeof Alert>

const Template: ComponentStory<typeof Alert> = (args) => (
  <Alert type={args.type} className={args.className}>
    {args.children}
  </Alert>
)

export const Default = Template.bind({})
Default.args = {
  type: 'info',
  children: "I'm an alert with a simple text",
}

export const ChildNode = Template.bind({})
ChildNode.args = {
  type: 'info',
  children: (
    <div>
      Children can be a <b>node</b>
      <br />
      <br />
      <img src={Maneki} alt="maneki" width="200" />
    </div>
  ),
}
