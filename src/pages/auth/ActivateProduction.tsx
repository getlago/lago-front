import { useEffect, useRef, useState } from 'react'

import { Spinner } from '~/components/designSystem/Spinner'
import { addToast } from '~/core/apolloClient'
import { HOME_ROUTE, useNavigate } from '~/core/router'
import { activateBillingAccount } from '~/core/utils/billingAccounts'
import {
  CurrentUserInfosFragment,
  OrganizationActivationStatusEnum,
  OrganizationEnvironmentEnum,
} from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { ProductionActivationLoader } from '~/layouts/PendingOrganizationShell'

type MembershipOrganization = CurrentUserInfosFragment['memberships'][number]['organization']

const ActivateProduction = (): JSX.Element => {
  const navigate = useNavigate()
  const { refetchCurrentUserInfos } = useCurrentUser()
  const [activatingOrganization, setActivatingOrganization] = useState<MembershipOrganization>()
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return

    hasStartedRef.current = true

    const activate = async (): Promise<void> => {
      let memberships: MembershipOrganization[]

      try {
        // The cached `currentUser` is persisted with a delay, so it can predate the signup.
        const { data } = await refetchCurrentUserInfos()

        memberships = data.currentUser.memberships.map(({ organization }) => organization)
      } catch {
        navigate(HOME_ROUTE, { replace: true })

        return
      }

      const productionOrganization = memberships.find(
        (organization) =>
          organization.accessibleByCurrentSession &&
          organization.environment === OrganizationEnvironmentEnum.Production &&
          organization.activationStatus === OrganizationActivationStatusEnum.PendingPaymentMethod,
      )

      if (!productionOrganization) {
        navigate(HOME_ROUTE, { replace: true })

        return
      }

      const sandboxSlug = memberships.find(
        (organization) =>
          organization.id === productionOrganization.sandboxOrganization?.id &&
          organization.accessibleByCurrentSession,
      )?.slug
      const openSandbox = (): void => {
        navigate(sandboxSlug ? `/${sandboxSlug}` : HOME_ROUTE, {
          replace: true,
          skipSlugPrepend: true,
        })
      }

      setActivatingOrganization(productionOrganization)

      const isActive = await activateBillingAccount(productionOrganization.id).then(
        (result) => result.isActive,
        () => false,
      )

      if (!isActive) {
        openSandbox()

        return
      }

      // Already active: if this read fails, the pending shell refetches `currentUser` on mount.
      await refetchCurrentUserInfos().catch(() => undefined)
      addToast({ severity: 'success', translateKey: 'text_1795423996044mbp29b5w9nn' })
      navigate(`/${productionOrganization.slug}`, { replace: true, skipSlugPrepend: true })
    }

    void activate()
  }, [navigate, refetchCurrentUserInfos])

  if (activatingOrganization) {
    return <ProductionActivationLoader organization={activatingOrganization} />
  }

  return <Spinner />
}

export default ActivateProduction
