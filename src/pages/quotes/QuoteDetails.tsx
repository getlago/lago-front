import { useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { QuoteDetailsTabsOptionsEnum, QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE } from '~/core/router'
import { StatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useApproveQuote } from './hooks/useApproveQuote'
import { useCloneQuote } from './hooks/useCloneQuote'
import { useEditQuote } from './hooks/useEditQuote'
import { useQuote } from './hooks/useQuote'
import { useQuotes } from './hooks/useQuotes'
import { useVoidQuote } from './hooks/useVoidQuote'
import OrderFormsList from './OrderFormsList'
import QuoteDetailsActivityLogs from './QuoteDetailsActivityLogs'
import QuoteDetailsVersions from './QuoteDetailsVersions'

const QuoteDetails = (): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading } = useQuote(quoteId)
  const {
    quotes: versions,
    loading: versionsLoading,
    fetchMore,
    metadata,
  } = useQuotes(quote ? { number: [quote.number], latestVersionOnly: false } : undefined)
  const latestVersion = versions[0]

  const { hasPermissions } = usePermissions()
  const { approveQuote } = useApproveQuote()
  const { editQuote } = useEditQuote()
  const { voidQuote } = useVoidQuote()
  const { openCloneDialog } = useCloneQuote()

  useEffect(() => {
    if (loading || quote) return

    navigate(QUOTES_LIST_ROUTE, { replace: true })
  }, [loading, quote, navigate])

  const activeTabContent = useMainHeaderTabContent()

  const headerActions: MainHeaderAction[] = (() => {
    if (!latestVersion || latestVersion.status === StatusEnum.Approved) return []

    const items = []

    if (latestVersion.status === StatusEnum.Draft) {
      if (hasPermissions(['quotesApprove'])) {
        items.push({
          label: translate('text_1776414006125k6n9d1baloi'),
          startIcon: 'checkmark' as const,
          onClick: (closePopper: () => void) => {
            approveQuote(latestVersion.id)
            closePopper()
          },
        })
      }

      if (hasPermissions(['quotesUpdate'])) {
        items.push({
          label: translate('text_17764140061256c7yby4p5ze'),
          startIcon: 'pen' as const,
          onClick: (closePopper: () => void) => {
            editQuote(latestVersion.id)
            closePopper()
          },
        })
      }

      if (hasPermissions(['quotesVoid'])) {
        items.push({
          label: translate('text_1776414006125xh19d6399qv'),
          startIcon: 'stop' as const,
          onClick: (closePopper: () => void) => {
            voidQuote(latestVersion.id)
            closePopper()
          },
        })
      }
    }

    if (hasPermissions(['quotesClone'])) {
      items.push({
        label: translate('text_17764140061251m8snap6nft'),
        startIcon: 'duplicate' as const,
        onClick: (closePopper: () => void) => {
          openCloneDialog(
            latestVersion.id,
            `${latestVersion.number} - v${latestVersion.version}`,
          )
          closePopper()
        },
      })
    }

    if (items.length === 0) return []

    return [
      {
        type: 'dropdown' as const,
        label: translate('text_1776414006125pcxcyeblul7'),
        items,
      },
    ]
  })()

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
          metadata: quote ? `${quote.customer.name} - ${quote.customer.externalId}` : '',
          metadataLoading: loading,
        }}
        actions={{ items: headerActions, loading }}
        tabs={[
          {
            title: translate('text_17758226782042kygnyzs2nh'),
            link: generatePath(QUOTE_DETAILS_ROUTE, {
              quoteId: quoteId as string,
              tab: QuoteDetailsTabsOptionsEnum.overview,
            }),
            content: quote ? (
              <QuoteDetailsVersions
                quote={quote}
                versions={versions}
                versionsLoading={versionsLoading}
                fetchMore={fetchMore}
                metadata={metadata}
              />
            ) : null,
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
            content: <QuoteDetailsActivityLogs />,
          },
        ]}
      />

      <>{activeTabContent}</>
    </>
  )
}

export default QuoteDetails
