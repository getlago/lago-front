import { gql } from '@apollo/client'
import { captureMessage } from '@sentry/react'
import { Icon, tw } from 'lago-design-system'
import { useEffect, useState } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GovernanceEntityItemFragment,
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntitiesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { MAX_GOVERNANCE_HIERARCHY_DEPTH } from './constants'
import { useGovernanceEntityDrawer } from './drawers/governanceEntity/useGovernanceEntityDrawer'
import { GovernanceEntity } from './drawers/governanceEntity/validationSchema'
import { useDeleteGovernanceEntityDialog } from './useDeleteGovernanceEntityDialog'

gql`
  fragment GovernanceEntityItem on UsageAttributionType {
    id
    name
    code
    description
    role
    attributionKeys
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
                            children {
                              id
                            }
                          }
                        }
                      }
                    }
                  }
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

const INDENT_CLASS_BY_DEPTH = [
  'pl-0',
  'pl-6',
  'pl-12',
  'pl-18',
  'pl-24',
  'pl-30',
  'pl-36',
  'pl-42',
  'pl-48',
  'pl-[13.5rem]',
  'pl-60',
]

type GovernanceEntityProbe = { id: string }

type GovernanceEntityNode = GovernanceEntityItemFragment & {
  children?: Array<GovernanceEntityNode | GovernanceEntityProbe>
}

type GovernanceEntityRow = GovernanceEntity & { depth: number }

const isEntityNode = (
  node: GovernanceEntityNode | GovernanceEntityProbe,
): node is GovernanceEntityNode => 'code' in node

const flattenTree = (
  nodes: GovernanceEntityNode[],
  depth = 0,
  parent: GovernanceEntity['parent'] = null,
): GovernanceEntityRow[] =>
  nodes.flatMap(({ children, ...node }) => [
    { ...node, parent, depth },
    ...flattenTree((children ?? []).filter(isEntityNode), depth + 1, {
      id: node.id,
      name: node.name,
      code: node.code,
    }),
  ])

const exceedsMaxDepth = (nodes: GovernanceEntityNode[], depth = 0): boolean =>
  nodes.some(({ children = [] }) => {
    if (depth >= MAX_GOVERNANCE_HIERARCHY_DEPTH) return children.length > 0

    return exceedsMaxDepth(children.filter(isEntityNode), depth + 1)
  })

type GovernanceEntityNameCellProps = Pick<GovernanceEntityRow, 'name' | 'code' | 'depth'> & {
  showIndentIcon: boolean
}

const GovernanceEntityNameCell = ({
  name,
  code,
  depth,
  showIndentIcon,
}: GovernanceEntityNameCellProps): JSX.Element => (
  <div className={tw('flex items-start gap-2', INDENT_CLASS_BY_DEPTH[depth])} data-test={code}>
    {showIndentIcon && <Icon name="indent" className="mt-0.5" />}
    <div className="min-w-0">
      <Typography color="textSecondary" variant="bodyHl" noWrap>
        {name ?? code}
      </Typography>
      <Typography variant="caption" noWrap>
        {code}
      </Typography>
    </div>
  </div>
)

export const GOVERNANCE_ENTITIES_TABLE_NAME = 'governance-settings-entities'
export const GOVERNANCE_ENTITIES_TABLE_TEST_ID = `table-${GOVERNANCE_ENTITIES_TABLE_NAME}`
export const GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID = 'governance-entity-edit-action'
export const GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID = 'governance-entity-delete-action'

type GovernanceEntitiesTableProps =
  { role: UsageAttributionTypeRoleEnum; isLoading?: never } | { role?: never; isLoading: true }

export const GovernanceEntitiesTable = ({
  role,
  isLoading,
}: GovernanceEntitiesTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { page, goToPage } = usePageSearchParam()
  const isHierarchical = role === UsageAttributionTypeRoleEnum.Hierarchical
  const { hasPermissions } = usePermissions()
  const { openDrawer } = useGovernanceEntityDrawer()
  const { openDeleteGovernanceEntityDialog } = useDeleteGovernanceEntityDialog()
  const canUpdate = hasPermissions(['usageAttributionTypesUpdate'])
  const canDelete = hasPermissions(['usageAttributionTypesDelete'])

  const { data, error, loading } = useGetGovernanceEntitiesQuery({
    variables: { role, roots: isHierarchical, limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    skip: !!isLoading,
  })

  const { metadata, collection } = data?.usageAttributionTypes || {}
  const rows = flattenTree(collection ?? [])

  const getRowActions = (entity: GovernanceEntityRow): ActionItem<GovernanceEntityRow>[] => {
    const actions: ActionItem<GovernanceEntityRow>[] = []

    if (canUpdate) {
      actions.push({
        title: translate('text_1790258263571hbxpulilz78'),
        startIcon: 'pen',
        dataTest: GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID,
        onAction: () => openDrawer(entity),
      })
    }

    if (canDelete) {
      actions.push({
        title: translate('text_1790258263571pzojfvp8gw8'),
        startIcon: 'trash',
        dataTest: GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID,
        onAction: () => openDeleteGovernanceEntityDialog(entity),
      })
    }

    return actions
  }

  useEffect(() => {
    if (!collection || !exceedsMaxDepth(collection)) return

    captureMessage(
      `Governance hierarchy deeper than ${MAX_GOVERNANCE_HIERARCHY_DEPTH} levels: descendants are not displayed`,
      { level: 'error' },
    )
  }, [collection])

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
        containerClassName="h-auto shrink-0"
        containerSize={{ default: 0 }}
        rowSize={72}
        isLoading={!!isLoading || loading}
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
        actionColumnTooltip={
          canUpdate && canDelete ? () => translate('text_626162c62f790600f850b7b6') : undefined
        }
        actionColumn={canUpdate || canDelete ? getRowActions : undefined}
        columns={[
          {
            key: 'name',
            title: translate('text_6419c64eace749372fc72b0f'),
            maxSpace: true,
            content: ({ name, code, depth }) => (
              <GovernanceEntityNameCell
                name={name}
                code={code}
                depth={depth}
                showIndentIcon={isHierarchical}
              />
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
