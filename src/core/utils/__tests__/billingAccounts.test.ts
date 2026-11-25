import { SelfServeApiError } from '~/core/selfServe/client'

import { activateBillingAccount, startBillingAccount } from '../billingAccounts'

const mockEnvGlobalVar = jest.fn()
const mockGetItemFromLS = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'authToken',
  envGlobalVar: () => mockEnvGlobalVar(),
}))

jest.mock('~/core/utils/localStorage', () => ({
  getItemFromLS: (key: string) => mockGetItemFromLS(key),
}))

const BILLING_ACCOUNTS_URL = 'https://billing-accounts.example.com'
const TOKEN = 'session-token'
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_123'
const PAIR = { organizationId: 'production-id', sandboxOrganizationId: 'sandbox-id' }

const mockFetch = jest.fn()

const buildResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
})

const billingAccountBody = (state: string) => ({
  billing_account: {
    organization_id: 'production-id',
    sandbox_organization_id: 'sandbox-id',
    plan_code: 'self_serve',
    state,
    created_at: '2026-11-23T08:00:00Z',
    updated_at: '2026-11-23T08:00:00Z',
  },
})

describe('billingAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = mockFetch
    mockEnvGlobalVar.mockReturnValue({ billingAccountsUrl: BILLING_ACCOUNTS_URL })
    mockGetItemFromLS.mockReturnValue(TOKEN)
  })

  describe('startBillingAccount', () => {
    describe('GIVEN billing-accounts answers with a checkout URL', () => {
      it('THEN should post the pair with the session token and return the checkout URL', async () => {
        mockFetch.mockResolvedValue(
          buildResponse(200, {
            ...billingAccountBody('pending_payment_method'),
            checkout_url: CHECKOUT_URL,
          }),
        )

        const result = await startBillingAccount(PAIR)

        expect(mockGetItemFromLS).toHaveBeenCalledWith('authToken')
        expect(mockFetch).toHaveBeenCalledWith(`${BILLING_ACCOUNTS_URL}/api/v1/billing_accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
          body: JSON.stringify({
            billing_account: {
              organization_id: 'production-id',
              sandbox_organization_id: 'sandbox-id',
            },
          }),
          signal: expect.any(AbortSignal),
        })
        expect(result).toEqual({ checkoutUrl: CHECKOUT_URL })
      })
    })

    describe.each([
      ['the account is already active', { ...billingAccountBody('active'), checkout_url: null }],
      ['no checkout URL field', billingAccountBody('active')],
      ['a null body', null],
    ])('GIVEN billing-accounts answers %s', (_, body) => {
      it('THEN should return no checkout URL', async () => {
        mockFetch.mockResolvedValue(buildResponse(200, body))

        const result = await startBillingAccount(PAIR)

        expect(result).toEqual({ checkoutUrl: null })
      })
    })
  })

  describe('activateBillingAccount', () => {
    describe.each([
      ['active', true],
      ['pending_payment_method', false],
      ['suspended', false],
    ])('GIVEN billing-accounts answers %s', (state, isActive) => {
      it(`THEN should post without a body and answer isActive ${isActive}`, async () => {
        mockFetch.mockResolvedValue(buildResponse(200, billingAccountBody(state)))

        const result = await activateBillingAccount('production-id')

        expect(mockFetch).toHaveBeenCalledWith(
          `${BILLING_ACCOUNTS_URL}/api/v1/billing_accounts/production-id/activate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
            body: undefined,
            signal: expect.any(AbortSignal),
          },
        )
        expect(result).toEqual({ isActive })
      })
    })

    describe.each([
      ['no billing account', {}],
      ['a null billing account', { billing_account: null }],
      ['a null body', null],
    ])('GIVEN billing-accounts answers %s', (_, body) => {
      it('THEN should answer not active', async () => {
        mockFetch.mockResolvedValue(buildResponse(200, body))

        const result = await activateBillingAccount('production-id')

        expect(result).toEqual({ isActive: false })
      })
    })

    describe('GIVEN billing-accounts answers an error', () => {
      it('THEN should reject with the self-serve API error', async () => {
        mockFetch.mockResolvedValue(
          buildResponse(404, {
            status: 404,
            error: 'Not Found',
            code: 'billing_account_not_found',
          }),
        )

        const error = await activateBillingAccount('production-id').catch((reason) => reason)

        expect(error).toBeInstanceOf(SelfServeApiError)
        expect(error).toMatchObject({
          message: 'billing-accounts answered 404',
          status: 404,
          code: 'billing_account_not_found',
        })
      })
    })
  })
})
