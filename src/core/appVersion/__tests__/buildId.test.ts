import { BUILD_ID_META_NAME, fetchDeployedBuildId, getRunningBuildId } from '../buildId'

const RUNNING_ID = '0123456789abcdef'
const DEPLOYED_ID = 'fedcba9876543210'

const setMeta = (content: string) => {
  const meta = document.createElement('meta')

  meta.setAttribute('name', BUILD_ID_META_NAME)
  meta.setAttribute('content', content)
  document.head.appendChild(meta)
}

const mockFetch = (response: Partial<Response> | Error) => {
  const fetchMock =
    response instanceof Error
      ? jest.fn().mockRejectedValue(response)
      : jest.fn().mockResolvedValue({ ok: true, ...response })

  global.fetch = fetchMock

  return fetchMock
}

describe('getRunningBuildId', () => {
  afterEach(() => {
    document.head.replaceChildren()
  })

  it('reads the build id from the meta tag', () => {
    setMeta(RUNNING_ID)

    expect(getRunningBuildId()).toBe(RUNNING_ID)
  })

  it('returns null without the meta tag, as on the dev server', () => {
    expect(getRunningBuildId()).toBeNull()
  })

  it('returns null for a malformed id', () => {
    setMeta('not-a-build-id')

    expect(getRunningBuildId()).toBeNull()
  })
})

describe('fetchDeployedBuildId', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns the deployed build id', async () => {
    mockFetch({ json: () => Promise.resolve({ buildId: DEPLOYED_ID }) })

    expect(await fetchDeployedBuildId()).toBe(DEPLOYED_ID)
  })

  it('bypasses every cache', async () => {
    const fetchMock = mockFetch({ json: () => Promise.resolve({ buildId: DEPLOYED_ID }) })

    await fetchDeployedBuildId()

    const [url, init] = fetchMock.mock.calls[0]

    expect(new URL(url).pathname).toBe('/version.json')
    expect(new URL(url).searchParams.get('t')).toBeTruthy()
    expect(init).toEqual(expect.objectContaining({ cache: 'no-store' }))
  })

  it('returns null when the file is missing', async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({}) })

    expect(await fetchDeployedBuildId()).toBeNull()
  })

  it('returns null when the SPA fallback answers with index.html', async () => {
    mockFetch({ json: () => Promise.reject(new SyntaxError('Unexpected token <')) })

    expect(await fetchDeployedBuildId()).toBeNull()
  })

  it('returns null for a malformed body', async () => {
    mockFetch({ json: () => Promise.resolve({ buildId: 42 }) })

    expect(await fetchDeployedBuildId()).toBeNull()
  })

  it('returns null on a network error', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    expect(await fetchDeployedBuildId()).toBeNull()
  })
})
