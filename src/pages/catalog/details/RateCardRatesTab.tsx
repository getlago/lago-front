import { gql } from '@apollo/client'

import { Button } from '~/components/designSystem/Button'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  RateCardForRateDrawerFragment,
  RateCardRateForListFragmentDoc,
  useRateCardRatesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { tw } from '~/styles/utils'

import {
  RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY,
  RATE_CARD_RATES_SECTION_TITLE_KEY,
} from '../drawers/rateCardRate/constants'
import { useRateCardRateTableActions } from '../useRateCardRateTableActions'
import { useRateCardRateTableColumns } from '../useRateCardRateTableColumns'

// The operation is intentionally named `rateCardRates` (lowercase): the rate drawer refetches
// active queries by that exact string name and the delete dialog evicts from its document.
gql`
  query rateCardRates($rateCardId: ID!, $page: Int, $limit: Int) {
    rateCardRates(rateCardId: $rateCardId, page: $page, limit: $limit) {
      collection {
        id
        ...RateCardRateForList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${RateCardRateForListFragmentDoc}
`

export const RATE_CARD_RATES_TAB_TEST_ID = 'rate-card-rates-tab'
export const RATE_CARD_RATES_CREATE_TEST_ID = 'rate-card-rates-create'

// New translation keys are exported as named constants (feature convention) so tests and
// siblings reference them instead of duplicating the raw ids.
export const RATE_CARD_RATES_EMPTY_TITLE_KEY = 'text_1787737220228wjwpgmwu8fv'
export const RATE_CARD_RATES_EMPTY_SUBTITLE_KEY = 'text_1787737220228bjix2qjx4rz'

type RateCardRatesTabProps = {
  rateCardId: string
  /**
   * Undefined until the parent card query resolves. The rates query only needs the id, so it
   * runs in parallel with it rather than behind it; the card gates the create CTA and the row
   * write actions, which cannot be decided without it.
   */
  rateCard?: RateCardForRateDrawerFragment | null
}

const RateCardRatesTab = ({ rateCardId, rateCard }: RateCardRatesTabProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { page, goToPage } = usePageSearchParam()
  const { actionColumn, actionColumnTooltip, getRowActionLink, openRateDrawer } =
    useRateCardRateTableActions({ rateCardId, rateCard })

  // network-only: the details tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed page before
  // the page-1 refetch.
  const { data, error, loading } = useRateCardRatesQuery({
    variables: { rateCardId, page, limit: DEFAULT_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const canCreateRates = hasPermissions(['rateCardsCreate'])

  const columns = useRateCardRateTableColumns({
    currency: rateCard?.currency,
    appliedPricingUnitCode: rateCard?.appliedPricingUnitCode,
  })

  const placeholder: TablePlaceholder = {
    errorState: {
      title: translate('text_629728388c4d2300e2d380d5'),
      subtitle: translate('text_629728388c4d2300e2d380eb'),
      buttonTitle: translate('text_629728388c4d2300e2d38110'),
      buttonVariant: 'primary',
      buttonAction: () => location.reload(),
    },
    emptyState: {
      title: translate(RATE_CARD_RATES_EMPTY_TITLE_KEY),
      subtitle: translate(RATE_CARD_RATES_EMPTY_SUBTITLE_KEY),
      ...(canCreateRates &&
        !!rateCard && {
          buttonTitle: translate(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY),
          buttonVariant: 'primary' as const,
          buttonAction: () => openRateDrawer({ rateCard }),
        }),
    },
  }

  return (
    <section data-test={RATE_CARD_RATES_TAB_TEST_ID}>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate(RATE_CARD_RATES_SECTION_TITLE_KEY)}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate(RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY)}
          </Typography>
        </div>
        {canCreateRates && !!rateCard && (
          <Button
            variant="inline"
            data-test={RATE_CARD_RATES_CREATE_TEST_ID}
            onClick={() => openRateDrawer({ rateCard })}
          >
            {translate(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY)}
          </Button>
        )}
      </div>

      <PaginatedContent
        metadata={data?.rateCardRates?.metadata}
        loading={loading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="rate-card-rates-list"
          data={data?.rateCardRates?.collection ?? []}
          containerSize={0}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={loading}
          hasError={!!error}
          rowDataTestId={(rate) => rate.code}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={actionColumnTooltip}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </section>
  )
}

export default RateCardRatesTab
