import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Status } from '~/components/designSystem/Status'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PlanDetailsChargeWrapperSwitch } from '~/components/plans/details/PlanDetailsChargeWrapperSwitch'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { rateCardRateStatusMapping } from '~/core/constants/statusRateCardRateMapping'
import {
  ProductCategoryDetailsTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
  RateCardDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  Link,
  PRODUCT_CATEGORY_DETAILS_ROUTE,
  PRODUCT_DETAILS_ROUTE,
  PRODUCT_FILTER_DETAILS_ROUTE,
  RATE_CARD_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  RateCardBillingTimingEnum,
  RateCardForRateDetailsFragment,
  RateCardRateForDetailsFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { usePermissions } from '~/hooks/usePermissions'

import {
  BILLING_INTERVAL_UNIT_TRANSLATION_KEY,
  RATE_CARD_RATE_BILLING_INTERVAL_LABEL_KEY,
  RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY,
  RATE_CARD_RATE_MODEL_LABEL_KEY,
  RATE_CARD_RATES_SECTION_TITLE_KEY,
} from '../drawers/rateCardRate/constants'
import { toChargeModel } from '../drawers/rateCardRate/utils'

gql`
  fragment RateCardForRateDetails on RateCard {
    id
    name
    code
    currency
    appliedPricingUnitCode
    billingTiming
    product {
      id
      name
      productCategory {
        id
        name
      }
    }
    productFilter {
      id
      name
    }
  }
`

export const RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID = 'rate-card-rate-details-overview-edit'
export const RATE_CARD_RATE_DETAILS_OVERVIEW_STATUS_TEST_ID =
  'rate-card-rate-details-overview-status'

const RATE_CARD_RATE_DETAILS_PRODUCT_CATEGORY_LABEL_KEY = 'text_17877372202296ejgkqky70w'
const RATE_CARD_RATE_DETAILS_RATE_CARD_LABEL_KEY = 'text_1787737220228091rkbqj1vl'
const RATE_CARD_RATE_DETAILS_CODE_LABEL_KEY = 'text_1787737220228i16tnwmeue3'

export const RATE_CARD_RATE_DETAILS_BILLING_INTERVAL_VALUE_KEY = 'text_17877372202287udsa3vj1ul'

type RateCardRateDetailsOverviewProps = {
  rate: RateCardRateForDetailsFragment
  rateCard: RateCardForRateDetailsFragment
  onEdit?: () => void
}

const RateCardRateDetailsOverview = ({
  rate,
  rateCard,
  onEdit,
}: RateCardRateDetailsOverviewProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { pricingUnits } = useCustomPricingUnits()

  const { product, productFilter } = rateCard
  const pricingUnitShortName = pricingUnits.find(
    (unit) => unit.code === rateCard.appliedPricingUnitCode,
  )?.shortName

  const attachedProductCategory = product.productCategory ? (
    <Link
      to={generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
        productCategoryId: product.productCategory.id,
        tab: ProductCategoryDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.productCategory.name}
    </Link>
  ) : (
    '-'
  )

  const attachedProduct = (
    <Link
      to={generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.name}
    </Link>
  )

  const attachedProductFilter = productFilter ? (
    <Link
      to={generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
        productFilterId: productFilter.id,
        tab: ProductFilterDetailsTabsOptionsEnum.overview,
      })}
    >
      {productFilter.name}
    </Link>
  ) : (
    '-'
  )

  const attachedRateCard = (
    <Link
      to={generatePath(RATE_CARD_DETAILS_ROUTE, {
        rateCardId: rateCard.id,
        tab: RateCardDetailsTabsOptionsEnum.rates,
      })}
    >
      {rateCard.name}
    </Link>
  )

  // The backend rejects a spending minimum on a pay-in-advance card.
  const hasSpendingMinimum = rateCard.billingTiming === RateCardBillingTimingEnum.Arrears

  // A rate saved without one stores 0, which would read as a configured zero floor.
  const minAmountCents = Number(rate.minAmountCents ?? 0)

  const spendingMinimum =
    minAmountCents > 0
      ? intlFormatNumber(deserializeAmount(minAmountCents, rateCard.currency), {
          currencyDisplay: 'symbol',
          currency: rateCard.currency,
          pricingUnitShortName,
          maximumFractionDigits: 15,
        })
      : '-'

  return (
    <section className="flex flex-col gap-4">
      <PageSectionTitle
        title={translate(RATE_CARD_RATES_SECTION_TITLE_KEY)}
        subtitle={translate(RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY)}
        action={
          !!onEdit && hasPermissions(['rateCardsUpdate'])
            ? {
                title: translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY),
                dataTest: RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID,
                onClick: onEdit,
              }
            : undefined
        }
      />

      <DetailsPage.InfoGrid
        grid={[
          {
            label: translate(RATE_CARD_RATE_DETAILS_PRODUCT_CATEGORY_LABEL_KEY),
            value: attachedProductCategory,
          },
          {
            label: translate('text_1784925227817ekmphmxz74c'),
            value: attachedProduct,
          },
          {
            label: translate('text_17849304406579sbwz4df14p'),
            value: attachedProductFilter,
          },
          {
            label: translate(RATE_CARD_RATE_DETAILS_RATE_CARD_LABEL_KEY),
            value: attachedRateCard,
          },
          {
            label: translate(RATE_CARD_RATE_DETAILS_CODE_LABEL_KEY),
            value: (
              <TypographyWithCopy variant="body" color="grey700">
                {rate.code}
              </TypographyWithCopy>
            ),
          },
          {
            label: translate(RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY),
            // Calendar day: the org timezone would show the previous day west of UTC.
            value: intlFormatDateTime(rate.effectiveFrom, { timezone: TimezoneEnum.TzUtc }).date,
          },
          {
            label: translate('text_63ac86d797f728a87b2f9fa7'),
            value: (
              <Status
                {...rateCardRateStatusMapping(rate.status)}
                data-test={RATE_CARD_RATE_DETAILS_OVERVIEW_STATUS_TEST_ID}
              />
            ),
          },
          {
            label: translate(RATE_CARD_RATE_BILLING_INTERVAL_LABEL_KEY),
            value: translate(RATE_CARD_RATE_DETAILS_BILLING_INTERVAL_VALUE_KEY, {
              count: rate.billingIntervalCount,
              unit: translate(
                BILLING_INTERVAL_UNIT_TRANSLATION_KEY[rate.billingIntervalUnit],
              ).toLocaleLowerCase(),
            }),
          },
          {
            label: translate(RATE_CARD_RATE_MODEL_LABEL_KEY),
            value: translate(chargeModelLookupTranslation[rate.rateModel]),
          },
        ]}
      />

      <PlanDetailsChargeWrapperSwitch
        currency={rateCard.currency}
        chargeModel={toChargeModel(rate.rateModel)}
        values={rate.rateProperties}
        chargeAppliedPricingUnit={
          pricingUnitShortName ? { pricingUnit: { shortName: pricingUnitShortName } } : undefined
        }
        showPresentationGroupKeys={false}
      />

      {hasSpendingMinimum && (
        <DetailsPage.InfoGrid
          grid={[{ label: translate('text_643e592657fc1ba5ce110c30'), value: spendingMinimum }]}
        />
      )}
    </section>
  )
}

export default RateCardRateDetailsOverview
