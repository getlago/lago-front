import { HOME_ROUTE, useLocation } from '~/core/router'
import { findOrganizationRoute } from '~/core/router/utils/routeRegistry'
import { OrganizationEnvironmentEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const RESOURCE_PARAM_PATTERN = /^:.*(id|code|token)$/i

const hasResourceParam = (routePath: string): boolean =>
  routePath.split('/').some((segment) => RESOURCE_PARAM_PATTERN.test(segment))

type UseSandbox = () => {
  isSandbox: boolean
  productionPath: string | null
}

export const useSandbox: UseSandbox = () => {
  const { organization } = useOrganizationInfos()
  const { strippedPathname } = useLocation()
  const { currentUser } = useCurrentUser()

  const isSandbox = organization?.environment === OrganizationEnvironmentEnum.Sandbox
  const production = organization?.productionOrganization
  const isProductionAccessible = !!currentUser?.memberships.find(
    (membership) => membership.organization.id === production?.id,
  )?.organization.accessibleByCurrentSession

  if (!isSandbox || !production || !isProductionAccessible) {
    return { isSandbox, productionPath: null }
  }

  const productionSlug = production.slug

  const currentRoute = findOrganizationRoute(strippedPathname)

  if (!currentRoute || hasResourceParam(currentRoute.path)) {
    return { isSandbox, productionPath: `/${productionSlug}${HOME_ROUTE}` }
  }

  return { isSandbox, productionPath: `/${productionSlug}${strippedPathname}` }
}
