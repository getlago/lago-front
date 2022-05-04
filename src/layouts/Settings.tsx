import { Outlet } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { PageHeader } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, BasicTabs } from '~/components/designSystem'
import { VAT_RATE_ROUTE, SETTINGS_ROUTE } from '~/core/router'
import { NAV_HEIGHT } from '~/styles'

const Settings = () => {
  const { translate } = useI18nContext()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tabsOptions = [
    {
      title: translate('text_62728ff857d47b013204c75a'),
      key: VAT_RATE_ROUTE,
    },
  ]

  return (
    <div>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62728ff857d47b013204c73a')}
        </Typography>
      </PageHeader>
      <BasicTabs
        tabs={tabsOptions}
        value={pathname === SETTINGS_ROUTE ? VAT_RATE_ROUTE : pathname}
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

export default Settings
