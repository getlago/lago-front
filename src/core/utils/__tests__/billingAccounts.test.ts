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

    describe('GIVEN there is no session token', () => {
      it('THEN should send no authorization header', async () => {
        mockGetItemFromLS.mockReturnValue(null)
        mockFetch.mockResolvedValue(
          buildResponse(200, { ...billingAccountBody('active'), checkout_url: null }),
        )

        await startBillingAccount(PAIR)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
        )
      })
    })

    describe('GIVEN the setting is empty', () => {
      it('THEN should reject without calling billing-accounts', async () => {
        mockEnvGlobalVar.mockReturnValue({ billingAccountsUrl: '' })

        await expect(startBillingAccount(PAIR)).rejects.toThrow(
          'billing-accounts URL is not configured',
        )
        expect(mockFetch).not.toHaveBeenCalled()
      })
    })

    describe.each([
      [401, { status: 401, code: 'unauthorized' }],
      [403, { status: 403, code: 'not_organization_admin' }],
      [422, { status: 422, code: 'validation_errors' }],
    ])('GIVEN billing-accounts answers %s', (status, body) => {
      it('THEN should reject', async () => {
        mockFetch.mockResolvedValue(buildResponse(status, body))

        await expect(startBillingAccount(PAIR)).rejects.toThrow(
          `billing-accounts answered ${status}`,
        )
      })
    })

    describe('GIVEN billing-accounts does not answer within 15 seconds', () => {
      it('THEN should abort the request and reject', async () => {
        let requestSignal: AbortSignal | undefined

        jest.useFakeTimers()
        mockFetch.mockImplementation(
          (_url: string, init: { signal?: AbortSignal }) =>
            new Promise((_resolve, reject) => {
              requestSignal = init.signal
              init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
            }),
        )

        const result = startBillingAccount(PAIR)

        jest.advanceTimersByTime(14_999)
        expect(requestSignal?.aborted).toBe(false)

        jest.advanceTimersByTime(1)

        await expect(result).rejects.toThrow()
        expect(requestSignal?.aborted).toBe(true)
        jest.useRealTimers()
      })
    })

    describe('GIVEN the network fails', () => {
      it('THEN should reject', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

        await expect(startBillingAccount(PAIR)).rejects.toThrow('Failed to fetch')
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

    describe('GIVEN billing-accounts answers 404', () => {
      it('THEN should reject', async () => {
        mockFetch.mockResolvedValue(buildResponse(404, { status: 404, code: 'not_found' }))

        await expect(activateBillingAccount('production-id')).rejects.toThrow(
          'billing-accounts answered 404',
        )
      })
    })
  })
})
