import { gql, useApolloClient } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { hasDefinedGQLError, logOut, onLogIn } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
import { HOME_ROUTE, LOGIN_ROUTE, useNavigate } from '~/core/router'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import {
  CurrentUserFragmentDoc,
  LagoApiError,
  useAcceptInviteMutation,
  useEntraIdAcceptInviteMutation,
  useFetchEntraIdAuthorizeUrlMutation,
  useFetchOktaAuthorizeUrlMutation,
  useGetinviteQuery,
  useGoogleAcceptInviteMutation,
  useJoinOrganizationMutation,
  useOktaAcceptInviteMutation,
} from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import MicrosoftEntraId from '~/public/images/microsoft-entra-id.svg'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

import { InvitationLogInForm } from './invitationForm/InvitationLogInForm'
import { InvitationSignUpForm } from './invitationForm/InvitationSignUpForm'

export const INVITATION_FORM_ID = 'invitation-form'
export const INVITATION_ERROR_ALERT_TEST_ID = 'invitation-error-alert'
export const INVITATION_SUBMIT_BUTTON_TEST_ID = 'submit-button'
export const INVITATION_JOIN_BUTTON_TEST_ID = 'join-button'
export const INVITATION_LOG_IN_BUTTON_TEST_ID = 'log-in-button'
export const INVITATION_LOG_OUT_BUTTON_TEST_ID = 'log-out-button'

/**
 * How the invitation can be accepted:
 * - `signUp`: the invited email has no account, the password is created.
 * - `logInRequired`: the invited email has an account, its password is required.
 * - `join`: the invited user is logged in, only the membership is added.
 * - `emailMismatch`: another user is logged in.
 */
type InvitationMode = 'signUp' | 'logInRequired' | 'join' | 'emailMismatch'

gql`
  query getinvite($token: String!) {
    invite(token: $token) {
      id
      email
      existingUser
      organization {
        id
        name
      }
    }
  }

  mutation acceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      token
      organization {
        id
        slug
      }
    }
  }

  mutation joinOrganization($input: JoinOrganizationInput!) {
    joinOrganization(input: $input) {
      id
      organization {
        id
        slug
      }
    }
  }

  mutation googleAcceptInvite($input: GoogleAcceptInviteInput!) {
    googleAcceptInvite(input: $input) {
      token
      organization {
        id
        slug
      }
    }
  }

  mutation fetchOktaAuthorizeUrl($input: OktaAuthorizeInput!) {
    oktaAuthorize(input: $input) {
      url
    }
  }

  mutation oktaAcceptInvite($input: OktaAcceptInviteInput!) {
    oktaAcceptInvite(input: $input) {
      token
    }
  }

  mutation fetchEntraIdAuthorizeUrl($input: EntraIdAuthorizeInput!) {
    entraIdAuthorize(input: $input) {
      url
    }
  }

  mutation entraIdAcceptInvite($input: EntraIdAcceptInviteInput!) {
    entraIdAcceptInvite(input: $input) {
      token
    }
  }

  ${CurrentUserFragmentDoc}
`

