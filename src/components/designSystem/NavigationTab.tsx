import { Stack } from '@mui/material'
import _omit from 'lodash/omit'
import { ReactNode } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { NAV_HEIGHT, theme } from '~/styles'

import { BetaChip } from './BetaChip'
import { ButtonLink, ButtonLinkTabProps } from './ButtonLink'
import { Icon } from './Icon'
import { Typography } from './Typography'

enum NavigationTabAlignEnum {
  left = 'left',
  center = 'center',
  superLeft = 'superLeft',
}

enum NavigationTabOrientationEnum {
  vertical = 'vertical',
  horizontal = 'horizontal',
}

interface NavigationTabProps extends Omit<ButtonLinkTabProps, 'to' | 'type' | 'children'> {
  link: string
  match?: string[]
  hidden?: boolean
  title?: string
  component?: ReactNode
  beta?: boolean
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
    (tab) => tab.link === pathname || !!tab.match?.find((path) => !!matchPath(path, pathname)),
  )

  return (
    <Container $vertical={orientation === NavigationTabOrientationEnum.vertical}>
      {tabs.length > 1 && (
        <TabsBlock className={`navigation-tab--${orientation}`} $align={align}>
          {tabs.map((tab, i) => {
            const { link, hidden, title, beta, external, ...props } = tab

            if (hidden) return null

            return (
              <ButtonLink
                external={external}
                title={title}
                key={`${i}-${name}-${link}`}
                to={link}
                type="tab"
                active={link === activeTab?.link}
                onClick={!!onClick ? () => onClick(tab) : undefined}
                {..._omit(props, ['component', 'match'])}
              >
                <Stack
                  width="100%"
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <InlineNavLinkWrapper>
                    <Typography variant="body" color="inherit">
                      {title}
                    </Typography>
                    {!!beta && <BetaChip size="xsmall" />}
                  </InlineNavLinkWrapper>
                  {!!external && <Icon name="outside" />}
                </Stack>
              </ButtonLink>
            )
          })}
        </TabsBlock>
      )}
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

    /* Negative margin bellow allows to show the focus ring aroung buttons */
    ${({ $align }) =>
      $align === NavigationTabAlignEnum.left
        ? css`
            padding: ${theme.spacing(4)} ${theme.spacing(13)};
            margin: 0 -${theme.spacing(1)};

            ${theme.breakpoints.down('sm')} {
              padding: ${theme.spacing(4)} ${theme.spacing(5)};
              margin: 0 -${theme.spacing(1)};
            }
          `
        : $align === NavigationTabAlignEnum.superLeft
          ? css`
              padding: ${theme.spacing(4)} ${theme.spacing(1)};
              margin: 0 -${theme.spacing(1)};

              ${theme.breakpoints.down('sm')} {
                padding: ${theme.spacing(4)} ${theme.spacing(1)};
                margin: 0 -${theme.spacing(1)};
              }
            `
          : css`
              > * {
                flex: 1;
              }
            `}

    /* Prevent buttons to goes on multiple line */
    button div .MuiTypography-root {
      white-space: nowrap;
    }
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

const Container = styled.div<{ $vertical?: boolean }>`
  display: flex;
  flex-direction: ${({ $vertical }) => ($vertical ? 'row' : 'column')};
`

const InlineNavLinkWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${theme.spacing(2)};
`
