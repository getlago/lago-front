import { AUTH_TOKEN_LS_KEY, envGlobalVar } from '~/core/apolloClient/reactiveVars'
import { getItemFromLS } from '~/core/utils/localStorage'

const BILLING_ACCOUNTS_TIMEOUT_MS = 15_000

const postToBillingAccounts = async (path: string, body?: unknown): Promise<unknown> => {
  const { billingAccountsUrl } = envGlobalVar()

  if (!billingAccountsUrl) throw new Error('billing-accounts URL is not configured')

  const token = getItemFromLS(AUTH_TOKEN_LS_KEY)
  const response = await fetch(`${billingAccountsUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    // A request left hanging would keep the activation loader on screen with no way out.
    signal: AbortSignal.timeout(BILLING_ACCOUNTS_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`billing-accounts answered ${response.status}`)

  return response.json()
}

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
