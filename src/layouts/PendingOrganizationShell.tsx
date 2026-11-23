import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Icon } from '~/components/designSystem/Icon'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenuSectionTitle } from '~/components/designSystem/VerticalMenu'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { addToast } from '~/core/apolloClient'
import { HOME_ROUTE, useLocation, useNavigate } from '~/core/router'
import { getCounterpartPath } from '~/core/router/utils/counterpartPath'
import { startBillingAccount } from '~/core/utils/billingAccounts'
import { CurrentUserInfosFragment, OrganizationActivationStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { VerticalMenuSkeleton } from '~/layouts/MainNavLayout/VerticalMenuSkeleton'
import { NavLayout } from '~/layouts/NavLayout'

export const PENDING_ORGANIZATION_SHELL_TEST_ID = 'pending-organization-shell'
export const PENDING_ORGANIZATION_NAME_TEST_ID = 'pending-organization-name'
export const PENDING_ORGANIZATION_DIALOG_TEST_ID = 'pending-organization-dialog'
export const PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID = 'pending-organization-cancel-button'
export const PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID =
  'pending-organization-add-payment-method-button'
export const PRODUCTION_ACTIVATION_LOADER_TEST_ID = 'production-activation-loader'

const NAV_SECTION_TITLE_KEYS = [
  'text_1750864088654kxz304zdo2z',
  'text_1783019143196lwfj3wt5eyh',
  'text_1750864088654s9qo2h9fvp7',
]

type MembershipOrganization = CurrentUserInfosFragment['memberships'][number]['organization']

type OrganizationSkeletonProps = PropsWithChildren<{
  organization: Pick<MembershipOrganization, 'name' | 'logoUrl'>
}>

const OrganizationSkeleton = ({
  organization,
  children,
}: OrganizationSkeletonProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <NavLayout.NavWrapper>
      <NavLayout.Nav isOpen={false}>
        <NavLayout.NavStickyElementContainer>
          <div className="flex min-w-0 items-center gap-2 px-3 py-2">
            {organization.logoUrl ? (
              <Avatar size="small" variant="connector">
                <img src={organization.logoUrl} alt={`${organization.name}'s logo`} />
              </Avatar>
            ) : (
              <Avatar
                variant="company"
                identifier={organization.name}
                size="small"
                initials={organization.name[0]}
              />
            )}
            <Typography
              noWrap
              color="textSecondary"
              variant="caption"
              data-test={PENDING_ORGANIZATION_NAME_TEST_ID}
            >
              {organization.name}
            </Typography>
          </div>
        </NavLayout.NavStickyElementContainer>

        <NavLayout.NavSectionGroup>
          {NAV_SECTION_TITLE_KEYS.map((titleKey) => (
            <NavLayout.NavSection key={titleKey}>
              <VerticalMenuSectionTitle title={translate(titleKey)} />
              <VerticalMenuSkeleton numberOfElements={2} />
            </NavLayout.NavSection>
          ))}
        </NavLayout.NavSectionGroup>
      </NavLayout.Nav>

      <NavLayout.ContentWrapper>{children}</NavLayout.ContentWrapper>
    </NavLayout.NavWrapper>
  )
}

export const ProductionActivationLoader = ({
  organization,
}: Pick<OrganizationSkeletonProps, 'organization'>): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="size-full" data-test={PRODUCTION_ACTIVATION_LOADER_TEST_ID}>
      <OrganizationSkeleton organization={organization}>
        <div className="flex size-full items-center justify-center gap-2">
          <Icon name="processing" color="dark" animation="spin" />
          <Typography color="grey600">
            <span className="animate-shimmer bg-[linear-gradient(90deg,theme(colors.grey.600)_40%,theme(colors.grey.300)_50%,theme(colors.grey.600)_60%)] bg-[length:200%_100%] bg-clip-text text-[transparent] motion-reduce:animate-none">
              {translate('text_1795423996043g0y7ze8zabe')}
            </span>
          </Typography>
        </div>
      </OrganizationSkeleton>
    </div>
  )
}

