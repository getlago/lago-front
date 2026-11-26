import { postToSelfServe, SelfServeApiError } from '../client'

const mockGetItemFromLS = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'authToken',
}))

jest.mock('~/core/utils/localStorage', () => ({
  getItemFromLS: (key: string) => mockGetItemFromLS(key),
}))

const SERVICE = { name: 'billing-accounts', baseUrl: 'https://billing-accounts.example.com' }
const PATH = '/api/v1/billing_accounts'
const TOKEN = 'session-token'

const mockFetch = jest.fn()

const buildResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
})

const buildNonJsonResponse = (status: number) => ({
  ok: false,
  status,
  json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON at position 0')),
})

const rejectionOf = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (reason: unknown) => reason,
  )

describe('postToSelfServe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = mockFetch
    mockGetItemFromLS.mockReturnValue(TOKEN)
    mockFetch.mockResolvedValue(buildResponse(200, { ok: true }))
  })

  describe('GIVEN the service answers 2xx', () => {
    describe('WHEN posting a body', () => {
      it('THEN should post JSON with the session token and return the parsed body', async () => {
        const result = await postToSelfServe(SERVICE, PATH, { billing_account: { id: 'org' } })

        expect(mockGetItemFromLS).toHaveBeenCalledWith('authToken')
        expect(mockFetch).toHaveBeenCalledWith(`${SERVICE.baseUrl}${PATH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
          body: JSON.stringify({ billing_account: { id: 'org' } }),
          signal: expect.any(AbortSignal),
        })
        expect(result).toEqual({ ok: true })
      })
    })

    describe('WHEN posting without a body', () => {
      it('THEN should send no request body', async () => {
        await postToSelfServe(SERVICE, PATH)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ body: undefined }),
        )
      })
    })

    describe('WHEN there is no session token', () => {
      it('THEN should send no authorization header', async () => {
        mockGetItemFromLS.mockReturnValue(null)

        await postToSelfServe(SERVICE, PATH)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
        )
      })
    })
  })

  describe('GIVEN the service has no URL configured', () => {
    it('THEN should reject without calling the service', async () => {
      await expect(postToSelfServe({ ...SERVICE, baseUrl: '' }, PATH)).rejects.toThrow(
        'billing-accounts URL is not configured',
      )
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the service answers an error with a code', () => {
    describe.each([
      [
        403,
        { status: 403, error: 'Forbidden', code: 'not_organization_admin' },
        'not_organization_admin',
        null,
      ],
      [
        422,
        {
          status: 422,
          error: 'Unprocessable Entity',
          code: 'validation_errors',
          error_details: { organization_id: ['value_is_invalid'] },
        },
        'validation_errors',
        { organization_id: ['value_is_invalid'] },
      ],
    ])('WHEN the status is %s', (status, body, code, errorDetails) => {
      it('THEN should reject with a self-serve API error carrying the status, code and details', async () => {
        mockFetch.mockResolvedValue(buildResponse(status, body))

        const error = await rejectionOf(postToSelfServe(SERVICE, PATH))

        expect(error).toBeInstanceOf(SelfServeApiError)
        expect(error).toMatchObject({
          name: 'SelfServeApiError',
          message: `billing-accounts answered ${status}`,
          status,
          code,
          errorDetails,
        })
      })
    })
  })

  describe('GIVEN the service answers 401 without a code', () => {
    it('THEN should reject with a self-serve API error and no code', async () => {
      mockFetch.mockResolvedValue(buildResponse(401, { status: 401, error: 'Unauthorized' }))

      const error = await rejectionOf(postToSelfServe(SERVICE, PATH))

      expect(error).toBeInstanceOf(SelfServeApiError)
      expect(error).toMatchObject({ status: 401, code: null, errorDetails: null })
    })
  })

  describe('GIVEN the service answers an error whose body is not JSON', () => {
    it('THEN should reject with a self-serve API error carrying only the status', async () => {
      mockFetch.mockResolvedValue(buildNonJsonResponse(502))

      const error = await rejectionOf(postToSelfServe(SERVICE, PATH))

      expect(error).toBeInstanceOf(SelfServeApiError)
      expect(error).toMatchObject({ status: 502, code: null, errorDetails: null })
    })
  })

  describe('GIVEN the service does not answer within 15 seconds', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('THEN should abort the request and reject with the native error', async () => {
      let requestSignal: AbortSignal | undefined

      jest.useFakeTimers()
      mockFetch.mockImplementation(
        (_url: string, init: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            requestSignal = init.signal
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
          }),
      )

      const result = rejectionOf(postToSelfServe(SERVICE, PATH))

      jest.advanceTimersByTime(14_999)
      expect(requestSignal?.aborted).toBe(false)

      jest.advanceTimersByTime(1)

      const error = await result

      expect(requestSignal?.aborted).toBe(true)
      expect(error).toBeDefined()
      expect(error).not.toBeInstanceOf(SelfServeApiError)
    })
  })

  describe('GIVEN the network fails', () => {
    it('THEN should reject with the native error', async () => {
      const networkError = new TypeError('Failed to fetch')

      mockFetch.mockRejectedValue(networkError)

      await expect(postToSelfServe(SERVICE, PATH)).rejects.toBe(networkError)
    })
  })
})
