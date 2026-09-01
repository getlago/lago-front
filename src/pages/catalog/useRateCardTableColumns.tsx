import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import {
  ProductDetailsTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { Link, PRODUCT_DETAILS_ROUTE, PRODUCT_FILTER_DETAILS_ROUTE } from '~/core/router'
import {
  PropertiesForRateCardRateFragmentDoc,
  RateCardForDeleteRateCardDialogFragmentDoc,
  RateCardForDrawerFragmentDoc,
  RateCardForListFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { formatActiveRate } from './utils/formatActiveRate'

// Co-located with the columns hook (its only consumer beyond the actions hook,
// which only needs `id`/`name` already carried by the two spread fragments)
// rather than a list query file: the standalone list query (Task 8) and the
// product-item / product-item-filter preview queries (Task 10) all import this
// fragment instead of declaring their own field lists.
gql`
  fragment RateCardForList on RateCard {
    id
    name
    code
    createdAt
    ratesCount
    currency
    appliedPricingUnitCode
    product {
      id
      name
    }
    productFilter {
      id
      name
    }
    activeRate {
      id
      rateModel
      # Superset on purpose: Apollo replaces array fields wholesale, so the narrower
      # PropertiesForActiveRate would strip range fields the rate pages cached.
      rateProperties {
        ...PropertiesForRateCardRate
      }
      minAmountCents
    }
    ...RateCardForDrawer
    ...RateCardForDeleteRateCardDialog
  }

  ${PropertiesForRateCardRateFragmentDoc}
  ${RateCardForDrawerFragmentDoc}
  ${RateCardForDeleteRateCardDialogFragmentDoc}
`

// New translation keys are exported as named constants (feature convention) so
// tests and siblings reference them instead of duplicating the raw ids.
const RATE_CARD_TABLE_ATTACHED_TO_HEADER_KEY = 'text_17849266826007ust9hd9n62'
const RATE_CARD_TABLE_ACTIVE_RATE_HEADER_KEY = 'text_1784926682600lyzk75bbx48'
const RATE_CARD_TABLE_RATES_COUNT_HEADER_KEY = 'text_1784926682600958z273qqyt'

// Shared between the standalone rate-cards list (Task 8) and the product-item /
// product-item-filter details previews (Task 10): the previews drop the
// "Attached to" column since they are already scoped to a single product item
// or product item filter (mirrors the product-item / product-item-filter
// columns hooks dropping their own attached-to column via a boolean flag).
export const useRateCardTableColumns = ({
  withAttachedTo,
}: {
  withAttachedTo: boolean
}): Array<TableColumn<RateCardForListFragment> | null> => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const columns: Array<TableColumn<RateCardForListFragment> | null> = [
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      minWidth: 200,
      maxSpace: true,
      content: ({ name, code }) => (
        <>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {name}
          </Typography>
          <TypographyWithCopy compact noWrap variant="caption">
            {code}
          </TypographyWithCopy>
        </>
      ),
    },
    withAttachedTo
      ? {
          key: 'productFilter.name',
          title: translate(RATE_CARD_TABLE_ATTACHED_TO_HEADER_KEY),
          minWidth: 160,
          content: ({ product, productFilter }) => {
            const to = productFilter
              ? generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
                  productFilterId: productFilter.id,
                  tab: ProductFilterDetailsTabsOptionsEnum.overview,
                })
              : generatePath(PRODUCT_DETAILS_ROUTE, {
                  productId: product.id,
                  tab: ProductDetailsTabsOptionsEnum.overview,
                })

            return (
              <Typography color="inherit" noWrap>
                <Link to={to}>{productFilter?.name ?? product.name}</Link>
              </Typography>
            )
          },
        }
      : null,
    {
      key: 'activeRate',
      title: translate(RATE_CARD_TABLE_ACTIVE_RATE_HEADER_KEY),
      textAlign: 'right',
      minWidth: 200,
      content: ({ activeRate, currency, appliedPricingUnitCode }) => {
        const { primary, secondary } = formatActiveRate(activeRate, {
          translate,
          currency,
          appliedPricingUnitCode,
        })

        return (
          <>
            <Typography color={secondary ? 'grey700' : 'grey500'} variant="body" noWrap>
              {primary}
            </Typography>
            {secondary ? (
              <Typography color="grey600" variant="caption" noWrap>
                {secondary}
              </Typography>
            ) : null}
          </>
        )
      },
    },
    {
      key: 'ratesCount',
      title: translate(RATE_CARD_TABLE_RATES_COUNT_HEADER_KEY),
      textAlign: 'right',
      minWidth: 80,
      content: ({ ratesCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {ratesCount}
        </Typography>
      ),
    },
    {
      key: 'createdAt',
      title: translate('text_629728388c4d2300e2d380e3'),
      textAlign: 'right',
      minWidth: 140,
      content: ({ createdAt }) => (
        <Typography color="grey600" variant="body" noWrap>
          {intlFormatDateTimeOrgaTZ(createdAt).date}
        </Typography>
      ),
    },
  ]

  return columns
}