type PendingOrganizationShellProps = {
  organization: Pick<MembershipOrganization, 'id' | 'name' | 'logoUrl' | 'sandboxOrganization'>
}

export const PendingOrganizationShell = ({
  organization,
}: PendingOrganizationShellProps): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { strippedPathname, search, state } = useLocation<{ startCheckout?: boolean } | null>()
  const { currentUser, refetchCurrentUserInfos } = useCurrentUser()
  const shouldStartCheckoutOnMount = !!state?.startCheckout
  const [isStartingCheckout, setIsStartingCheckout] = useState(shouldStartCheckoutOnMount)
  const hasStartedCheckoutRef = useRef(false)

  // The cached `currentUser` is persisted, so an organization activated since keeps its pending
  // status until a network read.
  useEffect(() => {
    refetchCurrentUserInfos()
  }, [refetchCurrentUserInfos])

  const sandboxSlug = currentUser?.memberships.find(
    (membership) =>
      membership.organization.id === organization.sandboxOrganization?.id &&
      membership.organization.accessibleByCurrentSession,
  )?.organization.slug
  const sandboxPath = sandboxSlug
    ? getCounterpartPath({ targetSlug: sandboxSlug, strippedPathname, search })
    : HOME_ROUTE

  const openSandbox = async (): Promise<void> => {
    navigate(sandboxPath, { skipSlugPrepend: true })
  }

  const leaveCheckout = (): void => {
    navigate(sandboxPath, { replace: true, skipSlugPrepend: true })
  }

  const startCheckout = async (): Promise<void> => {
    setIsStartingCheckout(true)

    try {
      const sandboxOrganizationId = organization.sandboxOrganization?.id

      if (!sandboxOrganizationId) throw new Error('The production organization has no sandbox')

      const { checkoutUrl } = await startBillingAccount({
        organizationId: organization.id,
        sandboxOrganizationId,
      })

      if (checkoutUrl) {
        // Stripe's page has no cancel link: Back from it would land on this entry and start a new checkout.
        window.history.replaceState(null, '', sandboxPath)
        // A page restored from the back-forward cache would keep this loader forever.
        window.addEventListener(
          'pageshow',
          (event) => {
            if (event.persisted) window.location.reload()
          },
          { once: true },
        )
        window.location.assign(checkoutUrl)

        return
      }

      const { data } = await refetchCurrentUserInfos()
      const isStillPending = data.currentUser.memberships.some(
        (membership) =>
          membership.organization.id === organization.id &&
          membership.organization.activationStatus ===
            OrganizationActivationStatusEnum.PendingPaymentMethod,
      )

      if (isStillPending) {
        leaveCheckout()

        return
      }

      addToast({ severity: 'success', translateKey: 'text_1795423996044mbp29b5w9nn' })
    } catch {
      leaveCheckout()
    }
  }

  useEffect(() => {
    if (!shouldStartCheckoutOnMount || hasStartedCheckoutRef.current) return

    hasStartedCheckoutRef.current = true
    startCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartCheckoutOnMount])

  if (isStartingCheckout) return <ProductionActivationLoader organization={organization} />

  return (
    <div className="size-full" data-test={PENDING_ORGANIZATION_SHELL_TEST_ID}>
      <OrganizationSkeleton organization={organization} />

      <BaseDialog
        isOpen
        closeDialog={openSandbox}
        removeDialog={() => undefined}
        title={translate('text_1795108407959zrzrubt3hlc')}
        description={
          <>
            {translate('text_1795108407959msxzgohga8h')}
            <br />
            {translate('text_1795108407960l896wfhaet4')}
          </>
        }
        data-test={PENDING_ORGANIZATION_DIALOG_TEST_ID}
        actions={
          <>
            <Button
              variant="quaternary"
              onClick={openSandbox}
              data-test={PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              onClick={startCheckout}
              data-test={PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID}
            >
              {translate('text_1761914802986ww4ima0w9w9')}
            </Button>
          </>
        }
      />
    </div>
  )
}
