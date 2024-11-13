import { Outlet } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { PageBannerHeader } from '~/components/layouts/Pages'
import { API_KEYS_ROUTE, DEBUGGER_ROUTE, DEVELOPERS_ROUTE, WEBHOOK_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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
    <>
      <PageBannerHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6271200984178801ba8bdebe')}
        </Typography>
      </PageBannerHeader>
      <NavigationTab className="px-4 md:px-12" tabs={tabsOptions} />
      <Outlet />
    </>
  )
}

export default Developers
