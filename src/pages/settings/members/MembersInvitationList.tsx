import { useMemo, useRef, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import {
  ActionColumn,
  ActionItem,
  Avatar,
  Chip,
  InfiniteScroll,
  Table,
  TableColumn,
  Typography,
} from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { MEMBERS_PAGE_ROLE_FILTER_KEY } from '~/core/constants/roles'
import { INVITATION_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { GetInvitesQuery, InviteItemForMembersSettingsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { useRoleDisplayInformation } from '~/hooks/useRoleDisplayInformation'
import { useRolesList } from '~/hooks/useRolesList'
import {
  CreateInviteDialog,
  CreateInviteDialogRef,
} from '~/pages/settings/members/dialogs/CreateInviteDialog'
import {
  EditInviteRoleDialog,
  EditInviteRoleDialogRef,
} from '~/pages/settings/members/dialogs/EditInviteRoleDialog'
import {
  RevokeInviteDialog,
  RevokeInviteDialogRef,
} from '~/pages/settings/members/dialogs/RevokeInviteDialog'

import MembersFilters from './common/MembersFilters'
import { useGetMembersInvitationList } from './hooks/useGetMembersInvitationsList'

type Invitation = GetInvitesQuery['invites']['collection'][0]

const MembersInvitationList = () => {
  const { translate } = useInternationalization()
  const { invitations, metadata, invitesLoading, invitesFetchMore, invitesError, invitesRefetch } =
    useGetMembersInvitationList()
  const { getDisplayName } = useRoleDisplayInformation()
  const { hasPermissions } = usePermissions()
  const { roles } = useRolesList()

  const editInviteRoleDialogRef = useRef<EditInviteRoleDialogRef>(null)
  const createInviteDialogRef = useRef<CreateInviteDialogRef>(null)
  const revokeInviteDialogRef = useRef<RevokeInviteDialogRef>(null)

  const [searchParams] = useSearchParams()

  const selectedRole = useMemo(() => {
    return searchParams.get(MEMBERS_PAGE_ROLE_FILTER_KEY)
  }, [searchParams])

  const [searchQuery, setSearchQuery] = useState('')

  const filteredInvitations = useMemo(() => {
    if (!selectedRole && !searchQuery) return invitations

    return invitations.filter((invitation) => {
      const matchesRole = !selectedRole || invitation.roles.some((role) => role === selectedRole)
      const matchesSearch =
        !searchQuery || invitation.email?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesRole && matchesSearch
    })
  }, [invitations, selectedRole, searchQuery])

  const handleInfiniteScrolling = () => {
    const { currentPage = 0, totalPages = 0 } = metadata || {}

    currentPage < totalPages &&
      !invitesLoading &&
      invitesFetchMore({
        variables: { page: currentPage + 1 },
      })
  }

  const columns: Array<TableColumn<Invitation> | null> = [
    {
      key: 'email',
      title: translate('text_63208b630aaf8df6bbfb2655'),
      maxSpace: true,
      content: ({ email }) => (
        <div className="flex flex-1 items-center gap-3">
          <Avatar variant="user" identifier={(email || '').charAt(0)} size="big" />
          <Typography variant="body" color="grey700">
            {email}
          </Typography>
        </div>
      ),
    },
    {
      key: 'roles.0',
      title: translate('text_664f035a68227f00e261b7ec'),
      minWidth: 170,
      content: ({ roles: inviteRoles }) => {
        const roleToDisplay = roles.find((r) => r.code === inviteRoles[0])

        return <Chip label={getDisplayName(roleToDisplay)} />
      },
    },
  ]

  const actionColumn: ActionColumn<Invitation> = (invite) => {
    if (
      !hasPermissions(['organizationMembersUpdate']) &&
      !hasPermissions(['organizationMembersDelete'])
    ) {
      return undefined
    }

    const editAction = hasPermissions(['organizationMembersUpdate'])
      ? [
          {
            startIcon: 'pen',
            title: translate('text_664f035a68227f00e261b7f6'),
            onAction: () => {
              editInviteRoleDialogRef.current?.openDialog({
                invite,
              })
            },
          } as ActionItem<InviteItemForMembersSettingsFragment>,
        ]
      : []

    const duplicateAction: ActionItem<InviteItemForMembersSettingsFragment> = {
      startIcon: 'duplicate',
      title: translate('text_63208b630aaf8df6bbfb265f'),
      onAction: () => {
        copyToClipboard(
          `${window.location.origin}${generatePath(INVITATION_ROUTE, {
            token: invite.token,
          })}`,
        )

        addToast({
          severity: 'info',
          translateKey: 'text_63208b630aaf8df6bbfb2679',
        })
      },
      dataTest: 'copy-invite-link',
    }

    const deleteAction = hasPermissions(['organizationMembersDelete'])
      ? [
          {
            startIcon: 'trash',
            title: translate('text_63208c701ce25db78140745e'),
            onAction: () => {
              revokeInviteDialogRef?.current?.openDialog({
                id: invite.id,
                email: invite.email,
                organizationName: invite.organization.name,
              })
            },
          } as ActionItem<InviteItemForMembersSettingsFragment>,
        ]
      : []

    return [...editAction, duplicateAction, ...deleteAction]
  }

  const openCreateInviteDialog = () => {
    createInviteDialogRef.current?.openDialog()
  }

  const getTablePlaceholder = () => {
    const errorState = {
      errorState: {
        title: translate('text_6321a076b94bd1b32494e9ee'),
        subtitle: translate('text_6321a076b94bd1b32494e9e8'),
        buttonTitle: translate('text_6321a076b94bd1b32494e9f2'),
        buttonAction: invitesRefetch,
      },
    }

    const sharedEmptyState = {
      buttonTitle: translate('text_63208b630aaf8df6bbfb265b'),
      buttonAction: openCreateInviteDialog,
    }

    if (searchQuery || selectedRole) {
      return {
        ...errorState,
        emptyState: {
          title: translate('text_1767714241102zgu36uubm70'),
          subtitle: translate('text_1767714241102xpwokcuhvki'),
          ...sharedEmptyState,
        },
      }
    }

    return {
      ...errorState,
      emptyState: {
        title: translate('text_17671750294886x8eq8lizmt'),
        subtitle: translate('text_1767175029488r5limdbdwm5'),
        ...sharedEmptyState,
      },
    }
  }

  return (
    <div>
      <MembersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        type="invitations"
        openCreateInviteDialog={openCreateInviteDialog}
      />
      <InfiniteScroll onBottom={handleInfiniteScrolling}>
        <Table
          name="members-setting-members-list"
          containerSize={{ default: 0 }}
          rowSize={72}
          isLoading={invitesLoading}
          data={filteredInvitations}
          hasError={!!invitesError}
          placeholder={getTablePlaceholder()}
          columns={columns}
          actionColumnTooltip={() => translate('text_626162c62f790600f850b7b6')}
          actionColumn={actionColumn}
        />
      </InfiniteScroll>
      <RevokeInviteDialog ref={revokeInviteDialogRef} />
      <EditInviteRoleDialog ref={editInviteRoleDialogRef} />
      <CreateInviteDialog ref={createInviteDialogRef} />
    </div>
  )
}

export default MembersInvitationList
