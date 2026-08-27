import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  RateCardDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE, RATE_CARD_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  LagoApiError,
  RateCardForDeleteRateCardDialogFragmentDoc,
  RateCardForDrawerFragmentDoc,
  RateCardForRateDrawerFragmentDoc,
  useGetRateCardForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import RateCardActivityLogs from './RateCardActivityLogs'
import RateCardDetailsOverview from './RateCardDetailsOverview'
import RateCardRatesTab from './RateCardRatesTab'

import { useDeleteRateCardDialog } from '../dialogs/useDeleteRateCardDialog'
import { useRateCardDrawer } from '../drawers/rateCard/useRateCardDrawer'
import { RATE_CARD_RATES_SECTION_TITLE_KEY } from '../drawers/rateCardRate/constants'

gql`
  fragment RateCardForRateCardDetails on RateCard {
    id
  }

  query getRateCardForDetails($id: ID!) {
    rateCard(id: $id) {
      id
      name
      code
      ...RateCardForRateCardDetails
      ...RateCardForDrawer
      ...RateCardForDeleteRateCardDialog
      ...RateCardForRateDrawer
    }
  }

  ${RateCardForDrawerFragmentDoc}
  ${RateCardForDeleteRateCardDialogFragmentDoc}
  ${RateCardForRateDrawerFragmentDoc}
`

export const RATE_CARDS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.rateCards,
})

export const RATE_CARD_DETAILS_ACTIONS_TEST_ID = 'rate-card-details-actions'
export const RATE_CARD_DETAILS_EDIT_TEST_ID = 'rate-card-details-edit'
export const RATE_CARD_DETAILS_DELETE_TEST_ID = 'rate-card-details-delete'

export const RATE_CARD_NOT_FOUND_KEY = 'text_1784930440657nw8iu2iml5k'

const RateCardDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { rateCardId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditRateCardDrawer } = useRateCardDrawer()
  const { openDeleteRateCardDialog } = useDeleteRateCardDialog()

  const { data, loading, error } = useGetRateCardForDetailsQuery({
    variables: { id: rateCardId as string },
    skip: !rateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: RATE_CARDS_LIST_PATH,
    translateKey: RATE_CARD_NOT_FOUND_KEY,
  })

  const rateCard = data?.rateCard

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: RATE_CARD_DETAILS_ACTIONS_TEST_ID,
      items: [
        {
          label: translate('text_17849252278173fdc5gny30g'),
          dataTest: RATE_CARD_DETAILS_EDIT_TEST_ID,
          hidden: !hasPermissions(['rateCardsUpdate']),
          onClick: (closePopper) => {
            if (rateCard) openEditRateCardDrawer({ rateCard })
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: RATE_CARD_DETAILS_DELETE_TEST_ID,
          hidden: !hasPermissions(['rateCardsDelete']),
          onClick: (closePopper) => {
            if (rateCard) {
              openDeleteRateCardDialog({
                rateCard,
                callback: () => navigate(RATE_CARDS_LIST_PATH),
              })
            }
            closePopper()
          },
        },
      ],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        // The MainHeader config snapshot strips functions, so the action
        // closures capture `rateCard` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${rateCard?.description}|${rateCard?.billingTiming}|${rateCard?.proration}|${rateCard?.attachedToPlanOrSubscription}|${rateCard?.attachedToSubscriptions}|${rateCard?.currency}|${rateCard?.appliedPricingUnitCode}|${rateCard?.walletTargetable}|${rateCard?.displayOnInvoice}|${rateCard?.regroupPaidFees}|${rateCard?.activeRate?.effectiveFrom}`}
        breadcrumb={[
          {
            label: translate('text_1783019143196z1oi70j03vt'),
            path: RATE_CARDS_LIST_PATH,
          },
          { label: translate('text_1783020794400xdy5qokafvy') },
        ]}
        entity={{
          viewName: rateCard?.name || '',
          viewNameLoading: loading,
          metadata: rateCard?.code ? (
            <TypographyWithCopy variant="body">{rateCard.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(RATE_CARD_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              tab: RateCardDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                <RateCardDetailsOverview rateCardId={rateCardId as string} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate(RATE_CARD_RATES_SECTION_TITLE_KEY),
            link: generatePath(RATE_CARD_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              tab: RateCardDetailsTabsOptionsEnum.rates,
            }),
            content: (
              <DetailsPage.Container>
                <RateCardRatesTab rateCardId={rateCardId as string} rateCard={rateCard} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(RATE_CARD_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              tab: RateCardDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(RATE_CARD_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              tab: RateCardDetailsTabsOptionsEnum.activityLogs,
            }),
            content: (
              <DetailsPage.Container>
                <RateCardActivityLogs rateCardId={rateCardId as string} />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default RateCardDetails
