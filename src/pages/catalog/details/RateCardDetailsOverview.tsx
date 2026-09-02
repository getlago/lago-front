import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ProductCategoryDetailsTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  Link,
  PRODUCT_CATEGORY_DETAILS_ROUTE,
  PRODUCT_DETAILS_ROUTE,
  PRODUCT_FILTER_DETAILS_ROUTE,
} from '~/core/router'
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
  RATE_CARD_DRAWER_TITLE_EDIT_KEY,
  useRateCardDrawer,
} from '../drawers/rateCard/useRateCardDrawer'

export const RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID = 'rate-card-details-overview-edit'

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
      invoiceDisplayName
      productCategory {
        id
        name
      }
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
    <Typography variant="body" color="grey600">
      {translate('text_1784590896872hcbug1hthjl')}
    </Typography>
  )

  const attachedProduct = (
    <Link
      to={generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.invoiceDisplayName || product.name}
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
        label: translate('text_1784925227817xt1irx4wum2'),
        value: pricingUnit?.name || rateCard.appliedPricingUnitCode,
      }
    : {
        label: translate('text_1784925227817bab1mp540x7'),
        value: rateCard.currency || '-',
      }

  return (
    <section>
      {hasPermissions(['rateCardsUpdate']) && (
        <PageSectionTitle
          title={translate('text_628cf761cbe6820138b8f2e4')}
          subtitle={translate('text_178492522781766xwbos8bso')}
          action={{
            title: translate(RATE_CARD_DRAWER_TITLE_EDIT_KEY),
            dataTest: RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID,
            onClick: () => openEditRateCardDrawer({ rateCard }),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_17839807181143h6kt2bdiyi'), value: attachedProductCategory },
            { label: translate('text_1784925227817ekmphmxz74c'), value: attachedProduct },
            {
              label: translate('text_17849304406579sbwz4df14p'),
              value: attachedProductFilter,
            },
            { label: translate('text_1784930440656rjmo1lmed8k'), value: rateCard.name },
            { label: translate('text_178493044065618ejwmmneyl'), value: code },
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
              label: translate('text_1784930440656zu20xor7y71'),
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
              label: translate('text_17849304406576mhltomszbh'),
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
