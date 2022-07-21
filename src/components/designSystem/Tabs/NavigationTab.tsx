import { ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { useLocation, matchPath } from 'react-router-dom'
import _omit from 'lodash/omit'

import { theme, NAV_HEIGHT } from '~/styles'

import { ButtonLink, ButtonLinkProps } from '../ButtonLink'
import { Icon } from '../Icon'

enum NavigationTabAlignEnum {
  left = 'left',
  center = 'center',
  superLeft = 'superLeft',
}

enum NavigationTabOrientationEnum {
  vertical = 'vertical',
  horizontal = 'horizontal',
}

export interface NavigationTabProps extends Omit<ButtonLinkProps, 'to'> {
  link: string
  match?: string[]
  hidden?: boolean
  component?: ReactNode
}

interface NavigationTabsProps {
  name?: string
  tabs: NavigationTabProps[]
  align?: keyof typeof NavigationTabAlignEnum
  loading?: boolean
  loadingComponent?: ReactNode
  component?: ReactNode
  children?: ReactNode
  orientation?: keyof typeof NavigationTabOrientationEnum
  onClick?: (tab: NavigationTabProps) => void
}

export const NavigationTab = ({
  name = '',
  tabs,
  align = NavigationTabAlignEnum.left,
  loading,
  loadingComponent,
  orientation = NavigationTabOrientationEnum.horizontal,
  children,
  onClick,
}: NavigationTabsProps) => {
  const { pathname } = useLocation()
  const activeTab = tabs.find(
    (tab) => tab.link === pathname || !!tab.match?.find((path) => !!matchPath(path, pathname))
  )

  return (
    <Container>
      <TabsBlock className={`navigation-tab--${orientation}`} $align={align}>
        {tabs.map((tab, i) => {
          const { link, hidden, ...props } = tab

          if (hidden) return null

          return (
            <ButtonLink
              key={`${i}-${name}-${link}`}
              to={link}
              active={link === activeTab?.link}
              onClick={!!onClick ? () => onClick(tab) : undefined}
              {..._omit(props, 'children')}
            />
          )
        })}
      </TabsBlock>
      {loading ? (
        loadingComponent ? (
          loadingComponent
        ) : (
          <Loader>
            <Icon name="processing" color="info" size="large" animation="spin" />
          </Loader>
        )
      ) : (
        activeTab?.component || children
      )}
    </Container>
  )
}

const TabsBlock = styled.div<{
  $align: keyof typeof NavigationTabAlignEnum
}>`
  display: flex;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  width: 100%;

  &.navigation-tab--horizontal {
    overflow: auto;
    box-shadow: ${theme.shadows[7]};
    flex-direction: row;
    height: ${NAV_HEIGHT}px;
    align-items: center;

    > * {
      &:not(:last-child) {
        margin-right: ${theme.spacing(3)};
      }
    }

    ${({ $align }) =>
      $align === NavigationTabAlignEnum.left
        ? css`
            padding: ${theme.spacing(4)} ${theme.spacing(12)};

            ${theme.breakpoints.down('sm')} {
              padding: ${theme.spacing(4)};
            }
          `
        : $align === NavigationTabAlignEnum.superLeft
        ? css`
            padding: ${theme.spacing(4)} 0;

            ${theme.breakpoints.down('sm')} {
              padding: ${theme.spacing(4)};
            }
          `
        : css`
            > * {
              flex: 1;
            }
          `}
  }

  &.navigation-tab--vertical {
    box-shadow: none;
    flex-direction: column;
    padding: 0;
    overflow: visible;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(1)};
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
