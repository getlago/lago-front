import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenuSectionTitle } from '~/components/designSystem/VerticalMenu'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { HOME_ROUTE, useLocation, useNavigate } from '~/core/router'
import { getCounterpartPath } from '~/core/router/utils/counterpartPath'
import { CurrentUserInfosFragment } from '~/generated/graphql'
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

const NAV_SECTION_TITLE_KEYS = [
  'text_1750864088654kxz304zdo2z',
  'text_1783019143196lwfj3wt5eyh',
  'text_1750864088654s9qo2h9fvp7',
]

type PendingOrganizationShellProps = {
  organization: Pick<
    CurrentUserInfosFragment['memberships'][number]['organization'],
    'name' | 'logoUrl' | 'sandboxOrganization'
  >
  onAddPaymentMethod: () => void
}

export const PendingOrganizationShell = ({
  organization,
  onAddPaymentMethod,
}: PendingOrganizationShellProps): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { strippedPathname, search } = useLocation()
  const { currentUser } = useCurrentUser()

  const sandboxSlug = currentUser?.memberships.find(
    (membership) =>
      membership.organization.id === organization.sandboxOrganization?.id &&
      membership.organization.accessibleByCurrentSession,
  )?.organization.slug

  const openSandbox = async (): Promise<void> => {
    const target = sandboxSlug
      ? getCounterpartPath({ targetSlug: sandboxSlug, strippedPathname, search })
      : HOME_ROUTE

    navigate(target, { skipSlugPrepend: true })
  }

  return (
    <div className="size-full" data-test={PENDING_ORGANIZATION_SHELL_TEST_ID}>
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

        <NavLayout.ContentWrapper />
      </NavLayout.NavWrapper>

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
              onClick={onAddPaymentMethod}
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
