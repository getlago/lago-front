import { gql } from '@apollo/client'
import { MutableRefObject } from 'react'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Chip,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { getRoleTranslationKey } from '~/core/constants/form'
import { MemberForEditRoleForDialogFragmentDoc, MembershipItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PopperOpener, theme } from '~/styles'

import { EditMemberRoleDialogRef } from './EditMemberRoleDialog'
import { RevokeMembershipDialogRef } from './RevokeMembershipDialog'

gql`
  fragment MembershipItem on Membership {
    id
    role
    user {
      id
      email
    }
    ...MemberForEditRoleForDialog
  }

  ${MemberForEditRoleForDialogFragmentDoc}
`

interface MembershipItemProps {
  adminCount: number | undefined
  editMemberRoleDiaglogRef: MutableRefObject<EditMemberRoleDialogRef | null>
  membership: MembershipItemFragment
  revokeMembershipDialogRef: MutableRefObject<RevokeMembershipDialogRef | null>
}

export const MembershipItem = ({
  adminCount = 1,
  editMemberRoleDiaglogRef,
  membership,
  revokeMembershipDialogRef,
}: MembershipItemProps) => {
  const { id, user } = membership
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const { currentUser } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const isMyMembership = currentUser?.id === user.id

  return (
    <ItemContainer>
      <LeftBlock>
        <Avatar variant="user" identifier={(user.email || '').charAt(0)} size="big" />
        <Typography variant="body" color="grey700">
          {user.email}
        </Typography>
      </LeftBlock>
      <RightBlock>
        <Chip label={translate(getRoleTranslationKey[membership.role])} />

        {(hasPermissions(['organizationMembersUpdate']) ||
          hasPermissions(['organizationMembersDelete'])) && (
          <LocalPopper
            PopperProps={{ placement: 'bottom-end' }}
            opener={({ isOpen }) => (
              <LocalPopperOpener>
                <Tooltip
                  placement="top-end"
                  disableHoverListener={isOpen}
                  title={translate('text_626162c62f790600f850b7b6')}
                >
                  <Button icon="dots-horizontal" variant="quaternary" size="small" />
                </Tooltip>
              </LocalPopperOpener>
            )}
          >
            {({ closePopper }) => (
              <MenuPopper>
                {hasPermissions(['organizationMembersUpdate']) && (
                  <Button
                    startIcon="pen"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      editMemberRoleDiaglogRef.current?.openDialog({
                        member: membership,
                        isEditingLastAdmin: membership.role === 'admin' && adminCount === 1,
                        isEditingMyOwnMembership: isMyMembership,
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_664f035a68227f00e261b7f6')}
                  </Button>
                )}
                {hasPermissions(['organizationMembersDelete']) && (
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    align="left"
                    disabled={isMyMembership}
                    onClick={() => {
                      revokeMembershipDialogRef.current?.openDialog({
                        id,
                        email: user.email || '',
                        organizationName: organization?.name || '',
                      })
                    }}
                  >
                    {translate('text_63ea0f84f400488553caa786')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </LocalPopper>
        )}
      </RightBlock>
    </ItemContainer>
  )
}

MembershipItem.displayName = 'MembershipItem'

export const MembershipItemSkeleton = () => {
  return (
    <ItemContainer>
      <Skeleton variant="userAvatar" size="big" marginRight={theme.spacing(6)} />
      <Skeleton variant="text" height={12} width={160} />
    </ItemContainer>
  )
}

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing(4)};
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;

  /* Used to place correclty the popper opener */
  position: relative;
`

const LeftBlock = styled.div`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const RightBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const LocalPopper = styled(Popper)`
  width: 24px;
  height: 24px;
`

const LocalPopperOpener = styled(PopperOpener)`
  top: ${theme.spacing(6)};
  right: ${theme.spacing(4)};
`
