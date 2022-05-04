import { ReactNode } from 'react'
import styled from 'styled-components'
import clsns from 'classnames'

import { theme, NAV_HEIGHT } from '~/styles'

import { TabButton } from './TabButton'

import { IconName } from '../Icon'

export type TBasicTab = {
  title: string
  key?: string
  icon?: IconName | ReactNode
  component?: ReactNode
} & Record<string, unknown>

export interface BasicTabsProps {
  name?: string
  tabs: TBasicTab[]
  scrollable?: boolean
  align?: 'left' | 'center'
  value: number | string
  className?: string
  onClick: (index: number, key?: string) => unknown
}

export const BasicTabs = ({
  tabs,
  name = 'tab',
  scrollable,
  value,
  align = 'left',
  className,
  onClick,
}: BasicTabsProps) => {
  const safeValue = !value || value < 0 ? 0 : value
  const activeIndex =
    typeof safeValue === 'string' ? tabs.findIndex((tab) => tab.key === safeValue) : safeValue

  return (
    <Container className={className}>
      <TabsButtons className={clsns(`tabs-buttons--${align}`)}>
        {tabs.map(({ title, icon, key }, i) => {
          return (
            <TabButton
              key={`${i}-${name}-${key || title}`}
              title={title}
              icon={icon}
              active={[i, key].includes(safeValue)}
              onClick={() => onClick(i, key)}
            />
          )
        })}
      </TabsButtons>
      {tabs[activeIndex].component && (
        <Content
          className={clsns({
            [`tabs-buttons--scrollable`]: scrollable,
          })}
        >
          {tabs[activeIndex].component}
        </Content>
      )}
    </Container>
  )
}

const TabsButtons = styled.div`
  display: flex;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  overflow: auto;
  height: ${NAV_HEIGHT}px;
  align-items: center;
  flex-direction: row;
  width: 100%;
  box-shadow: ${theme.shadows[7]};

  > * {
    &:not(:last-child) {
      margin-right: ${theme.spacing(3)};
    }
  }

  &.tabs-buttons--left {
    padding: ${theme.spacing(4)} ${theme.spacing(12)};

    ::after {
      content: '';
      padding-right: ${theme.spacing(12)};
    }

    ${theme.breakpoints.down('sm')} {
      padding: ${theme.spacing(4)};

      ::after {
        content: '';
        padding-right: ${theme.spacing(4)};
      }
    }
  }

  &.tabs-buttons--center {
    > * {
      flex: 1;
    }
  }
`

const Container = styled.div`
  display: flex;
`

const Content = styled.div`
  flex: 1;
  overflow: auto;

  &.tabs-buttons--scrollable {
    overflow-y: auto;
  }
`
