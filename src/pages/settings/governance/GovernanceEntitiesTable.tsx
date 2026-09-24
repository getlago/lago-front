import { gql } from '@apollo/client'
import { useState } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { UsageAttributionTypeRoleEnum, useGetGovernanceEntitiesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment GovernanceEntityItem on UsageAttributionType {
    id
    name
    code
    role
    createdAt
    parent {
      id
      name
    }
  }

  query getGovernanceEntities($role: UsageAttributionTypeRoleEnum, $page: Int, $limit: Int) {
    usageAttributionTypes(role: $role, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...GovernanceEntityItem
      }
    }
  }
`

const ROLE_LABEL_KEYS: Record<UsageAttributionTypeRoleEnum, string> = {
  [UsageAttributionTypeRoleEnum.Hierarchical]: 'text_1790230812563cibrddwcit4',
  [UsageAttributionTypeRoleEnum.Flat]: 'text_17902308125635bb6aqr2wbe',
}

export const GOVERNANCE_ENTITIES_TABLE_NAME = 'governance-settings-entities'
export const GOVERNANCE_ENTITIES_TABLE_TEST_ID = `table-${GOVERNANCE_ENTITIES_TABLE_NAME}`

type GovernanceEntitiesTableProps = {
  role: UsageAttributionTypeRoleEnum
}

export const GovernanceEntitiesTable = ({ role }: GovernanceEntitiesTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { page, goToPage } = usePageSearchParam()

  const { data, error, loading } = useGetGovernanceEntitiesQuery({
    variables: { role, limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
    // Leaving the tab drops `?page`; the single-page cache would flash the previously
    // viewed page before the page-1 refetch resolves.
    fetchPolicy: 'network-only',
  })

  const { metadata, collection } = data?.usageAttributionTypes || {}
  const isHierarchical = role === UsageAttributionTypeRoleEnum.Hierarchical

  return (
    <PaginatedContent
      metadata={metadata}
      loading={loading}
      pageSize={pageSize}
      sticky={false}
      onPageChange={goToPage}
      onPageSizeChange={(newPageSize) => {
        goToPage(1)
        setPageSize(newPageSize)
      }}
    >
      <Table
        name={GOVERNANCE_ENTITIES_TABLE_NAME}
        containerClassName="border-t border-grey-300"
        containerSize={{ default: 0 }}
        rowSize={72}
        isLoading={loading}
        hasError={!!error}
        data={collection ?? []}
        loadingRowCount={pageSize}
        placeholder={{
          errorState: {
            title: translate('text_629728388c4d2300e2d380d5'),
            subtitle: translate('text_629728388c4d2300e2d380eb'),
            buttonTitle: translate('text_629728388c4d2300e2d38110'),
            buttonVariant: 'primary',
            buttonAction: () => location.reload(),
          },
        }}
        columns={[
          {
            key: 'name',
            title: translate('text_6419c64eace749372fc72b0f'),
            maxSpace: true,
            content: ({ name, code }) => (
              <div data-test={code}>
                <Typography color="textSecondary" variant="bodyHl" noWrap>
                  {name ?? code}
                </Typography>
                <Typography variant="caption" noWrap>
                  {code}
                </Typography>
              </div>
            ),
          },
          isHierarchical
            ? {
                key: 'parent.name',
                title: translate('text_1790230812563xw6orgl2n9j'),
                content: ({ parent }) => (
                  <Typography variant="body" color="grey700" noWrap>
                    {parent?.name ?? '-'}
                  </Typography>
                ),
              }
            : null,
          {
            key: 'role',
            title: translate('text_632d68358f1fedc68eed3e5a'),
            content: ({ role: entityRole }) => (
              <Chip label={translate(ROLE_LABEL_KEYS[entityRole])} />
            ),
          },
          {
            key: 'createdAt',
            title: translate('text_623b497ad05b960101be3440'),
            content: ({ createdAt }) => (
              <Typography variant="body" color="grey700" noWrap>
                {intlFormatDateTimeOrgaTZ(createdAt).date}
              </Typography>
            ),
          },
        ]}
      />
    </PaginatedContent>
  )
}
