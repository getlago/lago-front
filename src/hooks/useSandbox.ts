import { HOME_ROUTE, useLocation } from '~/core/router'
import { findOrganizationRoute } from '~/core/router/utils/routeRegistry'
import { OrganizationEnvironmentEnum } from '~/generated/graphql'
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

  const isSandbox = organization?.environment === OrganizationEnvironmentEnum.Sandbox
  const productionSlug = organization?.productionOrganization?.slug

  if (!isSandbox || !productionSlug) return { isSandbox, productionPath: null }

  const currentRoute = findOrganizationRoute(strippedPathname)

  if (!currentRoute || hasResourceParam(currentRoute.path)) {
    return { isSandbox, productionPath: `/${productionSlug}${HOME_ROUTE}` }
  }

  return { isSandbox, productionPath: `/${productionSlug}${strippedPathname}` }
}
