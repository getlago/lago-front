import { useLocation } from '~/core/router'
import { getCounterpartPath } from '~/core/router/utils/counterpartPath'
import { OrganizationEnvironmentEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

type UseSandbox = () => {
  isSandbox: boolean
  productionPath: string | null
}

export const useSandbox: UseSandbox = () => {
  const { organization } = useOrganizationInfos()
  const { strippedPathname, search } = useLocation()
  const { currentUser } = useCurrentUser()

  const isSandbox = organization?.environment === OrganizationEnvironmentEnum.Sandbox
  const production = organization?.productionOrganization
  const isProductionAccessible = !!currentUser?.memberships.find(
    (membership) => membership.organization.id === production?.id,
  )?.organization.accessibleByCurrentSession

  if (!isSandbox || !production || !isProductionAccessible) {
    return { isSandbox, productionPath: null }
  }

  return {
    isSandbox,
    productionPath: getCounterpartPath({ targetSlug: production.slug, strippedPathname, search }),
  }
}
