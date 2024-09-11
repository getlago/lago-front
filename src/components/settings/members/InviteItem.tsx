import { gql } from '@apollo/client'
import { MutableRefObject } from 'react'
import { generatePath } from 'react-router-dom'
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
import { addToast } from '~/core/apolloClient'
import { getRoleTranslationKey } from '~/core/constants/form'
import { INVITATION_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { InviteItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PopperOpener, theme } from '~/styles'

import { EditInviteRoleDialogRef } from './EditInviteRoleDialog'
import { RevokeInviteDialogRef } from './RevokeInviteDialog'

gql`
  fragment InviteItem on Invite {
    id
    email
    token
    role
    organization {
      id
      name
    }
  }
`

interface InviteItemProps {
  editInviteRoleDiaglogRef: MutableRefObject<EditInviteRoleDialogRef | null>
  invite: InviteItemFragment
  revokeInviteDialogRef: MutableRefObject<RevokeInviteDialogRef | null>
}

export const InviteItem = ({
  editInviteRoleDiaglogRef,
  invite,
  revokeInviteDialogRef,
}: InviteItemProps) => {
  const { id, email, token, organization, role } = invite
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  return (
    <ItemContainer data-test={`invite-item-${email}`}>
      <LeftBlock>
        <Avatar variant="user" identifier={email.charAt(0)} size="big" />
        <Typography variant="body" color="grey700">
          {email}
        </Typography>
      </LeftBlock>
      <RightBlock>
        <Chip label={translate(getRoleTranslationKey[role])} />
        <LocalPopper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen }) => (
            <LocalPopperOpener>
              <Tooltip
                placement="top-end"
                disableHoverListener={isOpen}
                title={translate('text_646e2d0cc536351b62ba6f01')}
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
                    editInviteRoleDiaglogRef.current?.openDialog({
                      invite,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_664f035a68227f00e261b7f6')}
                </Button>
              )}
              <Button
                startIcon="duplicate"
                variant="quaternary"
                align="left"
                onClick={() => {
                  copyToClipboard(
                    `${window.location.origin}${generatePath(INVITATION_ROUTE, {
                      token,
                    })}`,
                  )
                  addToast({
                    severity: 'info',
                    translateKey: 'text_63208b630aaf8df6bbfb2679',
                  })

                  closePopper()
                }}
                data-test="copy-invite-link"
              >
                {translate('text_63208b630aaf8df6bbfb265f')}
              </Button>
              {hasPermissions(['organizationMembersDelete']) && (
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    revokeInviteDialogRef?.current?.openDialog({
                      id,
                      email,
                      organizationName: organization.name,
                    })

                    closePopper()
                  }}
                >
                  {translate('text_63208c701ce25db78140745e')}
                </Button>
              )}
            </MenuPopper>
          )}
        </LocalPopper>
      </RightBlock>
    </ItemContainer>
  )
}

InviteItem.displayName = 'InviteItem'

export const InviteItemSkeleton = () => {
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
