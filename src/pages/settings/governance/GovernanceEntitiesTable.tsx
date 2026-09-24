import { gql } from '@apollo/client'
import { Icon, tw } from 'lago-design-system'
import { useState } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GovernanceEntityItemFragment,
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntitiesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment GovernanceEntityItem on UsageAttributionType {
    id
    name
    code
    role
    createdAt
  }

  query getGovernanceEntities(
    $role: UsageAttributionTypeRoleEnum
    $roots: Boolean
    $page: Int
    $limit: Int
  ) {
    usageAttributionTypes(role: $role, roots: $roots, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...GovernanceEntityItem
        children {
          id
          ...GovernanceEntityItem
          children {
            id
            ...GovernanceEntityItem
            children {
              id
              ...GovernanceEntityItem
              children {
                id
                ...GovernanceEntityItem
                children {
                  id
                  ...GovernanceEntityItem
                }
              }
            }
          }
        }
      }
    }
  }
`

const ROLE_LABEL_KEYS: Record<UsageAttributionTypeRoleEnum, string> = {
  [UsageAttributionTypeRoleEnum.Hierarchical]: 'text_1790230812563cibrddwcit4',
  [UsageAttributionTypeRoleEnum.Flat]: 'text_17902308125635bb6aqr2wbe',
}

const INDENT_CLASS_BY_DEPTH = ['pl-0', 'pl-6', 'pl-12', 'pl-18', 'pl-24', 'pl-30']

type GovernanceEntityNode = GovernanceEntityItemFragment & {
  children?: GovernanceEntityNode[]
}

type GovernanceEntityRow = GovernanceEntityItemFragment & { depth: number }

const flattenTree = (nodes: GovernanceEntityNode[], depth = 0): GovernanceEntityRow[] =>
  nodes.flatMap(({ children, ...node }) => [
    { ...node, depth },
    ...flattenTree(children ?? [], depth + 1),
  ])

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
  const isHierarchical = role === UsageAttributionTypeRoleEnum.Hierarchical

  const { data, error, loading } = useGetGovernanceEntitiesQuery({
    variables: { role, roots: isHierarchical, limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  })

  const { metadata, collection } = data?.usageAttributionTypes || {}
  const rows = flattenTree(collection ?? [])

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
        data={rows}
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
            content: ({ name, code, depth }) => (
              <div
                className={tw(
                  'flex items-start gap-2',
                  INDENT_CLASS_BY_DEPTH[Math.min(depth, INDENT_CLASS_BY_DEPTH.length - 1)],
                )}
                data-test={code}
              >
                {isHierarchical && <Icon name="arrow-indent" className="mt-0.5" />}
                <div className="min-w-0">
                  <Typography color="textSecondary" variant="bodyHl" noWrap>
                    {name ?? code}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {code}
                  </Typography>
                </div>
              </div>
            ),
          },
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