const Invitation = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const { currentUser, loading: currentUserLoading, refetchCurrentUserInfos } = useCurrentUser()
  const { translate } = useInternationalization()
  const { token } = useParams()
  const client = useApolloClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const googleCode = searchParams.get('code') || ''
  const oktaCode = searchParams.get('oktaCode') || ''
  const oktaState = searchParams.get('oktaState') || ''
  const entraIdCode = searchParams.get('entraIdCode') || ''
  const entraIdState = searchParams.get('entraIdState') || ''

  const {
    data,
    error,
    loading,
    refetch: refetchInvite,
  } = useGetinviteQuery({
    context: { silentErrorCodes: [LagoApiError.InviteNotFound, LagoApiError.NotFound] },
    variables: { token: token || '' },
    // Keeps the skeleton visible while the invite is fetched again after a log out.
    notifyOnNetworkStatusChange: true,
    skip: !token,
  })
  const invite = data?.invite
  const email = invite?.email

  const mode: InvitationMode | undefined = useMemo(() => {
    if (!invite) return undefined

    if (isAuthenticated) {
      if (!currentUser) return undefined

      // Emails are not downcased on write, hence the case insensitive comparison.
      const isInvitedUser = currentUser.email?.toLowerCase() === invite.email.toLowerCase()

      return isInvitedUser ? 'join' : 'emailMismatch'
    }

    return invite.existingUser ? 'logInRequired' : 'signUp'
  }, [invite, isAuthenticated, currentUser])

  // Land on the organization of the invitation. Without it the home page would resolve the last
  // used organization, which is not the one that was just joined.
  const onAccepted = async (userToken: string, slug?: string) => {
    await onLogIn(client, userToken)
    navigate(slug ? `/${slug}` : HOME_ROUTE, { replace: true, skipSlugPrepend: true })
  }

  // Logging out clears the Apollo store without refetching the active queries, so the invite has
  // to be queried again to render the logged out flow.
  const onLogOut = async () => {
    await logOut(client, true)
    await refetchInvite()
  }

  const [acceptInvite, { error: acceptInviteError, loading: acceptInviteLoading }] =
    useAcceptInviteMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted: async (res) => {
        if (!!res?.acceptInvite) {
          await onAccepted(res.acceptInvite.token, res.acceptInvite.organization.slug)
        }
      },
    })

  const [joinOrganization, { error: joinOrganizationError, loading: joinOrganizationLoading }] =
    useJoinOrganizationMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted: async (res) => {
        const slug = res?.joinOrganization?.organization.slug

        if (!slug) return

        // The mutation cannot return the permissions and the organization details the cached
        // current user holds, so the memberships are reloaded instead of written to the cache.
        await refetchCurrentUserInfos()
        navigate(`/${slug}`, { replace: true, skipSlugPrepend: true })
      },
    })

  const [googleAcceptInvite, { error: googleAcceptInviteError }] = useGoogleAcceptInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (!!res?.googleAcceptInvite) {
        await onAccepted(res.googleAcceptInvite.token, res.googleAcceptInvite.organization.slug)
      }
    },
  })

  const [
    fetchOktaAuthorizeUrl,
    { error: oktaAuthorizeUrlError, loading: oktaAuthorizeUrlLoading },
  ] = useFetchOktaAuthorizeUrlMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [oktaAcceptInvite, { error: oktaAcceptInviteError, loading: oktaAcceptInviteLoading }] =
    useOktaAcceptInviteMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted: async (res) => {
        if (!!res?.oktaAcceptInvite) {
          await onAccepted(res.oktaAcceptInvite.token)
        }
      },
    })

  const [
    fetchEntraIdAuthorizeUrl,
    { error: entraIdAuthorizeUrlError, loading: entraIdAuthorizeUrlLoading },
  ] = useFetchEntraIdAuthorizeUrlMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [
    entraIdAcceptInvite,
    { error: entraIdAcceptInviteError, loading: entraIdAcceptInviteLoading },
  ] = useEntraIdAcceptInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (res?.entraIdAcceptInvite) {
        await onAccepted(res.entraIdAcceptInvite.token)
      }
    },
  })

  // Both forms submit the same mutation. The API creates the password when the invited email has
  // no account, and verifies it otherwise.
  const onSubmitPassword = async (password: string) => {
    await acceptInvite({
      variables: {
        input: {
          token: token || '',
          password,
        },
      },
    })
  }

  const onOktaLogin = async () => {
    const { data: oktaAuthorizeData } = await fetchOktaAuthorizeUrl({
      variables: {
        input: {
          email: email || '',
        },
      },
    })

    if (oktaAuthorizeData?.oktaAuthorize?.url) {
      window.location.href = addValuesToUrlState({
        url: oktaAuthorizeData.oktaAuthorize.url,
        values: {
          invitationToken: token || '',
        },
        stateType: 'string',
      })
    }
  }

  const onEntraIdLogin = async () => {
    const { data: entraIdAuthorizeData } = await fetchEntraIdAuthorizeUrl({
      variables: {
        input: {
          email: email || '',
        },
      },
    })

    if (entraIdAuthorizeData?.entraIdAuthorize?.url) {
      window.location.href = addValuesToUrlState({
        url: entraIdAuthorizeData.entraIdAuthorize.url,
        values: {
          invitationToken: token || '',
        },
        stateType: 'string',
      })
    }
  }

  useEffect(() => {
    if (!!googleCode && !!token) {
      googleAcceptInvite({
        variables: {
          input: {
            code: googleCode,
            inviteToken: token || '',
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleCode, token])

  useEffect(() => {
    if (!!oktaCode && !!oktaState && !!token) {
      oktaAcceptInvite({
        variables: {
          input: {
            code: oktaCode,
            state: oktaState,
            inviteToken: token || '',
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oktaCode, oktaState, token])

  useEffect(() => {
    if (!!entraIdCode && !!entraIdState && !!token) {
      entraIdAcceptInvite({
        variables: {
          input: {
            code: entraIdCode,
            state: entraIdState,
            inviteToken: token,
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entraIdCode, entraIdState, token])

  const errorTranslation: string | undefined = useMemo(() => {
    if (
      !acceptInviteError &&
      !joinOrganizationError &&
      !googleAcceptInviteError &&
      !oktaAcceptInviteError &&
      !oktaAuthorizeUrlError &&
      !entraIdAcceptInviteError &&
      !entraIdAuthorizeUrlError
    )
      return

    // If any error occur, we need to remove the code from the URL
    history.replaceState({}, '', window.location.pathname)

    if (
      hasDefinedGQLError('InvalidGoogleCode', googleAcceptInviteError) ||
      hasDefinedGQLError('InvalidGoogleToken', googleAcceptInviteError)
    ) {
      return translate('text_660bf95c75dd928ced0ecb25', {
        href: DOCUMENTATION_ENV_VARS,
      })
    }

    if (hasDefinedGQLError('InviteEmailMistmatch', googleAcceptInviteError)) {
      return translate('text_660bf95c75dd928ced0ecb2b')
    }

    if (hasDefinedGQLError('DomainNotConfigured', oktaAuthorizeUrlError)) {
      return translate('text_664c90c9b2b6c2012aa50bd1')
    }

    if (hasDefinedGQLError('OktaUserinfoError', oktaAcceptInviteError)) {
      return translate('text_664c98989d08a3f733357f73')
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', oktaAcceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_664c732c264d7eed1c74fda2'),
      })
    }

    if (hasDefinedGQLError('DomainNotConfigured', entraIdAuthorizeUrlError)) {
      return translate('text_1784307344255gbzqobkgkr0')
    }

    if (hasDefinedGQLError('EntraIdUserinfoError', entraIdAcceptInviteError)) {
      return translate('text_178430734425582hoo5w7p20')
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', entraIdAcceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_17843073442548zt904xoinv'),
      })
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', googleAcceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_1752158380555upqjf6cxtq9'),
      })
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', acceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_1752158380555c18bvtn8gd8'),
      })
    }

    // The password submitted for an invitation whose email already has an account did not match.
    if (hasDefinedGQLError('IncorrectLoginOrPassword', acceptInviteError)) {
      return translate('text_620bc4d4269a55014d493fb7')
    }

    if (hasDefinedGQLError('EmailAlreadyUsed', acceptInviteError)) {
      return translate('text_1786557508910guitmzid55q')
    }

    if (hasDefinedGQLError('InviteEmailMistmatch', joinOrganizationError)) {
      return translate('text_17865575089107lip4oupwdj')
    }

    if (hasDefinedGQLError('EmailAlreadyUsed', joinOrganizationError)) {
      return translate('text_1786557508910guitmzid55q')
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', joinOrganizationError)) {
      return translate('text_1786557573982blvi6cjpnti')
    }

    return

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    acceptInviteError,
    joinOrganizationError,
    googleAcceptInviteError,
    oktaAcceptInviteError,
    oktaAuthorizeUrlError,
    entraIdAcceptInviteError,
    entraIdAuthorizeUrlError,
  ])

  const errorAlert = !!errorTranslation && (
    <Alert type="danger" data-test={INVITATION_ERROR_ALERT_TEST_ID}>
      <Typography color="inherit" html={errorTranslation} />
    </Alert>
  )

  const ssoButtons = (
    <Stack spacing={4}>
      <GoogleAuthButton
        mode="invite"
        invitationToken={token || ''}
        label={translate('text_664c90c9b2b6c2012aa50bd3')}
      />

      <Button
        fullWidth
        startIcon="okta"
        size="large"
        variant="tertiary"
        onClick={() => onOktaLogin()}
        loading={oktaAuthorizeUrlLoading || oktaAcceptInviteLoading}
      >
        {translate('text_664c90c9b2b6c2012aa50bd5')}
      </Button>

      <Button
        fullWidth
        size="large"
        variant="tertiary"
        onClick={() => onEntraIdLogin()}
        loading={entraIdAuthorizeUrlLoading || entraIdAcceptInviteLoading}
      >
        <MicrosoftEntraId className="mr-2 size-4" />
        {translate('text_1784307344255ojifndnfotw')}
      </Button>
    </Stack>
  )

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        {(!!error || !data?.invite) && !loading && (
          <>
            <Title>{translate('text_63246f875e2228ab7b63dcf4')}</Title>
            <Subtitle noMargins>{translate('text_63246f875e2228ab7b63dcfe')}</Subtitle>
            <Button
              fullWidth
              variant="primary"
              size="large"
              onClick={() => window.location.assign(LOGIN_ROUTE)}
              className="mt-6"
            >
              {translate('text_620bc4d4269a55014d493f6d')}
            </Button>
          </>
        )}
        {!error && (!!loading || (isAuthenticated && (!!currentUserLoading || !currentUser))) && (
          <>
            <Skeleton variant="text" className="mb-8 w-52" />
            <Skeleton variant="text" className="mb-4 w-110" />
            <Skeleton variant="text" className="w-76" />
          </>
        )}
        {!error && !loading && !!invite && !!mode && (
          <Stack spacing={8}>
            <Stack spacing={3}>
              <Typography variant="headline">
                {translate('text_664c90c9b2b6c2012aa50bcd', {
                  orgnisationName: invite.organization.name,
                })}
              </Typography>
              <Typography>
                {mode === 'signUp' && translate('text_63246f875e2228ab7b63dcd4')}
                {mode === 'logInRequired' && translate('text_1786557508910b6cacpc0pjt', { email })}
                {mode === 'join' &&
                  translate('text_17865575089107fdhugc24r9', { email: currentUser?.email })}
                {mode === 'emailMismatch' &&
                  translate('text_1786557508910jl708qczi4g', {
                    inviteEmail: email,
                    currentEmail: currentUser?.email,
                  })}
              </Typography>
            </Stack>

            {errorAlert}

            {mode === 'join' && (
              <Button
                data-test={INVITATION_JOIN_BUTTON_TEST_ID}
                fullWidth
                size="large"
                variant="primary"
                loading={joinOrganizationLoading}
                onClick={() => joinOrganization({ variables: { input: { token: token || '' } } })}
              >
                {translate('text_17865575089104r0enbn7r7l')}
              </Button>
            )}

            {mode === 'emailMismatch' && (
              <Button
                data-test={INVITATION_LOG_OUT_BUTTON_TEST_ID}
                fullWidth
                size="large"
                variant="primary"
                onClick={() => onLogOut()}
              >
                {translate('text_17865575089106781wwdm3l3')}
              </Button>
            )}

            {(mode === 'signUp' || mode === 'logInRequired') && (
              <>
                {ssoButtons}

                <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
                  <Typography variant="captionHl" color="grey500">
                    {translate('text_6303351deffd2a0d70498675').toUpperCase()}
                  </Typography>
                </div>

                {mode === 'signUp' ? (
                  <InvitationSignUpForm
                    email={email}
                    formId={INVITATION_FORM_ID}
                    loading={acceptInviteLoading}
                    submitDataTest={INVITATION_SUBMIT_BUTTON_TEST_ID}
                    onSubmit={onSubmitPassword}
                  />
                ) : (
                  <InvitationLogInForm
                    email={email}
                    formId={INVITATION_FORM_ID}
                    loading={acceptInviteLoading}
                    submitDataTest={INVITATION_LOG_IN_BUTTON_TEST_ID}
                    onSubmit={onSubmitPassword}
                  />
                )}

                {mode === 'signUp' && (
                  <Typography
                    variant="caption"
                    html={translate('text_63246f875e2228ab7b63dd1f', { link: LOGIN_ROUTE })}
                  />
                )}
              </>
            )}
          </Stack>
        )}
      </Card>
    </Page>
  )
}

export default Invitation
