import { ComponentStory, ComponentMeta } from '@storybook/react'

import Maneki from './assets/maneki.png'

import { decorators } from '../../.storybook/preview'
import { Accordion } from '../components/designSystem/Accordion'

export default {
  title: 'Design System/Accordion',
  component: Accordion,
  decorators,
  argTypes: {
    id: { table: { disable: true } },
    initiallyOpen: { table: { disable: true } },
    className: { table: { disable: true } },
    onChange: { table: { disable: true } },
  },
} as ComponentMeta<typeof Accordion>

const Template: ComponentStory<typeof Accordion> = (args) => (
  <Accordion {...args}>
    <div>
      Children can be a <b>node</b>
      <br />
      <br />
      <img src={Maneki} alt="maneki" width="200" />
    </div>
  </Accordion>
)

export const Default = Template.bind({})
Default.args = {
  size: 'medium',
  noContentMargin: false,
  summary: <div>Hello I am the summary</div>,
  collapsedTooltip: 'Expand me',
  expandedTooltip: 'Collapse me',
}
