import { useEffect, useMemo } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import OrderFormsList from './OrderFormsList'
import QuotesList from './QuotesList'

const Quotes = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === QUOTES_LIST_ROUTE) {
      navigate(
        generatePath(QUOTES_TAB_ROUTE, {
          tab: QuotesTabsOptionsEnum.quotes,
        }),
        { replace: true },
      )
    }
  }, [pathname, navigate])

  const tabs = useMemo(
    () => [
      {
        title: translate('text_17757391860814p20fr87x9g'),
        link: generatePath(QUOTES_TAB_ROUTE, {
          tab: QuotesTabsOptionsEnum.quotes,
        }),
        match: [
          QUOTES_LIST_ROUTE,
          generatePath(QUOTES_TAB_ROUTE, {
            tab: QuotesTabsOptionsEnum.quotes,
          }),
        ],
        content: <QuotesList />,
      },
      {
        title: translate('text_17757461968258p4ij8g74zp'),
        link: generatePath(QUOTES_TAB_ROUTE, {
          tab: QuotesTabsOptionsEnum.orderForms,
        }),
        content: <OrderFormsList />,
      },
    ],
    [translate],
  )

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_17757391860814p20fr87x9g'),
        }}
        tabs={tabs}
      />

      {activeTabContent}
    </>
  )
}

export default Quotes
