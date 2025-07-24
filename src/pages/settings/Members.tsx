import { gql } from '@apollo/client'
import { Avatar } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'

import {
  ActionItem,
  Button,
  Chip,
  InfiniteScroll,
  Table,
  Typography,
} from '~/components/designSystem'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import {
  CreateInviteDialog,
  CreateInviteDialogRef,
} from '~/components/settings/members/CreateInviteDialog'
import {
  EditInviteRoleDialog,
  EditInviteRoleDialogRef,
} from '~/components/settings/members/EditInviteRoleDialog'
import {
  EditMemberRoleDialog,
  EditMemberRoleDialogRef,
} from '~/components/settings/members/EditMemberRoleDialog'
import {
  RevokeInviteDialog,
  RevokeInviteDialogRef,
} from '~/components/settings/members/RevokeInviteDialog'
import {
  RevokeMembershipDialog,
  RevokeMembershipDialogRef,
} from '~/components/settings/members/RevokeMembershipDialog'
import { addToast } from '~/core/apolloClient'
import { getRoleTranslationKey } from '~/core/constants/form'
import { INVITATION_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  InviteForEditRoleForDialogFragmentDoc,
  InviteItemForMembersSettingsFragment,
  MemberForEditRoleForDialogFragmentDoc,
  MembershipItemForMembershipSettingsFragment,
  MembershipRole,
  useGetInvitesQuery,
  useGetMembersQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment InviteItemForMembersSettings on Invite {
    id
    email
    token
    role
    organization {
      id
      name
    }
    ...InviteForEditRoleForDialog
  }

  fragment MembershipItemForMembershipSettings on Membership {
    id
    role
    user {
      id
      email
    }
    organization {
      id
      name
    }
    ...MemberForEditRoleForDialog
  }

  query getInvites($page: Int, $limit: Int) {
    invites(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...InviteItemForMembersSettings
      }
    }
  }

  query getMembers($page: Int, $limit: Int) {
    memberships(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
        adminCount
      }
      collection {
        ...MembershipItemForMembershipSettings
      }
    }
  }

  ${InviteForEditRoleForDialogFragmentDoc}
  ${MemberForEditRoleForDialogFragmentDoc}
