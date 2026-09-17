import { gql } from '@apollo/client'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { PageSectionTitle } from '~/components/layouts/Section'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  RateCardForRateDrawerFragment,
  RateCardRateForListFragmentDoc,
  useRateCardRatesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { tw } from '~/styles/utils'

import { RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY } from '../drawers/rateCardRate/constants'
import { useRateCardRateTableActions } from '../useRateCardRateTableActions'
import { useRateCardRateTableColumns } from '../useRateCardRateTableColumns'

// Renaming this operation breaks the drawer's `refetchQueries` and the delete dialog's eviction,
// which both reference it by name.
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

type RateCardRatesTabProps = {
  rateCardId: string
  // Undefined until the parent card query resolves; gates the create CTA and the row actions.
  rateCard?: RateCardForRateDrawerFragment | null
}

const RateCardRatesTab = ({ rateCardId, rateCard }: RateCardRatesTabProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { page, goToPage } = usePageSearchParam()
  const { actionColumn, actionColumnTooltip, getRowActionLink, openRateDrawer } =
    useRateCardRateTableActions({ rateCardId, rateCard })

  // network-only: the tab remounts on switch and drops `?page`, so a cache-first read would
  // flash the previously viewed page.
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
      title: translate('text_1787737220228wjwpgmwu8fv'),
      subtitle: translate('text_1787737220228bjix2qjx4rz'),
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
      <PageSectionTitle
        title={translate('text_1784930705742tg0kbcsak2v')}
        subtitle={translate('text_17877372202276uc54jqy1np')}
        action={
          canCreateRates && !!rateCard
            ? {
                title: translate(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY),
                dataTest: RATE_CARD_RATES_CREATE_TEST_ID,
                onClick: () => openRateDrawer({ rateCard }),
              }
            : undefined
        }
      />

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
