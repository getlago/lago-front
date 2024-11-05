import _omit from 'lodash/omit'
import { ReactNode } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { ButtonLink, ButtonLinkTabProps } from './ButtonLink'
import { Chip } from './Chip'
import { Icon } from './Icon'
import { Typography } from './Typography'

interface VerticalMenuProps extends Omit<ButtonLinkTabProps, 'to' | 'type' | 'children'> {
  link: string
  match?: string[]
  hidden?: boolean
  title?: string
  component?: ReactNode
  beta?: boolean
}

interface VerticalMenusProps {
  name?: string
  tabs: VerticalMenuProps[]
  loading?: boolean
  loadingComponent?: ReactNode
  component?: ReactNode
  children?: ReactNode
  onClick?: (tab: VerticalMenuProps) => void
}

export const VerticalMenu = ({
  name = '',
  tabs,
  loading,
  loadingComponent,
  children,
  onClick,
  ...props
}: VerticalMenusProps) => {
  const { translate } = useInternationalization()
  const { pathname } = useLocation()
  const activeTab = tabs.find(
    (tab) => tab.link === pathname || !!tab.match?.find((path) => !!matchPath(path, pathname)),
  )

  return (
    <div className="flex w-full flex-col overflow-visible" {...props}>
      {!loading && tabs.length > 1 && (
        <div className="flex w-full flex-1 flex-col gap-1 overflow-visible">
          {tabs.map((tab, i) => {
            const { link, hidden, title, beta, external, ...tabProps } = tab

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
                {..._omit(tabProps, ['component', 'match'])}
              >
                <div className="flex w-full flex-row items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <Typography variant="body" color="inherit" noWrap>
                      {title}
                    </Typography>
                    {!!beta && (
                      <Chip size="small" label={translate('text_65d8d71a640c5400917f8a13')} />
                    )}
                  </div>
                  {!!external && <Icon name="outside" />}
                </div>
              </ButtonLink>
            )
          })}
        </div>
      )}
      {loading ? (
        loadingComponent ? (
          loadingComponent
        ) : (
          <div className="m-auto flex h-40 w-full items-center justify-center">
            <Icon name="processing" color="info" size="large" animation="spin" />
          </div>
        )
      ) : (
        activeTab?.component || children
      )}
    </div>
  )
}
