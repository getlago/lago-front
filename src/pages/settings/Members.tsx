import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Skeleton, Button, InfiniteScroll } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { theme, NAV_HEIGHT } from '~/styles'
import {
  InviteItemFragmentDoc,
  MembershipItemFragmentDoc,
  useGetInvitesQuery,
  useGetMembersQuery,
} from '~/generated/graphql'
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
  CreateInviteDialog,
  CreateInviteDialogRef,
} from '~/components/settings/members/CreateInviteDialog'

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
  const hasMembers = !!membersMetadata?.totalCount

  return (
    <Page>
      <Title variant="headline">{translate('text_63208b630aaf8df6bbfb2657')}</Title>
      <Subtitle>{translate('text_63208b630aaf8df6bbfb2659')}</Subtitle>
      {(!!invitesLoading || !!invitesError || !!hasInvites) && (
        <Head>
          {!!invitesLoading ? (
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
                >
                  {translate('text_63208b630aaf8df6bbfb265b')}
                </Button>
              )}
            </>
          )}
        </Head>
      )}
      {!!invitesLoading ? (
        <LoadingListWrapper>
          {[1, 2].map((i) => (
            <InviteItemSkeleton key={i} />
          ))}
        </LoadingListWrapper>
      ) : (
        <InvitationsListWrapper>
          {!invitesLoading && !!invitesError ? (
            <ErrorPlaceholder
              noMargins
              title={translate('text_6321a076b94bd1b32494e9e6')}
              subtitle={translate('text_6321a076b94bd1b32494e9e8')}
              buttonTitle={translate('text_6321a076b94bd1b32494e9ea')}
              buttonVariant="primary"
              buttonAction={invitesRefetch}
              image={<ErrorImage width="136" height="104" />}
            />
          ) : (
            <>
              <ListWrapper>
                {invitesData?.invites.collection.map((invite, i) => (
                  <InviteItem
                    key={`invite-item-${i}`}
                    ref={revokeInviteDialogRef}
                    invite={invite}
                  />
                ))}
              </ListWrapper>
              {(invitesMetadata?.currentPage || 0) < (invitesMetadata?.totalPages || 0) && (
                <Loadmore>
                  <Button
                    variant="quaternary"
                    onClick={() =>
                      invitesFetchMore({
                        variables: { page: (invitesMetadata?.currentPage || 0) + 1 },
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
          )}
        </InvitationsListWrapper>
      )}

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
      ) : !!hasMembers ? (
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
          </ListWrapper>
        </InfiniteScroll>
      ) : !!membersLoading ? (
        <LoadingListWrapper>
          {[1, 2, 3].map((i) => (
            <MembershipItemSkeleton key={i} />
          ))}
        </LoadingListWrapper>
      ) : null}

      {!!hasInvites && <RevokeInviteDialog ref={revokeInviteDialogRef} />}
      <RevokeMembershipDialog ref={revokeMembershipDialogRef} />
      <CreateInviteDialog ref={createInviteDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};
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
