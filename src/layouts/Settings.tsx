import { Outlet } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'

import { PageHeader } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, BasicTabs } from '~/components/designSystem'
import { API_KEYS_ROUTE, WEBHOOK_ROUTE } from '~/core/router'

const Settings = () => {
  const { translate } = useI18nContext()
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
        value={pathname}
        onClick={(_, key) => navigate(key as string)}
      />
      <Outlet />
    </div>
  )
}

export default Settings
