import { ApolloClient, ApolloError } from '@apollo/client'
import { captureException } from '@sentry/react'
import { ConditionalWrapper, Icon } from 'lago-design-system'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenuSectionTitle } from '~/components/designSystem/VerticalMenu'
import { logOut, switchCurrentOrganization } from '~/core/apolloClient'
import { authenticationMethodsMapping } from '~/core/constants/authenticationMethodsMapping'
import { HOME_ROUTE } from '~/core/router'
import {
  AuthenticationMethodsEnum,
  CurrentUserInfosFragment,
  MainOrganizationInfosFragment,
  SideNavInfosQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NavLayout } from '~/layouts/NavLayout'
import { MenuPopper } from '~/styles/designSystem'

// 280 + 2px for the border
const POPPER_MIN_WIDTH = 282

export const ORGANIZATION_SWITCHER_TEST_ID = 'organization-switcher'
export const ORGANIZATION_SWITCHER_BUTTON_TEST_ID = 'side-nav-user-infos'
export const ORGANIZATION_SWITCHER_NAME_TEST_ID = 'side-nav-name'
export const ORGANIZATION_SWITCHER_LOGOUT_TEST_ID = 'side-nav-logout'
export const ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID = 'organization-switcher-org-item'
export const ORGANIZATION_SWITCHER_VERSION_LINK_TEST_ID = 'organization-switcher-version-link'

type OrganizationFromMembership = CurrentUserInfosFragment['memberships'][0]['organization']

interface OrganizationSwitcherProps {
  client: ApolloClient<object>
  currentUser: CurrentUserInfosFragment | undefined
  organization: MainOrganizationInfosFragment | undefined
  currentVersion: SideNavInfosQuery['currentVersion'] | null | undefined
  isLoading: boolean
  isVersionLoading: boolean
  refetchCurrentUserInfos: () => void
  refetchOrganizationInfos: () => void
}

