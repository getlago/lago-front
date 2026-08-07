import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  ProductDetailsTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { Link, PRODUCT_DETAILS_ROUTE, PRODUCT_FILTER_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  RateCardBillingTimingEnum,
  RateCardForDrawerFragmentDoc,
  useGetRateCardForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { usePermissions } from '~/hooks/usePermissions'

import { InvoicingStrategy, mapInvoiceFieldsToStrategy } from '../drawers/rateCard/constants'
import {
  RATE_CARD_CURRENCY_LABEL_KEY,
  RATE_CARD_PRICING_UNIT_LABEL_KEY,
  RATE_CARD_PRODUCT_ITEM_LABEL_KEY,
} from '../drawers/rateCard/RateCardDrawerContent'
import {
  RATE_CARD_DRAWER_TITLE_EDIT_KEY,
  useRateCardDrawer,
} from '../drawers/rateCard/useRateCardDrawer'

export const RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID = 'rate-card-details-overview-edit'

// New translation keys are exported as named constants (feature convention).
export const RATE_CARD_DETAILS_OVERVIEW_NAME_LABEL_KEY = 'text_1784930440656rjmo1lmed8k'
export const RATE_CARD_DETAILS_OVERVIEW_CODE_LABEL_KEY = 'text_178493044065618ejwmmneyl'
export const RATE_CARD_DETAILS_OVERVIEW_BILLING_TIMING_LABEL_KEY = 'text_1784930440656zu20xor7y71'
export const RATE_CARD_DETAILS_OVERVIEW_WALLET_TARGETABLE_LABEL_KEY =
  'text_17849304406576mhltomszbh'
export const RATE_CARD_DETAILS_OVERVIEW_PRODUCT_ITEM_FILTER_LABEL_KEY =
  'text_17849304406579sbwz4df14p'

const YES_TRANSLATION_KEY = 'text_1764160009979jzn4xunn1z8'
const NO_TRANSLATION_KEY = 'text_176416000997957yqelmt2m2'

const BILLING_TIMING_TRANSLATION_KEY: Record<RateCardBillingTimingEnum, string> = {
  [RateCardBillingTimingEnum.Advance]: 'text_646e2d0cc536351b62ba6faa',
  [RateCardBillingTimingEnum.Arrears]: 'text_646e2d0cc536351b62ba6f8c',
}

const INVOICING_STRATEGY_TRANSLATION_KEY: Record<InvoicingStrategy, string> = {
  invoiceable: 'text_66968fba80f8f89a8aefdebf',
  regroupPaidFees: 'text_66968fba80f8f89a8aefdec0',
  none: 'text_6682c52081acea9052074686',
}

gql`
  fragment RateCardForDetailsOverview on RateCard {
    id
    name
    code
    description
    currency
    appliedPricingUnitCode
    billingTiming
    displayOnInvoice
    regroupPaidFees
    proration
    walletTargetable
    product {
      id
      name
      code
    }
    productFilter {
      id
      name
      code
    }
    ...RateCardForDrawer
  }

  query getRateCardForDetailsOverview($id: ID!) {
    rateCard(id: $id) {
      id
      ...RateCardForDetailsOverview
    }
  }

  ${RateCardForDrawerFragmentDoc}
`

const RateCardDetailsOverview = ({ rateCardId }: { rateCardId: string }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditRateCardDrawer } = useRateCardDrawer()
  const { pricingUnits } = useCustomPricingUnits()

  const { data, loading } = useGetRateCardForDetailsOverviewQuery({
    variables: { id: rateCardId },
    skip: !rateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const rateCard = data?.rateCard

  if (!rateCard && loading) {
    return <DetailsPage.Skeleton />
  }

  // The details shell redirects on a not-found rate card, so render nothing
  // rather than a grid of empty placeholders during that brief window.
  if (!rateCard) {
    return null
  }

  const { product, productFilter } = rateCard

  const attachedProduct = (
    <Link
      to={generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })}
    >
      <Typography variant="body" color="grey700">
        {product.name}
      </Typography>
    </Link>
  )

  const attachedProductFilter = productFilter ? (
    <Link
      to={generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
        productFilterId: productFilter.id,
        tab: ProductFilterDetailsTabsOptionsEnum.overview,
      })}
    >
      <Typography variant="body" color="grey700">
        {productFilter.name}
      </Typography>
    </Link>
  ) : (
    '-'
  )

  const code = (
    <TypographyWithCopy variant="body" color="grey700">
      {rateCard.code}
    </TypographyWithCopy>
  )

  const invoicingStrategy = mapInvoiceFieldsToStrategy({
    displayOnInvoice: rateCard.displayOnInvoice,
    regroupPaidFees: rateCard.regroupPaidFees,
  })

  const pricingUnit = pricingUnits.find((unit) => unit.code === rateCard.appliedPricingUnitCode)

  const currencyOrPricingUnitRow = rateCard.appliedPricingUnitCode
    ? {
        label: translate(RATE_CARD_PRICING_UNIT_LABEL_KEY),
        value: pricingUnit?.name || rateCard.appliedPricingUnitCode,
      }
    : {
        label: translate(RATE_CARD_CURRENCY_LABEL_KEY),
        value: rateCard.currency || '-',
      }

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_628cf761cbe6820138b8f2e4')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_178492522781766xwbos8bso')}
          </Typography>
        </div>
        {hasPermissions(['rateCardsUpdate']) && (
          <Button
            variant="inline"
            data-test={RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID}
            onClick={() => openEditRateCardDrawer({ rateCard })}
          >
            {translate(RATE_CARD_DRAWER_TITLE_EDIT_KEY)}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            { label: translate(RATE_CARD_PRODUCT_ITEM_LABEL_KEY), value: attachedProduct },
            {
              label: translate(RATE_CARD_DETAILS_OVERVIEW_PRODUCT_ITEM_FILTER_LABEL_KEY),
              value: attachedProductFilter,
            },
            { label: translate(RATE_CARD_DETAILS_OVERVIEW_NAME_LABEL_KEY), value: rateCard.name },
            { label: translate(RATE_CARD_DETAILS_OVERVIEW_CODE_LABEL_KEY), value: code },
          ]}
        />

        {!!rateCard.description && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_6388b923e514213fed58331c')}
            value={rateCard.description}
          />
        )}

        <DetailsPage.InfoGrid
          grid={[
            currencyOrPricingUnitRow,
            {
              label: translate(RATE_CARD_DETAILS_OVERVIEW_BILLING_TIMING_LABEL_KEY),
              value: translate(BILLING_TIMING_TRANSLATION_KEY[rateCard.billingTiming]),
            },
            {
              label: translate('text_6682c52081acea90520744ca'),
              value: translate(INVOICING_STRATEGY_TRANSLATION_KEY[invoicingStrategy]),
            },
            {
              label: translate('text_177488074309762bkd4znl3p'),
              value: rateCard.proration
                ? translate(YES_TRANSLATION_KEY)
                : translate(NO_TRANSLATION_KEY),
            },
            {
              label: translate(RATE_CARD_DETAILS_OVERVIEW_WALLET_TARGETABLE_LABEL_KEY),
              value: rateCard.walletTargetable
                ? translate(YES_TRANSLATION_KEY)
                : translate(NO_TRANSLATION_KEY),
            },
          ]}
        />
      </div>
    </section>
  )
}

export default RateCardDetailsOverview
