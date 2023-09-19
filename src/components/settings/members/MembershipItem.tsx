import { gql } from '@apollo/client'
import { forwardRef, MutableRefObject } from 'react'
import styled from 'styled-components'

import { Avatar, Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { MembershipItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

import { RevokeMembershipDialogRef } from './RevokeMembershipDialog'

gql`
  fragment MembershipItem on Membership {
    id
    user {
      id
      email
    }
  }
`

interface MembershipItemProps {
  membership: MembershipItemFragment
}

export const MembershipItem = forwardRef<RevokeMembershipDialogRef, MembershipItemProps>(
  ({ membership }: MembershipItemProps, ref) => {
    const { id, user } = membership
    const { translate } = useInternationalization()
    const { organization } = useOrganizationInfos()
    const { currentUser } = useCurrentUser()

    return (
      <ItemContainer>
        <LeftBlock>
          <Avatar variant="user" identifier={(user.email || '').charAt(0)} size="medium" />
          <Typography variant="body" color="grey700">
            {user.email}
          </Typography>
        </LeftBlock>
        {currentUser?.id !== user.id && (
          <RightBlock>
            <Tooltip placement="bottom-end" title={translate('text_63208bfc99e69a28211ec7f0')}>
              <ActionButtonIcon
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  ;(ref as MutableRefObject<RevokeMembershipDialogRef>)?.current?.openDialog({
                    id,
                    email: user.email || '',
                    organizationName: organization?.name || '',
                  })
                }}
              />
            </Tooltip>
          </RightBlock>
        )}
      </ItemContainer>
    )
  }
)

MembershipItem.displayName = 'MembershipItem'

export const MembershipItemSkeleton = () => {
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