export const OrganizationSwitcher = ({
  client,
  currentUser,
  organization,
  currentVersion,
  isLoading,
  isVersionLoading,
  refetchCurrentUserInfos,
  refetchOrganizationInfos,
}: OrganizationSwitcherProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false)

  const organizationList: OrganizationFromMembership[] | undefined = currentUser?.memberships.map(
    (membership) => membership.organization,
  )

  /**
   * Switches the current organization context.
   *
   * Operation sequence is critical:
   * 1. Switch organization context (displays app-wide loading state)
   * 2. Navigate to home route
   * 3. Refetch organization and user info
   *
   * This order ensures the home page queries fire with the correct organization context.
   * Navigating before refetching would cause home queries to execute with stale data,
   * leading to incorrect redirects. The loading state during context switch provides
   * a seamless UX without visible intermediate states.
   */
  const handleOrganizationSwitch = async (organizationId: string): Promise<void> => {
    if (isSwitchingOrg) return

    setIsSwitchingOrg(true)

    try {
      await switchCurrentOrganization(client, organizationId)

      navigate(HOME_ROUTE)

      const refetchPromises = [refetchOrganizationInfos(), refetchCurrentUserInfos()]

      await Promise.allSettled(refetchPromises)
    } catch (error) {
      // Apollo/GraphQL errors are automatically captured by the errorLink in apolloClient/init.ts
      // Only capture non-Apollo errors manually to avoid duplicates
      if (!(error instanceof ApolloError)) {
        captureException(error, {
          tags: {
            errorType: 'OrganizationSwitchError',
            component: 'OrganizationSwitcher',
          },
        })
      }
    } finally {
      setIsSwitchingOrg(false)
    }
  }

  return (
    <NavLayout.NavStickyElementContainer data-test={ORGANIZATION_SWITCHER_TEST_ID}>
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        minWidth={POPPER_MIN_WIDTH}
        maxHeight={`calc(100vh - 64px - 16px)`}
        enableFlip={false}
        opener={
          <Button
            className="max-w-[calc(240px-theme(space.8))] text-left *:first:mr-2"
            data-test={ORGANIZATION_SWITCHER_BUTTON_TEST_ID}
            variant="quaternary"
            size="small"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex flex-row items-center gap-2">
                <Skeleton variant="circular" size="small" />
                <Skeleton variant="text" className="w-30" />
              </div>
            ) : (
              <>
                {organization?.logoUrl ? (
                  <Avatar size="small" variant="connector">
                    <img
                      src={organization?.logoUrl as string}
                      alt={`${organization?.name}'s logo`}
                    />
                  </Avatar>
                ) : (
                  <Avatar
                    variant="company"
                    identifier={organization?.name || ''}
                    size="small"
                    initials={(organization?.name ?? 'Lago')[0]}
                  />
                )}
                <Typography
                  noWrap
                  color="textSecondary"
                  data-test={ORGANIZATION_SWITCHER_NAME_TEST_ID}
                  variant="caption"
                >
                  {organization?.name}
                </Typography>
              </>
            )}
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper className="gap-0 overflow-hidden p-0 not-last-child:shadow-b">
            {!!organizationList?.length && (
              <div
                className="flex flex-col gap-1 overflow-auto p-2"
                style={{ maxHeight: 'calc(100vh - 80px)' }}
              >
                <VerticalMenuSectionTitle title={currentUser?.email || ''} loading={isLoading} />

                {organizationList
                  .toSorted((a, b) => {
                    // First sort by accessibleByCurrentSession (accessible first)
                    if (a.accessibleByCurrentSession !== b.accessibleByCurrentSession) {
                      return a.accessibleByCurrentSession ? -1 : 1
                    }

                    // Then sort alphabetically by name
                    return a.name.toLowerCase()?.localeCompare(b.name.toLowerCase() ?? '') ?? 0
                  })
                  ?.map(({ id, name, logoUrl, accessibleByCurrentSession }) => (
                    <ConditionalWrapper
                      key={`organization-in-side-nav-${id}`}
                      condition={accessibleByCurrentSession}
                      validWrapper={(children) => <>{children}</>}
                      invalidWrapper={(children) => (
                        <Tooltip
                          placement="right"
                          title={
                            organization
                              ? translate('text_1752158380555tozrnmtmxcz', {
                                  method: translate(
                                    authenticationMethodsMapping[
                                      organization.authenticatedMethod as AuthenticationMethodsEnum
                                    ],
                                  ),
                                })
                              : translate('text_1752158380555tozrnmtmxc1')
                          }
                        >
                          {children}
                        </Tooltip>
                      )}
                    >
                      <Button
                        align="left"
                        size="small"
                        fullWidth
                        variant={id === organization?.id ? 'secondary' : 'quaternary'}
                        disabled={!accessibleByCurrentSession || isSwitchingOrg}
                        endIcon={accessibleByCurrentSession ? undefined : 'lock'}
                        data-test={ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID}
                        onClick={async () => {
                          await handleOrganizationSwitch(id)
                          closePopper()
                        }}
                      >
                        {!!logoUrl ? (
                          <Avatar className="mr-2" size="small" variant="connector">
                            <img src={logoUrl} alt={`${name}'s logo`} />
                          </Avatar>
                        ) : (
                          <Avatar
                            className="mr-2"
                            variant="company"
                            identifier={name || ''}
                            size="small"
                            initials={(name ?? 'Lago')[0]}
                          />
                        )}
                        <Typography variant="caption" color="inherit" noWrap>
                          {name}
                        </Typography>
                      </Button>
                    </ConditionalWrapper>
                  ))}
              </div>
            )}

            <div className="flex items-center justify-between p-2 first-child:text-left">
              <Button
                variant="quaternary"
                align="left"
                size="small"
                startIcon="logout"
                data-test={ORGANIZATION_SWITCHER_LOGOUT_TEST_ID}
                onClick={async () => await logOut(client, true)}
              >
                {translate('text_623b497ad05b960101be3444')}
              </Button>
              <div className="flex h-5 items-center justify-between py-3 pl-5 pr-2">
                {isVersionLoading && <Skeleton variant="text" className="w-30" />}
                {!isVersionLoading && !!currentVersion?.githubUrl && !!currentVersion?.number && (
                  <a
                    className="flex items-center gap-2 text-blue visited:text-blue"
                    href={currentVersion.githubUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-test={ORGANIZATION_SWITCHER_VERSION_LINK_TEST_ID}
                  >
                    {currentVersion.number}
                    <Icon className="hover:cursor-pointer" name="outside" size="small" />
                  </a>
                )}
              </div>
            </div>
          </MenuPopper>
        )}
      </Popper>
    </NavLayout.NavStickyElementContainer>
  )
}
