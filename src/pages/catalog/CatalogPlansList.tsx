import { gql } from '@apollo/client'
import { useCallback } from 'react'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  CatalogPlanForCatalogPlanDrawerFragmentDoc,
  CatalogPlanForDeleteCatalogPlanDialogFragmentDoc,
  CatalogPlanForListFragment,
  useCatalogPlansLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useCatalogPlanDrawer } from './drawers/catalogPlan/useCatalogPlanDrawer'
import { useCatalogPlanTableActions } from './useCatalogPlanTableActions'

export const CATALOG_PLANS_LIST_SEARCH_TEST_ID = 'catalog-plans-search-input'
export const CATALOG_PLANS_CREATE_TEST_ID = 'create-catalog-plan-cta'

gql`
  fragment CatalogPlanForList on CatalogPlan {
    id
    name
    code
    invoiceDisplayName
    createdAt
    appliedRateCardsCount
    contractsCount
    ...CatalogPlanForCatalogPlanDrawer
    ...CatalogPlanForDeleteCatalogPlanDialog
  }

  query catalogPlans($page: Int, $limit: Int, $searchTerm: String) {
    catalogPlans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...CatalogPlanForList
      }
    }
  }

  ${CatalogPlanForCatalogPlanDrawerFragmentDoc}
  ${CatalogPlanForDeleteCatalogPlanDialogFragmentDoc}
`

const CatalogPlansList = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { openDrawer: openCatalogPlanDrawer } = useCatalogPlanDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useCatalogPlanTableActions()
  const { page, goToPage } = usePageSearchParam()

  const [getCatalogPlans, { data, error, loading, variables }] = useCatalogPlansLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page },
    notifyOnNetworkStatusChange: true,
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCatalogPlans, loading)

  const canCreateCatalogPlans = hasPermissions(['plansCreate'])

  const searchInputOnChange = useCallback(
    (value: string): void => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const actions: MainHeaderAction[] = [
    {
      type: 'action',
      label: translate('text_1789030049528b0qu0hphtg4'),
      variant: 'primary',
      hidden: !canCreateCatalogPlans,
      onClick: () => openCatalogPlanDrawer(),
      dataTest: CATALOG_PLANS_CREATE_TEST_ID,
    },
  ]

  const columns: TableColumn<CatalogPlanForListFragment>[] = [
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      minWidth: 200,
      maxSpace: true,
      content: ({ name, invoiceDisplayName, code }) => (
        <>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {invoiceDisplayName || name}
          </Typography>
          <TypographyWithCopy compact noWrap variant="caption">
            {code}
          </TypographyWithCopy>
        </>
      ),
    },
    {
      key: 'appliedRateCardsCount',
      title: translate('text_1789030049528f40pn120tj7'),
      textAlign: 'right',
      minWidth: 112,
      content: ({ appliedRateCardsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {appliedRateCardsCount}
        </Typography>
      ),
    },
    {
      key: 'contractsCount',
      title: translate('text_1789030049528f6kajqwypsr'),
      textAlign: 'right',
      minWidth: 130,
      content: ({ contractsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {contractsCount}
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

  const placeholder: TablePlaceholder = {
    errorState: variables?.searchTerm
      ? {
          title: translate('text_623b53fea66c76017eaebb6e'),
          subtitle: translate('text_63bab307a61c62af497e0599'),
        }
      : {
          title: translate('text_629728388c4d2300e2d380d5'),
          subtitle: translate('text_629728388c4d2300e2d380eb'),
          buttonTitle: translate('text_629728388c4d2300e2d38110'),
          buttonVariant: 'primary',
          buttonAction: () => location.reload(),
        },
    emptyState: variables?.searchTerm
      ? {
          title: translate('text_1789030049528z655xwavs78'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_17890300495285vbd2xto1kc'),
          subtitle: translate('text_17890300495297g290y7et77'),
          ...(canCreateCatalogPlans && {
            buttonTitle: translate('text_1789030049528b0qu0hphtg4'),
            buttonVariant: 'primary',
            buttonAction: () => openCatalogPlanDrawer(),
          }),
        },
  }

  return (
    <>
      <MainHeader.Configure
        entity={{ viewName: translate('text_62442e40cea25600b0b6d85a') }}
        actions={{ items: actions }}
        filtersSection={
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_1789030049528lqtvvif9k1p')}
            data-test={CATALOG_PLANS_LIST_SEARCH_TEST_ID}
          />
        }
      />

      <PaginatedContent
        insetPager
        metadata={data?.catalogPlans?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
      >
        <Table
          name="catalog-plans-list"
          data={data?.catalogPlans?.collection ?? []}
          containerSize={{ default: 16, md: 48 }}
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(catalogPlan) => `${catalogPlan.name}`}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={actionColumnTooltip}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </>
  )
}

export default CatalogPlansList
