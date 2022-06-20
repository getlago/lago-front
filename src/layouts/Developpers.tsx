import { Outlet } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, BasicTabs } from '~/components/designSystem'
import { API_KEYS_ROUTE, WEBHOOK_ROUTE, DEVELOPPERS_ROUTE, DEBUGGER_ROUTE } from '~/core/router'
import { NAV_HEIGHT } from '~/styles'

const Developpers = () => {
  const { translate } = useInternationalization()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tabsOptions = [
    {
      title: translate('text_6271200984178801ba8bdeca'),
      key: API_KEYS_ROUTE,
    },
    {
      title: translate('text_6271200984178801ba8bdede'),
      key: WEBHOOK_ROUTE,
    },
    {
      title: translate('text_6298bd525e359200d5ea001a'),
      key: DEBUGGER_ROUTE,
    },
  ]

  return (
    <div>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6271200984178801ba8bdebe')}
        </Typography>
      </PageHeader>
      <BasicTabs
        tabs={tabsOptions}
        value={pathname === DEVELOPPERS_ROUTE ? API_KEYS_ROUTE : pathname}
        onClick={(_, key) => navigate(key as string)}
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

export default Developpers