`

const Members = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { currentUser } = useCurrentUser()
  const revokeInviteDialogRef = useRef<RevokeInviteDialogRef>(null)
  const revokeMembershipDialogRef = useRef<RevokeMembershipDialogRef>(null)
  const editMemberRoleDiaglogRef = useRef<EditMemberRoleDialogRef>(null)
  const editInviteRoleDiaglogRef = useRef<EditInviteRoleDialogRef>(null)
  const createInviteDialogRef = useRef<CreateInviteDialogRef>(null)
  const {
    data: invitesData,
    error: invitesError,
    loading: invitesLoading,
    refetch: invitesRefetch,
    fetchMore: invitesFetchMore,
  } = useGetInvitesQuery({ variables: { limit: 20 }, notifyOnNetworkStatusChange: true })
  const {
    data: membersData,
    error: membersError,
    loading: membersLoading,
    refetch: membersRefetch,
    fetchMore: membersFetchMore,
  } = useGetMembersQuery({ variables: { limit: 20 }, notifyOnNetworkStatusChange: true })
  const isLoading = invitesLoading || membersLoading
  const invitesMetadata = invitesData?.invites.metadata
  const membersMetadata = membersData?.memberships.metadata
  const hasInvites = !!invitesMetadata?.totalCount
  const { currentPage: inviteCurrentPage = 0, totalPages: inviteTotalPages = 0 } =
    invitesMetadata || {}

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63208b630aaf8df6bbfb2655')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_63208b630aaf8df6bbfb2657')}</Typography>
          <Typography>{translate('text_63208b630aaf8df6bbfb2659')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {!!isLoading && !hasInvites ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              {/* INVITES */}
              {!!hasInvites && (
                <SettingsListItem className="[box-shadow:none]">
                  <SettingsListItemHeader
                    label={translate('text_63208b630aaf8df6bbfb265d')}
                    sublabel={translate('text_1728309971006gggruz7xtfp')}
                    action={
                      !!hasInvites && hasPermissions(['organizationMembersCreate']) ? (
                        <Button
                          variant="inline"
                          onClick={() => {
                            createInviteDialogRef.current?.openDialog()
                          }}
                          data-test="create-invite-button"
                        >
                          {translate('text_645bb193927b375079d28ad2')}
                        </Button>
                      ) : undefined
                    }
                  />

                  <Table
                    name="members-setting-invivations-list"
                    containerSize={{ default: 0 }}
                    rowSize={72}
                    isLoading={invitesLoading}
                    data={invitesData?.invites.collection || []}
                    hasError={!!invitesError}
                    placeholder={{
                      errorState: {
                        title: translate('text_6321a076b94bd1b32494e9e6'),
                        subtitle: translate('text_6321a076b94bd1b32494e9e8'),
                        buttonTitle: translate('text_6321a076b94bd1b32494e9ea'),
                        buttonAction: invitesRefetch,
                      },
                    }}
                    columns={[
                      {
                        key: 'email',
                        title: translate('text_1728310120853rutc5q05ax6'),
                        maxSpace: true,
                        content: ({ email }) => (
                          <div className="flex flex-1 items-center gap-3">
                            <Avatar variant="user" identifier={email.charAt(0)} size="big" />
                            <Typography variant="body" color="grey700">
                              {email}
                            </Typography>
                          </div>
                        ),
                      },
                      {
                        key: 'role',
                        title: translate('text_664f035a68227f00e261b7ec'),
                        minWidth: 170,
                        content: ({ role }) => (
                          <Chip label={translate(getRoleTranslationKey[role])} />
                        ),
                      },
                    ]}
                    actionColumnTooltip={() => translate('text_646e2d0cc536351b62ba6f01')}
                    actionColumn={(invite) => {
                      return [
                        ...(hasPermissions(['organizationMembersUpdate'])
                          ? [
                              {
                                startIcon: 'pen',
                                title: translate('text_664f035a68227f00e261b7f6'),
                                onAction: () => {
                                  editInviteRoleDiaglogRef.current?.openDialog({
                                    invite,
                                  })
                                },
                              } as ActionItem<InviteItemForMembersSettingsFragment>,
                            ]
                          : []),

                        {
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
                        },

                        ...(hasPermissions(['organizationMembersDelete'])
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
                          : []),
                      ]
                    }}
                  />

                  {inviteCurrentPage < inviteTotalPages && (
                    <div className="mx-auto mb-0 mt-4 text-center">
                      <Button
                        variant="quaternary"
                        onClick={() =>
                          invitesFetchMore({
                            variables: { page: inviteCurrentPage + 1 },
                          })
                        }
                      >
                        <Typography variant="body" color="grey600">
                          {translate('text_63208bfc99e69a28211ec7fd')}
                        </Typography>
                      </Button>
                    </div>
                  )}
                </SettingsListItem>
              )}

              {/* MEMBERS */}
              <SettingsListItem className="[box-shadow:none]">
                <SettingsListItemHeader
                  label={translate('text_63208b630aaf8df6bbfb266f')}
                  sublabel={translate('text_1728311671318w5i5bfj4aeq')}
                  action={
                    !hasInvites && hasPermissions(['organizationMembersCreate']) ? (
                      <Button
                        variant="inline"
                        onClick={() => {
                          createInviteDialogRef.current?.openDialog()
                        }}
                        data-test="create-invite-button"
                      >
                        {translate('text_63208b630aaf8df6bbfb265b')}
                      </Button>
                    ) : undefined
                  }
                />

                <InfiniteScroll
                  onBottom={() => {
                    const { currentPage = 0, totalPages = 0 } = membersMetadata || {}

                    currentPage < totalPages &&
                      !membersLoading &&
                      membersFetchMore({
                        variables: { page: currentPage + 1 },
                      })
                  }}
                >
                  <Table
                    name="members-setting-members-list"
                    containerSize={{ default: 0 }}
                    rowSize={72}
                    isLoading={membersLoading}
                    data={membersData?.memberships.collection || []}
                    hasError={!!membersError}
                    placeholder={{
                      errorState: {
                        title: translate('text_6321a076b94bd1b32494e9ee'),
                        subtitle: translate('text_6321a076b94bd1b32494e9f0'),
                        buttonTitle: translate('text_6321a076b94bd1b32494e9f2'),
                        buttonAction: membersRefetch,
                      },
                    }}
                    columns={[
                      {
                        key: 'user.email',
                        title: translate('text_63208b630aaf8df6bbfb2655'),
                        maxSpace: true,
                        content: ({ user }) => (
                          <div className="flex flex-1 items-center gap-3">
                            <Avatar
                              variant="user"
                              identifier={(user.email || '').charAt(0)}
                              size="big"
                            />
                            <Typography variant="body" color="grey700">
                              {user.email}
                            </Typography>
                          </div>
                        ),
                      },
                      {
                        key: 'role',
                        title: translate('text_664f035a68227f00e261b7ec'),
                        minWidth: 170,
                        content: ({ role }) => (
                          <Chip label={translate(getRoleTranslationKey[role])} />
                        ),
                      },
                    ]}
                    actionColumnTooltip={() => translate('text_626162c62f790600f850b7b6')}
                    actionColumn={(membership) => {
                      if (
                        !hasPermissions(['organizationMembersUpdate']) &&
                        !hasPermissions(['organizationMembersDelete'])
                      ) {
                        return undefined
                      }

                      const isCurrentUser = membership.user.id === currentUser?.id

                      return [
                        ...(hasPermissions(['organizationMembersUpdate'])
                          ? [
                              {
                                startIcon: 'pen',
                                title: translate('text_664f035a68227f00e261b7f6'),
                                onAction: () => {
                                  editMemberRoleDiaglogRef.current?.openDialog({
                                    member: membership,
                                    isEditingLastAdmin:
                                      membership.role === 'admin' &&
                                      membersMetadata?.adminCount === 1,
                                    isEditingMyOwnMembership:
                                      currentUser?.id === membership.user.id,
                                  })
                                },
                              } as ActionItem<MembershipItemForMembershipSettingsFragment>,
                            ]
                          : []),

                        ...(hasPermissions(['organizationMembersDelete']) && !isCurrentUser
                          ? [
                              {
                                startIcon: 'trash',
                                title: translate('text_63ea0f84f400488553caa786'),
                                onAction: () => {
                                  revokeMembershipDialogRef.current?.openDialog({
                                    id: membership.id,
                                    email: membership.user.email || '',
                                    organizationName: membership.organization?.name || '',
                                  })
                                },
                              } as ActionItem<MembershipItemForMembershipSettingsFragment>,
                            ]
                          : []),
                      ]
                    }}
                  />
                </InfiniteScroll>
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>

        {!!hasInvites && <RevokeInviteDialog ref={revokeInviteDialogRef} />}
        <RevokeMembershipDialog
          ref={revokeMembershipDialogRef}
          admins={(membersData?.memberships.collection ?? []).filter(
            (member) => member.role === MembershipRole.Admin,
          )}
        />
        <EditMemberRoleDialog ref={editMemberRoleDiaglogRef} />
        <EditInviteRoleDialog ref={editInviteRoleDiaglogRef} />
        <CreateInviteDialog ref={createInviteDialogRef} />
      </SettingsPaddedContainer>
    </>
  )
}

export default Members
