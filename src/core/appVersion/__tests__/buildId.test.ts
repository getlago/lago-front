import {
  BUILD_ID_META_NAME,
  BUILT_AT_META_NAME,
  fetchDeployedBuild,
  getRunningBuild,
} from '../buildId'

const RUNNING_BUILD = { id: '0123456789abcdef', builtAt: 1_000 }
const DEPLOYED_BUILD = { id: 'fedcba9876543210', builtAt: 2_000 }

const setMeta = (name: string, content: string) => {
  const meta = document.createElement('meta')

  meta.setAttribute('name', name)
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

const serveBody = (body: unknown) => mockFetch({ json: () => Promise.resolve(body) })

describe('getRunningBuild', () => {
  afterEach(() => {
    document.head.replaceChildren()
  })

  it('reads the build from the meta tags', () => {
    setMeta(BUILD_ID_META_NAME, RUNNING_BUILD.id)
    setMeta(BUILT_AT_META_NAME, String(RUNNING_BUILD.builtAt))

    expect(getRunningBuild()).toEqual(RUNNING_BUILD)
  })

  it('returns null without the meta tags, as on the dev server', () => {
    expect(getRunningBuild()).toBeNull()
  })

  it('returns null for a malformed id', () => {
    setMeta(BUILD_ID_META_NAME, 'not-a-build-id')
    setMeta(BUILT_AT_META_NAME, String(RUNNING_BUILD.builtAt))

    expect(getRunningBuild()).toBeNull()
  })

  it('returns null without a build time', () => {
    setMeta(BUILD_ID_META_NAME, RUNNING_BUILD.id)

    expect(getRunningBuild()).toBeNull()
  })
})

describe('fetchDeployedBuild', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns the deployed build', async () => {
    serveBody({ buildId: DEPLOYED_BUILD.id, builtAt: DEPLOYED_BUILD.builtAt })

    expect(await fetchDeployedBuild()).toEqual(DEPLOYED_BUILD)
  })

  it('bypasses every cache', async () => {
    const fetchMock = serveBody({ buildId: DEPLOYED_BUILD.id, builtAt: DEPLOYED_BUILD.builtAt })

    await fetchDeployedBuild()

    const [url, init] = fetchMock.mock.calls[0]

    expect(new URL(url).pathname).toBe('/version.json')
    expect(new URL(url).searchParams.get('t')).toBeTruthy()
    expect(init).toEqual(expect.objectContaining({ cache: 'no-store' }))
  })

  it('returns null when the file is missing', async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({}) })

    expect(await fetchDeployedBuild()).toBeNull()
  })

  it('returns null when the SPA fallback answers with index.html', async () => {
    mockFetch({ json: () => Promise.reject(new SyntaxError('Unexpected token <')) })

    expect(await fetchDeployedBuild()).toBeNull()
  })

  it('returns null for a malformed id', async () => {
    serveBody({ buildId: 42, builtAt: DEPLOYED_BUILD.builtAt })

    expect(await fetchDeployedBuild()).toBeNull()
  })

  it('returns null without a build time', async () => {
    serveBody({ buildId: DEPLOYED_BUILD.id })

    expect(await fetchDeployedBuild()).toBeNull()
  })

  it('returns null on a network error', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    expect(await fetchDeployedBuild()).toBeNull()
  })
})
