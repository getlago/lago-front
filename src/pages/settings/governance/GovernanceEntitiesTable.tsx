import { gql } from '@apollo/client'
import { useState } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GovernanceEntityItemFragment,
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntitiesQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
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
      code
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

type GovernanceEntity = GovernanceEntityItemFragment

const NameCell = ({ name, code }: Pick<GovernanceEntity, 'name' | 'code'>): JSX.Element => (
  <div data-test={code}>
    <Typography color="textSecondary" variant="bodyHl" noWrap>
      {name ?? code}
    </Typography>
    <Typography variant="caption" noWrap>
      {code}
    </Typography>
  </div>
)

const ParentCell = ({ parent }: Pick<GovernanceEntity, 'parent'>): JSX.Element => (
  <Typography variant="body" color="grey700" noWrap>
    {parent?.name ?? parent?.code ?? '-'}
  </Typography>
)

const RoleCell = ({ role }: Pick<GovernanceEntity, 'role'>): JSX.Element => {
  const { translate } = useInternationalization()

  return <Chip label={translate(ROLE_LABEL_KEYS[role])} />
}

const CreatedAtCell = ({ createdAt }: Pick<GovernanceEntity, 'createdAt'>): JSX.Element => {
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  return (
    <Typography variant="body" color="grey700" noWrap>
      {intlFormatDateTimeOrgaTZ(createdAt).date}
    </Typography>
  )
}

const getColumns = (
  translate: TranslateFunc,
  isHierarchical: boolean,
): Array<TableColumn<GovernanceEntity> | null> => [
  {
    key: 'name',
    title: translate('text_6419c64eace749372fc72b0f'),
    maxSpace: true,
    content: ({ name, code }) => <NameCell name={name} code={code} />,
  },
  isHierarchical
    ? {
        key: 'parent.name',
        title: translate('text_1790230812563xw6orgl2n9j'),
        content: ({ parent }) => <ParentCell parent={parent} />,
      }
    : null,
  {
    key: 'role',
    title: translate('text_632d68358f1fedc68eed3e5a'),
    content: ({ role }) => <RoleCell role={role} />,
  },
  {
    key: 'createdAt',
    title: translate('text_623b497ad05b960101be3440'),
    content: ({ createdAt }) => <CreatedAtCell createdAt={createdAt} />,
  },
]

type GovernanceEntitiesTableProps = {
  role: UsageAttributionTypeRoleEnum
}

export const GovernanceEntitiesTable = ({ role }: GovernanceEntitiesTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { page, goToPage } = usePageSearchParam()

  const { data, error, loading } = useGetGovernanceEntitiesQuery({
    variables: { role, limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
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
        columns={getColumns(translate, isHierarchical)}
      />
    </PaginatedContent>
  )
}
