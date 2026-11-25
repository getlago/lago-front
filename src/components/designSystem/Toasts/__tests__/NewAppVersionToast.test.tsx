import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { type Build, BUILD_ID_META_NAME, BUILT_AT_META_NAME } from '~/core/appVersion/buildId'
import {
  CHECK_INTERVAL_MS,
  MIN_CHECK_GAP_MS,
  ROLLBACK_CONFIRM_MS,
} from '~/core/appVersion/useNewAppVersionCheck'
import { reloadWithCacheBust } from '~/core/utils/reloadWithCacheBust'
import { render } from '~/test-utils'

import {
  NEW_APP_VERSION_TOAST_CLOSE_TEST_ID,
  NEW_APP_VERSION_TOAST_RELOAD_TEST_ID,
  NEW_APP_VERSION_TOAST_TEST_ID,
  NewAppVersionToast,
} from '../NewAppVersionToast'

jest.mock('~/core/utils/reloadWithCacheBust', () => ({
  reloadWithCacheBust: jest.fn(),
}))

const OLDER: Build = { id: '1111111111111111', builtAt: 1_000 }
const RUNNING: Build = { id: '0123456789abcdef', builtAt: 2_000 }
const NEW: Build = { id: 'fedcba9876543210', builtAt: 3_000 }
const NEWER: Build = { id: 'aaaaaaaaaaaaaaaa', builtAt: 4_000 }

const setRunningBuild = (build: Build) => {
  for (const [name, content] of [
    [BUILD_ID_META_NAME, build.id],
    [BUILT_AT_META_NAME, String(build.builtAt)],
  ]) {
    const meta = document.createElement('meta')

    meta.setAttribute('name', name)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}

const serveBuild = (build: Build) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ buildId: build.id, builtAt: build.builtAt }),
  })
}

// Moves past the throttle, then refocuses the window, which triggers a check.
const focusAfter = async (ms = MIN_CHECK_GAP_MS + 1) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
    window.dispatchEvent(new Event('focus'))
  })
}

const queryToast = () => screen.queryByTestId(NEW_APP_VERSION_TOAST_TEST_ID)

describe('NewAppVersionToast', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
    document.head.replaceChildren()
    jest.clearAllMocks()
  })

  it('stays hidden while the deployed build is the running one', async () => {
    setRunningBuild(RUNNING)
    serveBuild(RUNNING)
    render(<NewAppVersionToast />)

    await focusAfter()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(queryToast()).not.toBeInTheDocument()
  })

  it('shows once a new build is deployed', async () => {
    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)

    await focusAfter()

    expect(queryToast()).toBeInTheDocument()
  })

  it('does not check right after the page loads', async () => {
    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('ignores an older build answered by an old pod during a rollout', async () => {
    setRunningBuild(RUNNING)
    serveBuild(OLDER)
    render(<NewAppVersionToast />)

    await focusAfter()
    serveBuild(RUNNING)
    await focusAfter(ROLLBACK_CONFIRM_MS)
    serveBuild(OLDER)
    await focusAfter()

    expect(queryToast()).not.toBeInTheDocument()
  })

  it('shows a rollback once the older build is still served after the confirm delay', async () => {
    setRunningBuild(RUNNING)
    serveBuild(OLDER)
    render(<NewAppVersionToast />)

    await focusAfter()
    expect(queryToast()).not.toBeInTheDocument()

    await focusAfter(ROLLBACK_CONFIRM_MS)
    expect(queryToast()).toBeInTheDocument()
  })

  it('never checks without a running build, as on the dev server', async () => {
    serveBuild(NEW)
    render(<NewAppVersionToast />)

    await focusAfter()

    expect(global.fetch).not.toHaveBeenCalled()
    expect(queryToast()).not.toBeInTheDocument()
  })

  it('does not hide again when a request reaches a pod still on the old build', async () => {
    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)

    await focusAfter()
    serveBuild(RUNNING)
    await focusAfter()

    expect(queryToast()).toBeInTheDocument()
  })

  it('ignores an unreadable answer', async () => {
    setRunningBuild(RUNNING)
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) })
    render(<NewAppVersionToast />)

    await focusAfter()

    expect(queryToast()).not.toBeInTheDocument()
  })

  it('reloads the page from the CTA', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)
    await focusAfter()

    await user.click(screen.getByTestId(NEW_APP_VERSION_TOAST_RELOAD_TEST_ID))

    expect(reloadWithCacheBust).toHaveBeenCalledTimes(1)
  })

  it('stays closed for the dismissed build and shows again for a later one', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)
    await focusAfter()

    await user.click(screen.getByTestId(NEW_APP_VERSION_TOAST_CLOSE_TEST_ID))
    expect(queryToast()).not.toBeInTheDocument()

    await focusAfter()
    expect(queryToast()).not.toBeInTheDocument()

    serveBuild(NEWER)
    await focusAfter()
    expect(queryToast()).toBeInTheDocument()
  })

  it('keeps every dismissed build quiet while a rollout alternates between two of them', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuild(RUNNING)
    serveBuild(NEW)
    render(<NewAppVersionToast />)
    await focusAfter()
    await user.click(screen.getByTestId(NEW_APP_VERSION_TOAST_CLOSE_TEST_ID))

    serveBuild(NEWER)
    await focusAfter()
    serveBuild(NEW)
    await focusAfter()
    expect(queryToast()).toBeInTheDocument()

    await user.click(screen.getByTestId(NEW_APP_VERSION_TOAST_CLOSE_TEST_ID))
    serveBuild(NEW)
    await focusAfter()
    expect(queryToast()).not.toBeInTheDocument()

    serveBuild(NEWER)
    await focusAfter()
    expect(queryToast()).not.toBeInTheDocument()
  })

  describe('triggers', () => {
    afterEach(() => {
      jest.restoreAllMocks()
      window.history.pushState({}, '', '/')
    })

    const renderWithNewBuildServed = () => {
      setRunningBuild(RUNNING)
      serveBuild(NEW)
      render(<NewAppVersionToast />)
    }

    it('checks when the tab becomes visible again', async () => {
      renderWithNewBuildServed()

      await act(async () => {
        jest.advanceTimersByTime(MIN_CHECK_GAP_MS + 1)
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(queryToast()).toBeInTheDocument()
    })

    it('checks on the interval without any focus', async () => {
      renderWithNewBuildServed()

      await act(async () => {
        jest.advanceTimersByTime(CHECK_INTERVAL_MS)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(queryToast()).toBeInTheDocument()
    })

    it('checks on a route change', async () => {
      renderWithNewBuildServed()

      await act(async () => {
        jest.advanceTimersByTime(MIN_CHECK_GAP_MS + 1)
        window.history.pushState({}, '', '/customers')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(queryToast()).toBeInTheDocument()
    })

    it('never checks while the tab is hidden', async () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      renderWithNewBuildServed()

      await act(async () => {
        jest.advanceTimersByTime(CHECK_INTERVAL_MS)
        window.dispatchEvent(new Event('focus'))
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
