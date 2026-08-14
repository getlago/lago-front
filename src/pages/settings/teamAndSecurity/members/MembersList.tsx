import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Avatar } from '~/components/designSystem/Avatar'
import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { MEMBERS_PAGE_ROLE_FILTER_KEY } from '~/core/constants/roles'
import { GetMembersQuery, MembershipItemForMembershipSettingsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'
import { AllowedElements, useRoleDisplayInformation } from '~/hooks/useRoleDisplayInformation'
import { useRolesList } from '~/hooks/useRolesList'

import MembersFilters from './common/MembersFilters'
import { useCreateInviteDialog } from './dialogs/CreateInviteDialog'
import { useEditMemberRoleDialog } from './dialogs/EditMemberRoleDialog'
import { useRevokeMembershipDialog } from './dialogs/RevokeMembershipDialog'
import { useGetMembersList } from './hooks/useGetMembersList'

export const MEMBERS_LIST_EDIT_ACTION_TEST_ID = 'members-list-edit-action'
export const MEMBERS_LIST_DELETE_ACTION_TEST_ID = 'members-list-delete-action'

type Membership = GetMembersQuery['memberships']['collection'][0]

const EmailColumn = ({ user }: Membership) => (
  <div className="flex flex-1 items-center gap-3">
    <Avatar variant="user" identifier={(user.email || '').charAt(0)} size="big" />
    <Typography variant="body" color="grey700">
      {user.email}
    </Typography>
  </div>
)

const getRolesColumn = (getDisplayName: (role: AllowedElements) => string) =>
  function RolesColumnInside({ roles }: Membership) {
    return <Chip label={getDisplayName({ name: roles[0] })} />
  }

const MemberList = () => {
  const { translate } = useInternationalization()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { hasPermissions } = usePermissions()
  const { currentUser } = useCurrentUser()
  const { getDisplayName } = useRoleDisplayInformation()
  const { roles, isLoadingRoles } = useRolesList()

  const RolesColumn = getRolesColumn(getDisplayName)

  const [searchParams] = useSearchParams()

  const { openRevokeMembershipDialog } = useRevokeMembershipDialog()
  const { openEditMemberRoleDialog } = useEditMemberRoleDialog()
  const { openCreateInviteDialog } = useCreateInviteDialog()

  const selectedRole = useMemo(() => {
    return searchParams.get(MEMBERS_PAGE_ROLE_FILTER_KEY)
  }, [searchParams])

  // The filter is stored in the URL as a role name, while the API filters on role ids
  const roleIds = useMemo(() => {
    if (!selectedRole) return undefined

    const matchingRoleIds = roles
      .filter((role) => role.name === selectedRole)
      .map((role) => role.id)

    return matchingRoleIds.length > 0 ? matchingRoleIds : undefined
  }, [roles, selectedRole])

  const { getMembers, members, metadata, membersLoading, membersError, membersRefetch } =
    useGetMembersList({ pageSize, page, roleIds })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getMembers, membersLoading)

  // Role ids resolve asynchronously, so the first response of a role-filtered list is unfiltered:
  // stay on the skeleton until the ids are known to never paint members the filter excludes
  const isListLoading = isLoading || (!!selectedRole && isLoadingRoles)

  const [searchQuery, setSearchQuery] = useState('')

  const columns: Array<TableColumn<Membership> | null> = [
    {
      key: 'user.email',
      title: translate('text_63208b630aaf8df6bbfb2655'),
      maxSpace: true,
      content: EmailColumn,
    },
    {
      key: 'roles.0',
      title: translate('text_664f035a68227f00e261b7ec'),
      minWidth: 170,
      content: RolesColumn,
    },
  ]

  const actionColumn: ActionColumn<Membership> = (membership) => {
    if (
      !hasPermissions(['organizationMembersUpdate']) &&
      !hasPermissions(['organizationMembersDelete'])
    ) {
      return undefined
    }

    const isCurrentUser = membership.user.id === currentUser?.id

    const editAction = hasPermissions(['organizationMembersUpdate'])
      ? [
          {
            startIcon: 'pen',
            title: translate('text_664f035a68227f00e261b7f6'),
            onAction: () => {
              openEditMemberRoleDialog({
                member: membership,
                isEditingLastAdmin: membership.roles[0] === 'Admin' && metadata?.adminCount === 1,
                isEditingMyOwnMembership: currentUser?.id === membership.user.id,
              })
            },
            dataTest: MEMBERS_LIST_EDIT_ACTION_TEST_ID,
          } as ActionItem<MembershipItemForMembershipSettingsFragment>,
        ]
      : []

    const deleteAction =
      hasPermissions(['organizationMembersDelete']) && !isCurrentUser
        ? [
            {
              startIcon: 'trash',
              title: translate('text_63ea0f84f400488553caa786'),
              onAction: () => {
                openRevokeMembershipDialog({
                  id: membership.id,
                  email: membership.user.email || '',
                  organizationName: membership.organization?.name || '',
                  isDeletingLastAdmin:
                    membership.roles.includes('Admin') && metadata?.adminCount === 1,
                })
              },
              dataTest: MEMBERS_LIST_DELETE_ACTION_TEST_ID,
            } as ActionItem<MembershipItemForMembershipSettingsFragment>,
          ]
        : []

    return [...editAction, ...deleteAction]
  }

  const tablePlaceholder = {
    emptyState: {
      title: translate('text_176771435162557p8hyixafi'),
      subtitle: translate('text_1767714241102xpwokcuhvki'),
      buttonTitle: translate('text_63208b630aaf8df6bbfb265b'),
      buttonAction: openCreateInviteDialog,
    },
    errorState: {
      title: translate('text_6321a076b94bd1b32494e9ee'),
      subtitle: translate('text_6321a076b94bd1b32494e9f0'),
      buttonTitle: translate('text_6321a076b94bd1b32494e9f2'),
      buttonAction: () => {
        membersRefetch()
      },
    },
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MembersFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          goToPage(1)
          setSearchQuery(value)
          debouncedSearch?.(value)
        }}
        type="members"
      />
      <PaginatedContent
        metadata={metadata}
        loading={isListLoading}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={(newPageSize) => {
          goToPage(1)
          setPageSize(newPageSize)
        }}
      >
        <Table
          name="members-setting-members-list"
          containerClassName="h-auto shrink-0"
          containerSize={{ default: 0 }}
          rowSize={72}
          isLoading={isListLoading}
          data={members}
          loadingRowCount={pageSize}
          hasError={!!membersError}
          placeholder={tablePlaceholder}
          columns={columns}
          actionColumnTooltip={() => translate('text_626162c62f790600f850b7b6')}
          actionColumn={actionColumn}
        />
      </PaginatedContent>
    </div>
  )
}

export default MemberList
