import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, NavigationTab } from '~/components/designSystem'
import { API_KEYS_ROUTE, WEBHOOK_ROUTE, DEVELOPERS_ROUTE, DEBUGGER_ROUTE } from '~/core/router'
import { NAV_HEIGHT } from '~/styles'

const Developers = () => {
  const { translate } = useInternationalization()
  const tabsOptions = [
    {
      title: translate('text_6271200984178801ba8bdeca'),
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
      <NavigationTab tabs={tabsOptions}>
        <Content>
          <Outlet />
        </Content>
      </NavigationTab>
    </div>
  )
}

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT * 2}px);
  flex-direction: column;
`

export default Developers
