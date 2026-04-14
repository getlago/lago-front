import { useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { QuoteDetailsTabsOptionsEnum, QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import OrderFormsList from './OrderFormsList'
import QuoteDetailsActivityLogs from './QuoteDetailsActivityLogs'
import QuoteDetailsVersions from './QuoteDetailsVersions'
import { useQuote } from './useQuotes'

const QuoteDetails = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading } = useQuote(quoteId)

  useEffect(() => {
    if (!loading && !quote) {
      navigate(QUOTES_LIST_ROUTE, { replace: true })
    }
  }, [loading, quote, navigate])

  const activeTabContent = useMainHeaderTabContent()

  const getViewSubtitle = () => {
    return quote ? `${quote.customer.name} - ${quote.customer.externalId}` : ''
  }

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_17757391860814p20fr87x9g'),
            path: generatePath(QUOTES_TAB_ROUTE, {
              tab: QuotesTabsOptionsEnum.quotes,
            }),
          },
        ]}
        entity={{
          viewName: quote?.number ?? '',
          viewNameLoading: loading,
          metadata: getViewSubtitle(),
          metadataLoading: loading,
        }}
        tabs={[
          {
            title: translate('text_17758226782042kygnyzs2nh'),
            link: generatePath(QUOTE_DETAILS_ROUTE, {
              quoteId: quoteId as string,
              tab: QuoteDetailsTabsOptionsEnum.overview,
            }),
            content: quote ? <QuoteDetailsVersions quote={quote} /> : null,
          },
          {
            title: translate('text_17757461968258p4ij8g74zp'),
            link: generatePath(QUOTE_DETAILS_ROUTE, {
              quoteId: quoteId as string,
              tab: QuoteDetailsTabsOptionsEnum.orderForms,
            }),
            content: <OrderFormsList />,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(QUOTE_DETAILS_ROUTE, {
              quoteId: quoteId as string,
              tab: QuoteDetailsTabsOptionsEnum.activityLogs,
            }),
            content: quote ? <QuoteDetailsActivityLogs quote={quote} /> : null,
          },
        ]}
      />

      <>{activeTabContent}</>
    </>
  )
}

export default QuoteDetails
