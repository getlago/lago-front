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
  RateCardRateDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  PRODUCT_CATALOG_TAB_ROUTE,
  RATE_CARD_DETAILS_ROUTE,
  RATE_CARD_RATE_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  LagoApiError,
  RateCardForRateDetailsFragment,
  RateCardForRateDetailsFragmentDoc,
  RateCardForRateDrawerFragment,
  RateCardForRateDrawerFragmentDoc,
  RateCardRateForDeleteRateCardRateDialogFragmentDoc,
  RateCardRateForDetailsFragment,
  RateCardRateForDrawerFragmentDoc,
  useGetRateCardRateForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import RateCardRateDetailsOverview from './RateCardRateDetailsOverview'

import { useDeleteRateCardRateDialog } from '../dialogs/useDeleteRateCardRateDialog'
import {
  isRateCardRateDeletable,
  isRateCardRateEditable,
  RATE_CARD_RATE_DELETE_ACTION_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
} from '../drawers/rateCardRate/constants'
import { useRateCardRateDrawer } from '../drawers/rateCardRate/useRateCardRateDrawer'

gql`
  fragment RateCardRateForDetails on RateCardRate {
    id
    ...RateCardRateForDrawer
    ...RateCardRateForDeleteRateCardRateDialog
  }

  query getRateCardRateForDetails($rateId: ID!, $rateCardId: ID!) {
    rateCardRate(id: $rateId) {
      id
      ...RateCardRateForDetails
    }
    rateCard(id: $rateCardId) {
      id
      ...RateCardForRateDetails
      ...RateCardForRateDrawer
    }
  }

  ${RateCardRateForDrawerFragmentDoc}
  ${RateCardRateForDeleteRateCardRateDialogFragmentDoc}
  ${RateCardForRateDetailsFragmentDoc}
  ${RateCardForRateDrawerFragmentDoc}
`

export const RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID = 'rate-card-rate-details-actions'
export const RATE_CARD_RATE_DETAILS_EDIT_TEST_ID = 'rate-card-rate-details-edit'
export const RATE_CARD_RATE_DETAILS_DELETE_TEST_ID = 'rate-card-rate-details-delete'

// New translation keys are exported as named constants (feature convention).
/** The query selects both card fragments, so the snapshot builder can read either half. */
type RateCardForRateDetailsAndDrawerFragment = RateCardForRateDetailsFragment &
  RateCardForRateDrawerFragment

export const RATE_CARD_RATE_BREADCRUMB_KEY = 'text_1787737220228sofw78j0u83'
export const RATE_CARD_RATE_NOT_FOUND_KEY = 'text_1787737220228b97cdfac4py'

const PRODUCT_CATALOG_RATE_CARDS_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.rateCards,
})

/**
 * The MainHeader config snapshot strips functions, so the tab content and the action closures
 * capture the rate from the last push and are only re-pushed when this key changes. It must
 * therefore encode every mutable field they depend on - including the pricing values the
 * drawer exists to change, which the header itself never displays.
 */
export const buildRateCardRateSnapshotKey = ({
  rate,
  rateCard,
}: {
  rate?: RateCardRateForDetailsFragment | null
  rateCard?: RateCardForRateDetailsAndDrawerFragment | null
}): string =>
  [
    rate?.status,
    rate?.code,
    rate?.effectiveFrom,
    rate?.rateModel,
    rate?.billingIntervalCount,
    rate?.billingIntervalUnit,
    rate?.minAmountCents,
    rate?.appliedPricingUnitConversionRate,
    JSON.stringify(rate?.rateProperties),
    rateCard?.attachedToSubscriptions,
    rateCard?.attachedToPlanOrSubscription,
    rateCard?.activeRate?.effectiveFrom,
  ].join('|')

const RateCardRateDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { rateCardId, rateId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openRateDrawer } = useRateCardRateDrawer()
  const { openDeleteRateCardRateDialog } = useDeleteRateCardRateDialog()

  const { data, loading, error } = useGetRateCardRateForDetailsQuery({
    variables: { rateId: rateId as string, rateCardId: rateCardId as string },
    skip: !rateId || !rateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const rate = data?.rateCardRate
  const rateCard = data?.rateCard

  // The rates tab of the parent card is the natural fallback; the card itself may be gone too,
  // in which case its own details page redirects on to the rate cards list.
  const rateCardRatesPath = rateCardId
    ? generatePath(RATE_CARD_DETAILS_ROUTE, {
        rateCardId,
        tab: RateCardDetailsTabsOptionsEnum.rates,
      })
    : PRODUCT_CATALOG_RATE_CARDS_PATH

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: rateCardRatesPath,
    translateKey: RATE_CARD_RATE_NOT_FOUND_KEY,
  })

  const canEdit = !!rate && !!rateCard && isRateCardRateEditable({ rate, rateCard })

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID,
      items: [
        {
          label: translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY),
          dataTest: RATE_CARD_RATE_DETAILS_EDIT_TEST_ID,
          hidden: !hasPermissions(['rateCardsUpdate']) || !canEdit,
          onClick: (closePopper) => {
            if (rate && rateCard) openRateDrawer({ rateCard, rate })
            closePopper()
          },
        },
        {
          label: translate(RATE_CARD_RATE_DELETE_ACTION_KEY),
          dataTest: RATE_CARD_RATE_DETAILS_DELETE_TEST_ID,
          hidden: !hasPermissions(['rateCardsDelete']) || !rate || !isRateCardRateDeletable(rate),
          onClick: (closePopper) => {
            if (rate) {
              openDeleteRateCardRateDialog({
                rate,
                callback: () => navigate(rateCardRatesPath),
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
        snapshotKey={buildRateCardRateSnapshotKey({ rate, rateCard })}
        breadcrumb={[
          {
            label: translate('text_1783019143196z1oi70j03vt'),
            path: PRODUCT_CATALOG_RATE_CARDS_PATH,
          },
          { label: rateCard?.name || '', path: rateCardRatesPath },
          { label: translate(RATE_CARD_RATE_BREADCRUMB_KEY) },
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
            link: generatePath(RATE_CARD_RATE_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              rateId: rateId as string,
              tab: RateCardRateDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                {!!rate && !!rateCard && (
                  <RateCardRateDetailsOverview
                    rate={rate}
                    rateCard={rateCard}
                    onEdit={canEdit ? () => openRateDrawer({ rateCard, rate }) : undefined}
                  />
                )}
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(RATE_CARD_RATE_DETAILS_ROUTE, {
              rateCardId: rateCardId as string,
              rateId: rateId as string,
              tab: RateCardRateDetailsTabsOptionsEnum.activityLogs,
            }),
            // Intentionally empty: activity logs are emitted against the parent rate card, and
            // `ResourceTypeEnum` has no rate member yet, so there is nothing to scope to this
            // rate. Wired up in BIL-594.
            content: <DetailsPage.Container />,
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default RateCardRateDetails
