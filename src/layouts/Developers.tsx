import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { NavigationTab, Typography } from '~/components/designSystem'
import { API_KEYS_ROUTE, DEBUGGER_ROUTE, DEVELOPERS_ROUTE, WEBHOOK_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PageHeader } from '~/styles'
import { NAV_HEIGHT } from '~/styles'

const Developers = () => {
  const { translate } = useInternationalization()
  const tabsOptions = [
    {
      title: translate('text_636df520279a9e1b3c68cc67'),
      link: API_KEYS_ROUTE,
      match: [DEVELOPERS_ROUTE, API_KEYS_ROUTE],
    },
    {
      title: translate('text_6271200984178801ba8bdede'),
      link: WEBHOOK_ROUTE,
    },
    {
      title: translate('text_6298bd525e359200d5ea001a'),
      link: DEBUGGER_ROUTE,
    },
  ]

  return (
    <div>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6271200984178801ba8bdebe')}
        </Typography>
      </PageHeader>
      <NavigationTab
        leftSpacing={{
          default: 16,
          md: 48,
        }}
        tabs={tabsOptions}
      />
      <Content>
        <Outlet />
      </Content>
    </div>
  )
}

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT * 2}px);
  flex-direction: column;
`

export default Developers
