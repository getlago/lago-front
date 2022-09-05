import { Outlet } from 'react-router-dom'
import { withRouter } from 'storybook-addon-react-router-v6'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import styled, { css } from 'styled-components'

import { NavigationTab, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { decorators } from '../../.storybook/preview'

const ChildContainer = styled.div<{ $vertical?: boolean }>`
  ${({ $vertical }) =>
    $vertical
      ? css`
          margin-left: ${theme.spacing(6)};
        `
      : css`
          margin-top: ${theme.spacing(6)};
        `}
`

export default {
  title: 'Design System/NavigationTab',
  component: NavigationTab,
  decorators: [...decorators, withRouter],
  argTypes: {
    loadingComponent: {
      options: ['None', 'ReactNode'],
      defaultValue: 'None',
      mapping: {
        None: undefined,
        ReactNode: <ChildContainer>I&apos;m a custom loader...</ChildContainer>,
      },
    },
    name: { table: { disable: true } },
    orientation: { table: { disable: true } },
  },
} as ComponentMeta<typeof NavigationTab>

const Template: ComponentStory<typeof NavigationTab> = (props) => <NavigationTab {...props} />

export const Default = Template.bind({})
Default.args = {
  loading: false,
  align: 'left',
  orientation: 'horizontal',
  tabs: [
    {
      title: 'Tab 1',
      link: '/',
      component: (
        <ChildContainer>
          <Typography color="primary600">Displaying tab 1</Typography>
        </ChildContainer>
      ),
    },
    {
      title: 'Tab 2',
      link: '/tab2',
      component: (
        <ChildContainer>
          <Typography color="success600">Displaying tab 2</Typography>
        </ChildContainer>
      ),
    },
    {
      title: 'Tab 3',
      link: '/tab3',
      component: (
        <ChildContainer>
          <Typography color="danger600">Displaying tab 3</Typography>
        </ChildContainer>
      ),
    },
  ],
}

const VerticalTemplate: ComponentStory<typeof NavigationTab> = (props) => (
  <>
    <NavigationTab {...props} />
    <Outlet />
  </>
)

export const Vertical = VerticalTemplate.bind({})
Vertical.argTypes = {
  align: { table: { disable: true } },
}
Vertical.args = {
  orientation: 'vertical',
  loading: false,
  tabs: [
    {
      title: 'Tab 1',
      link: '/',
      component: (
        <ChildContainer $vertical>
          <Typography color="primary600">Displaying tab 1</Typography>
        </ChildContainer>
      ),
    },
    {
      title: 'Tab 2',
      link: '/tab2',
      component: (
        <ChildContainer $vertical>
          <Typography color="success600">Displaying tab 2</Typography>
        </ChildContainer>
      ),
    },
    {
      title: 'Tab 3',
      link: '/tab3',
      component: (
        <ChildContainer $vertical>
          <Typography color="danger600">Displaying tab 3</Typography>
        </ChildContainer>
      ),
    },
  ],
}
