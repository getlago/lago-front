import { envGlobalVar } from '~/core/apolloClient/reactiveVars'
import { postToSelfServe } from '~/core/selfServe/client'

const postToBillingAccounts = (path: string, body?: unknown): Promise<unknown> =>
  postToSelfServe(
    { name: 'billing-accounts', baseUrl: envGlobalVar().billingAccountsUrl },
    path,
    body,
  )

export const startBillingAccount = async ({
  organizationId,
  sandboxOrganizationId,
}: {
  organizationId: string
  sandboxOrganizationId: string
}): Promise<{ checkoutUrl: string | null }> => {
  const body = await postToBillingAccounts('/api/v1/billing_accounts', {
    billing_account: {
      organization_id: organizationId,
      sandbox_organization_id: sandboxOrganizationId,
    },
  })
  const checkoutUrl =
    typeof body === 'object' &&
    body !== null &&
    'checkout_url' in body &&
    typeof body.checkout_url === 'string'
      ? body.checkout_url
      : null

  return { checkoutUrl }
}

export const activateBillingAccount = async (
  organizationId: string,
): Promise<{ isActive: boolean }> => {
  const body = await postToBillingAccounts(
    `/api/v1/billing_accounts/${encodeURIComponent(organizationId)}/activate`,
  )
  const isActive =
    typeof body === 'object' &&
    body !== null &&
    'billing_account' in body &&
    typeof body.billing_account === 'object' &&
    body.billing_account !== null &&
    'state' in body.billing_account &&
    body.billing_account.state === 'active'

  return { isActive }
}
