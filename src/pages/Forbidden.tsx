import { useApolloClient } from '@apollo/client'
import { ReactNode } from 'react'
import { useParams } from 'react-router'

import {
  GenericPlaceholder,
  GenericPlaceholderContentProps,
} from '~/components/designSystem/GenericPlaceholder'
import { Spinner } from '~/components/designSystem/Spinner'
import { logOut } from '~/core/apolloClient'
import { HOME_ROUTE, LOGIN_ROUTE, useLocation, useNavigate } from '~/core/router'
import { findRefusedOrganization, getAccessibleMemberships } from '~/core/router/utils/orgSlug'
import { setItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'
import { CurrentUserInfosFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import ErrorImage from '~/public/images/maneki/error.svg'

type ForbiddenReason =
  | { type: 'organizationRefused'; organizationName: string; hasAccessibleOrganization: boolean }
  | { type: 'noAccessibleOrganization' }
  | { type: 'missingPermission' }

const getForbiddenReason = (
  currentUser: CurrentUserInfosFragment | undefined,
  organizationSlug: string | undefined,
): ForbiddenReason => {
  const memberships = currentUser?.memberships ?? []
  const hasAccessibleOrganization = getAccessibleMemberships(currentUser).length > 0
  const refusedOrganization = findRefusedOrganization(organizationSlug, currentUser)

  if (refusedOrganization) {
    return {
      type: 'organizationRefused',
      organizationName: refusedOrganization.name,
      hasAccessibleOrganization,
    }
  }

  if (memberships.length && !hasAccessibleOrganization) return { type: 'noAccessibleOrganization' }

  return { type: 'missingPermission' }
}

const Forbidden = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const navigate = useNavigate()
  const { pathname, search, hash } = useLocation()
  const client = useApolloClient()
  const { currentUser, loading } = useCurrentUser()
  const { organizationSlug } = useParams<{ organizationSlug: string }>()

  const reason = getForbiddenReason(currentUser, organizationSlug)
  const logOutButton = {
    title: translate('text_623b497ad05b960101be3444'),
    action: async (): Promise<void> => {
      // Home drains this after the next login and keeps it only if that login can open the org.
      if (reason.type === 'organizationRefused') {
        setItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY, `${pathname}${search}${hash}`)
      }

      await logOut(client, true)
      // `/forbidden` is not a private route, so no guard leaves it once the session is gone.
      navigate(LOGIN_ROUTE, { replace: true })
    },
  }

  const getPlaceholderProps = (): GenericPlaceholderContentProps => {
    if (reason.type === 'organizationRefused') {
      // The org name is user-provided: a ReactNode subtitle renders it as text, not as HTML.
      const subtitle: ReactNode = (
        <>{translate('text_1792079766971dsox5y9l65p', { orgName: reason.organizationName })}</>
      )
      const title = translate('text_17920797669717wipvqpqgvt', {
        orgName: reason.organizationName,
      })

      if (!reason.hasAccessibleOrganization) {
        return {
          title,
          subtitle,
          buttonTitle: logOutButton.title,
          buttonAction: logOutButton.action,
        }
      }

      return {
        title,
        subtitle,
        buttonTitle: translate('text_1792079766971cnr3vlw8vvl'),
        buttonAction: () => navigate(HOME_ROUTE, { skipSlugPrepend: true }),
        secondaryButtonTitle: logOutButton.title,
        secondaryButtonAction: logOutButton.action,
      }
    }

    if (reason.type === 'noAccessibleOrganization') {
      return {
        title: translate('text_1792079766971vkc1n2639mn'),
        subtitle: translate('text_1792079766971dngj0acdbmb'),
        buttonTitle: logOutButton.title,
        buttonAction: logOutButton.action,
      }
    }

    return {
      title: translate('text_66474faf77c70900619567c7'),
      subtitle: translate('text_66474fb55f1b6901c7ac7683'),
      buttonTitle: translate('text_62bac37900192b773560e831'),
      buttonAction: () => goBack(HOME_ROUTE, { previousCount: -2 }),
    }
  }

  if (loading && !currentUser) return <Spinner />

  return (
    <div className="flex h-screen w-screen">
      <GenericPlaceholder
        image={<ErrorImage width="136" height="104" />}
        {...getPlaceholderProps()}
      />
    </div>
  )
}

export default Forbidden
