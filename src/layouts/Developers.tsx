import { Outlet } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { DEBUGGER_ROUTE, WEBHOOK_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const Developers = () => {
  const { translate } = useInternationalization()
  const tabsOptions = [
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
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6271200984178801ba8bdebe')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>
      <NavigationTab className="px-4 md:px-12" tabs={tabsOptions} />
      <Outlet />
    </>
  )
}

export default Developers
