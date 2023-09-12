import { gql } from '@apollo/client'
import { useRef } from 'react'
import styled from 'styled-components'

import { Button, InfiniteScroll, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  CreateInviteDialog,
  CreateInviteDialogRef,
} from '~/components/settings/members/CreateInviteDialog'
import { InviteItem, InviteItemSkeleton } from '~/components/settings/members/InviteItem'
import {
  MembershipItem,
  MembershipItemSkeleton,
} from '~/components/settings/members/MembershipItem'
import {
  RevokeInviteDialog,
  RevokeInviteDialogRef,
} from '~/components/settings/members/RevokeInviteDialog'
import {
  RevokeMembershipDialog,
  RevokeMembershipDialogRef,
} from '~/components/settings/members/RevokeMembershipDialog'
import {
  InviteItemFragmentDoc,
  MembershipItemFragmentDoc,
  useGetInvitesQuery,
  useGetMembersQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'

gql`
  query getInvites($page: Int, $limit: Int) {
    invites(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...InviteItem
      }
    }
  }

  query getMembers($page: Int, $limit: Int) {
    memberships(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...MembershipItem
      }
    }
  }

  ${InviteItemFragmentDoc}
  ${MembershipItemFragmentDoc}
`

const Members = () => {
  const { translate } = useInternationalization()
  const revokeInviteDialogRef = useRef<RevokeInviteDialogRef>(null)
  const revokeMembershipDialogRef = useRef<RevokeMembershipDialogRef>(null)
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
  const invitesMetadata = invitesData?.invites.metadata
  const membersMetadata = membersData?.memberships.metadata
  const hasInvites = !!invitesMetadata?.totalCount
  const { currentPage: inviteCurrentPage = 0, totalPages: inviteTotalPages = 0 } =
    invitesMetadata || {}

  return (
    <Page>
      <Title variant="headline">{translate('text_63208b630aaf8df6bbfb2657')}</Title>
      <Subtitle>{translate('text_63208b630aaf8df6bbfb2659')}</Subtitle>
      {(!!invitesLoading || !!invitesError || !!hasInvites) && (
        <Head>
          {!!invitesLoading && !hasInvites ? (
            <TitleSkeleton variant="text" height={12} width={160} />
          ) : (
            <>
              <Typography variant="subhead">
                {translate('text_63208b630aaf8df6bbfb265d')}
              </Typography>
              {!!hasInvites && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    createInviteDialogRef.current?.openDialog()
                  }}
                  data-test="create-invite-button"
                >
                  {translate('text_63208b630aaf8df6bbfb265b')}
                </Button>
              )}
            </>
          )}
        </Head>
      )}
      <InvitationsListWrapper>
        {!!invitesError ? (
          <ErrorPlaceholder
            noMargins
            title={translate('text_6321a076b94bd1b32494e9e6')}
            subtitle={translate('text_6321a076b94bd1b32494e9e8')}
            buttonTitle={translate('text_6321a076b94bd1b32494e9ea')}
            buttonVariant="primary"
            buttonAction={invitesRefetch}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : !!hasInvites ? (
          <>
            <ListWrapper>
              {invitesData?.invites.collection.map((invite, i) => (
                <InviteItem key={`invite-item-${i}`} ref={revokeInviteDialogRef} invite={invite} />
              ))}
              {!!invitesLoading && (
                <LoadingListWrapper>
                  {[1, 2].map((i) => (
                    <InviteItemSkeleton key={`invite-item-skeleton-${i}`} />
                  ))}
                </LoadingListWrapper>
              )}
            </ListWrapper>
            {inviteCurrentPage < inviteTotalPages && (
              <Loadmore>
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
              </Loadmore>
            )}
          </>
        ) : null}
      </InvitationsListWrapper>

      <Head>
        {!!membersLoading ? (
          <TitleSkeleton variant="text" height={12} width={160} />
        ) : (
          <>
            <Typography variant="subhead">{translate('text_63208b630aaf8df6bbfb266f')}</Typography>
            {!hasInvites && (
              <Button
                variant="secondary"
                onClick={() => {
                  createInviteDialogRef.current?.openDialog()
                }}
                data-test="create-invite-button"
              >
                {translate('text_63208b630aaf8df6bbfb265b')}
              </Button>
            )}
          </>
        )}
      </Head>
      {!!membersError ? (
        <ErrorPlaceholder
          noMargins
          title={translate('text_6321a076b94bd1b32494e9ee')}
          subtitle={translate('text_6321a076b94bd1b32494e9f0')}
          buttonTitle={translate('text_6321a076b94bd1b32494e9f2')}
          buttonVariant="primary"
          buttonAction={membersRefetch}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
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
          <ListWrapper>
            {membersData?.memberships.collection.map((membership, i) => (
              <MembershipItem
                key={`membership-item-${i}`}
                ref={revokeMembershipDialogRef}
                membership={membership}
              />
            ))}

            {!!membersLoading && (
              <LoadingListWrapper>
                {[1, 2, 3].map((i) => (
                  <MembershipItemSkeleton key={`membership-item-skeleton-${i}`} />
                ))}
              </LoadingListWrapper>
            )}
          </ListWrapper>
        </InfiniteScroll>
      )}

      {!!hasInvites && <RevokeInviteDialog ref={revokeInviteDialogRef} />}
      <RevokeMembershipDialog ref={revokeMembershipDialogRef} />
      <CreateInviteDialog ref={createInviteDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TitleSkeleton = styled(Skeleton)`
  margin: 30px 0;
`

const LoadingListWrapper = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const InvitationsListWrapper = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const ErrorPlaceholder = styled(GenericPlaceholder)`
  margin: 0 auto;
`

const ListWrapper = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const Loadmore = styled.div`
  margin: ${theme.spacing(4)} auto 0 auto;
  text-align: center;
`

export default Members
