import { EmbeddedDashboard } from '@superset-ui/embedded-sdk'

import {
  attachDashboardStateSync,
  DASHBOARD_STATE_SEARCH_PARAM,
  extractPermalinkKey,
} from '~/pages/dashboards/dashboardStateSync'

const PERMALINK_URL = 'https://superset.example.com/superset/dashboard/p/AbCd1234/'

type ObserveCallback = (payload: {
  crossFiltersChanged: boolean
  nativeFiltersChanged: boolean
}) => void

type EmbeddedDouble = {
  embedded: EmbeddedDashboard
  getDashboardPermalink: jest.Mock
  getActiveTabs: jest.Mock
  emitDataMask: (payload: { crossFiltersChanged: boolean; nativeFiltersChanged: boolean }) => void
}

const buildEmbeddedDouble = (): EmbeddedDouble => {
  let observeCallback: ObserveCallback = () => undefined

  const getDashboardPermalink = jest.fn().mockResolvedValue(PERMALINK_URL)
  const getActiveTabs = jest.fn().mockResolvedValue(['TAB-one'])
  const observeDataMask = jest.fn((callback: ObserveCallback) => {
    observeCallback = callback
  })

  return {
    embedded: {
      getDashboardPermalink,
      getActiveTabs,
      observeDataMask,
    } as unknown as EmbeddedDashboard,
    getDashboardPermalink,
    getActiveTabs,
    emitDataMask: (payload) => observeCallback(payload),
  }
}

// Lets pending promise callbacks (the awaits inside the module) run between
// timer advances. `jest.advanceTimersByTime` alone only flushes timers.
const flushPromises = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

const advance = async (ms: number): Promise<void> => {
  jest.advanceTimersByTime(ms)
  await flushPromises()
}

describe('extractPermalinkKey', () => {
  it('THEN returns the key from a trailing-slash permalink url', () => {
    expect(extractPermalinkKey(PERMALINK_URL)).toBe('AbCd1234')
  })

  it('THEN returns the key without a trailing slash', () => {
    expect(extractPermalinkKey('https://superset.example.com/superset/dashboard/p/AbCd1234')).toBe(
      'AbCd1234',
    )
  })

  it('THEN returns null when the url has no key segment', () => {
    expect(extractPermalinkKey('https://superset.example.com/superset/dashboard/p/')).toBeNull()
  })

  it('THEN returns null for an unrelated url', () => {
    expect(extractPermalinkKey('not-a-permalink')).toBeNull()
  })
})

describe('DASHBOARD_STATE_SEARCH_PARAM', () => {
  it('THEN is the agreed url param name', () => {
    expect(DASHBOARD_STATE_SEARCH_PARAM).toBe('dashboard_state')
  })
})

describe('attachDashboardStateSync', () => {
  let onStateKey: jest.Mock
  let double: EmbeddedDouble
  let detach: () => void

  beforeEach(() => {
    jest.useFakeTimers()
    onStateKey = jest.fn()
    double = buildEmbeddedDouble()
    detach = attachDashboardStateSync({ embedded: double.embedded, onStateKey })
  })

  afterEach(() => {
    detach()
    jest.useRealTimers()
  })

  describe('GIVEN the hydration data mask emission', () => {
    it('THEN does not request a permalink', async () => {
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: false })

      await advance(2000)

      expect(double.getDashboardPermalink).not.toHaveBeenCalled()
      expect(onStateKey).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a native filter change', () => {
    it('THEN emits the parsed permalink key once the debounce elapses', async () => {
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })

      expect(double.getDashboardPermalink).not.toHaveBeenCalled()

      await advance(800)

      expect(double.getDashboardPermalink).toHaveBeenCalledTimes(1)
      expect(double.getDashboardPermalink).toHaveBeenCalledWith('')
      expect(onStateKey).toHaveBeenCalledWith('AbCd1234')
    })

    it('THEN collapses a burst of changes into a single permalink request', async () => {
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(200)
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(200)
      double.emitDataMask({ crossFiltersChanged: true, nativeFiltersChanged: false })
      await advance(800)

      expect(double.getDashboardPermalink).toHaveBeenCalledTimes(1)
      expect(onStateKey).toHaveBeenCalledTimes(1)
    })

    it('THEN does not re-emit an unchanged key', async () => {
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(800)
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(800)

      expect(double.getDashboardPermalink).toHaveBeenCalledTimes(2)
      expect(onStateKey).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the active tabs are polled', () => {
    it('THEN treats the first reading as a baseline and does not sync', async () => {
      await advance(1000)

      expect(double.getActiveTabs).toHaveBeenCalledTimes(1)
      expect(double.getDashboardPermalink).not.toHaveBeenCalled()
    })

    it('THEN syncs when the active tab changes', async () => {
      await advance(1000)

      double.getActiveTabs.mockResolvedValue(['TAB-two'])

      await advance(1000)
      await advance(800)

      expect(onStateKey).toHaveBeenCalledWith('AbCd1234')
    })

    it('THEN does not sync while the tabs are unchanged', async () => {
      await advance(1000)
      await advance(1000)
      await advance(800)

      expect(double.getDashboardPermalink).not.toHaveBeenCalled()
    })

    it('THEN skips the poll while the document is hidden', async () => {
      const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)

      await advance(1000)

      expect(double.getActiveTabs).not.toHaveBeenCalled()

      hidden.mockRestore()
    })
  })

  describe('GIVEN the permalink request fails', () => {
    it('THEN stops syncing and stops polling', async () => {
      double.getDashboardPermalink.mockRejectedValue(new Error('403'))

      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(800)

      expect(onStateKey).not.toHaveBeenCalled()

      double.getActiveTabs.mockClear()
      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(2000)

      expect(double.getDashboardPermalink).toHaveBeenCalledTimes(1)
      expect(double.getActiveTabs).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the sync is detached', () => {
    it('THEN makes no further rpc calls', async () => {
      detach()

      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(2000)

      expect(double.getDashboardPermalink).not.toHaveBeenCalled()
      expect(double.getActiveTabs).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the sync is detached while a permalink request is in flight', () => {
    it('THEN drops the resolved key instead of emitting it', async () => {
      let resolvePermalink: (url: string) => void = () => undefined

      double.getDashboardPermalink.mockReturnValue(
        new Promise<string>((resolve) => {
          resolvePermalink = resolve
        }),
      )

      double.emitDataMask({ crossFiltersChanged: false, nativeFiltersChanged: true })
      await advance(800)

      expect(double.getDashboardPermalink).toHaveBeenCalledTimes(1)

      detach()
      resolvePermalink(PERMALINK_URL)
      await flushPromises()

      expect(onStateKey).not.toHaveBeenCalled()
    })
  })
})
