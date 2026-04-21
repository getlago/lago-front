import { useEffect, useMemo } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CREATE_QUOTE_ROUTE, QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

import OrderFormsList from './OrderFormsList'
import QuotesList from './QuotesList'

export const CREATE_QUOTE_BUTTON_TEST_ID = 'create-quote-button'

const Quotes = (): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { hasPermissions } = usePermissions()
  const canCreateQuotes = hasPermissions(['quotesCreate'])
  const { isPremium } = useCurrentUser()

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
        {...(isPremium
          ? {
              tabs,
              actions: {
                items: [
                  {
                    type: 'action',
                    label: translate('text_1776238919927a1b2c3d4e5f'),
                    variant: 'primary',
                    hidden: !canCreateQuotes,
                    onClick: () => navigate(CREATE_QUOTE_ROUTE),
                    dataTest: CREATE_QUOTE_BUTTON_TEST_ID,
                  },
                ],
              },
            }
          : {})}
      />

      {isPremium && activeTabContent}

      {!isPremium && (
        <PremiumFeature
          data-test="quotes-premium-feature"
          title={translate('text_17767737688593usnzzqqy7f')}
          description={translate('text_1776773768859lvcuax763ex')}
          feature={translate('text_17757391860814p20fr87x9g')}
        />
      )}
    </>
  )
}

export default Quotes
