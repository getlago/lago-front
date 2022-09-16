import { forwardRef, MutableRefObject } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { Avatar, Typography, Skeleton, Button, Tooltip, Chip } from '~/components/designSystem'
import { InviteItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

import { RevokeInviteDialogRef } from './RevokeInviteDialog'

gql`
  fragment InviteItem on Invite {
    id
    email
    token
    organization {
      id
      name
    }
  }
`

interface InviteItemProps {
  invite: InviteItemFragment
}

export const InviteItem = forwardRef<RevokeInviteDialogRef, InviteItemProps>(
  ({ invite }: InviteItemProps, ref) => {
    const { id, email, token, organization } = invite
    const { translate } = useInternationalization()

    return (
      <ItemContainer>
        <LeftBlock>
          <Avatar variant="user" identifier={email.charAt(0)} size="medium" />
          <Typography variant="body">{email}</Typography>
        </LeftBlock>
        <RightBlock>
          <Chip label={translate('text_63208b630aaf8df6bbfb2665')} />
          <Tooltip placement="bottom-end" title={translate('text_63208b630aaf8df6bbfb265f')}>
            <ActionButtonIcon
              icon="duplicate"
              variant="quaternary"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/invitation/${token}`)
                addToast({
                  severity: 'info',
                  translateKey: 'text_63208b630aaf8df6bbfb2679',
                })
              }}
            />
          </Tooltip>
          <Tooltip placement="bottom-end" title={translate('text_63208b630aaf8df6bbfb2667')}>
            <ActionButtonIcon
              icon="trash"
              variant="quaternary"
              onClick={() => {
                ;(ref as MutableRefObject<RevokeInviteDialogRef>)?.current?.openDialog({
                  id,
                  email,
                  organizationName: organization.name,
                })
              }}
            />
          </Tooltip>
        </RightBlock>
      </ItemContainer>
    )
  }
)

InviteItem.displayName = 'InviteItem'

export const InviteItemSkeleton = () => {
  return (
    <ItemContainer>
      <Skeleton variant="userAvatar" size="medium" marginRight={theme.spacing(6)} />
      <Skeleton variant="text" height={12} width={240} />
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

  > *:nth-child(1) {
    margin-right: ${theme.spacing(4)};
  }

  > *:nth-child(2) {
    margin-right: ${theme.spacing(3)};
  }
`

const ActionButtonIcon = styled(Button)`
  width: 24px !important;
  height: 24px;
  border-radius: 8px;

  > *:hover {
    cursor: pointer;
  }
`
