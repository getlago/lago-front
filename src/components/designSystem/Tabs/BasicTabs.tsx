import { ReactNode, useEffect } from 'react'
import styled from 'styled-components'
import clsns from 'classnames'

import { theme, NAV_HEIGHT } from '~/styles'

import { TabButton } from './TabButton'

import { IconName, Icon } from '../Icon'

export type TBasicTab = {
  title: string
  key?: string
  icon?: IconName | ReactNode
  component?: ReactNode
  hidden?: boolean
} & Record<string, unknown>

export interface BasicTabsProps {
  name?: string
  tabs: TBasicTab[]
  align?: 'left' | 'center' | 'superLeft'
  value: number | string
  className?: string
  loading?: boolean
  loadingComponent?: ReactNode
  onClick: (index: number, key?: string) => unknown
}

export const BasicTabs = ({
  tabs,
  name = 'tab',
  value,
  align = 'left',
  className,
  loading,
  loadingComponent,
  onClick,
}: BasicTabsProps) => {
  const safeValue = !value || value < 0 ? 0 : value
  const activeIndex =
    typeof safeValue === 'string' ? tabs.findIndex((tab) => tab.key === safeValue) : safeValue

  useEffect(() => {
    const currentTab = tabs[activeIndex]

    if (currentTab.hidden) {
      const firstTabVisibleIndex = tabs.findIndex((tab) => !tab.hidden)

      onClick(firstTabVisibleIndex, tabs[firstTabVisibleIndex]?.key)
    }
  }, [activeIndex, tabs, onClick])

  return (
    <Container className={className}>
      <TabsButtons className={clsns(`tabs-buttons--${align}`)}>
        {tabs.map(({ title, icon, key, hidden }, i) => {
          if (hidden) return null

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
      {loading ? (
        loadingComponent ? (
          loadingComponent
        ) : (
          <Loader>
            <Icon name="processing" color="info" size="large" animation="spin" />
          </Loader>
        )
      ) : (
        !!tabs[activeIndex].component && tabs[activeIndex].component
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

  &.tabs-buttons--superLeft {
    padding: ${theme.spacing(4)} 0;

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

const Loader = styled.div`
  height: 160px;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
`
