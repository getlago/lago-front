import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { NavigationTab, Typography } from '~/components/designSystem'
import {
  EMAILS_SETTINGS_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  MEMBERS_ROUTE,
  ORGANIZATION_INFORMATIONS_ROUTE,
  SETTINGS_ROUTE,
  TAXES_SETTINGS_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PageHeader } from '~/styles'
import { NAV_HEIGHT } from '~/styles'

const Settings = () => {
  const { translate } = useInternationalization()
  const tabsOptions = [
    {
      title: translate('text_62ab2d0396dd6b0361614d1c'),
      link: ORGANIZATION_INFORMATIONS_ROUTE,
      match: [ORGANIZATION_INFORMATIONS_ROUTE, SETTINGS_ROUTE],
    },
    {
      title: translate('text_62bb10ad2a10bd182d00202d'),
      link: INVOICE_SETTINGS_ROUTE,
      match: [INVOICE_SETTINGS_ROUTE],
    },
    {
      title: translate('text_645bb193927b375079d28a8f'),
      link: TAXES_SETTINGS_ROUTE,
      match: [TAXES_SETTINGS_ROUTE],
    },
    {
      title: translate('text_6407684eaf41130074c4b2a1'),
      link: EMAILS_SETTINGS_ROUTE,
    },
    {
      title: translate('text_62b1edddbf5f461ab9712733'),
      link: INTEGRATIONS_ROUTE,
    },
    {
      title: translate('text_63208b630aaf8df6bbfb2655'),
      link: MEMBERS_ROUTE,
    },
  ]

  return (
    <div>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62728ff857d47b013204c73a')}
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

export default Settings
