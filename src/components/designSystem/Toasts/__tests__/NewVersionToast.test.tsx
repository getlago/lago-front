import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BUILD_ID_META_NAME } from '~/core/appVersion/buildId'
import { MIN_CHECK_GAP_MS } from '~/core/appVersion/useNewVersionCheck'
import { reloadWithCacheBust } from '~/core/utils/reloadWithCacheBust'
import { render } from '~/test-utils'

import {
  NEW_VERSION_TOAST_CLOSE_TEST_ID,
  NEW_VERSION_TOAST_RELOAD_TEST_ID,
  NEW_VERSION_TOAST_TEST_ID,
  NewVersionToast,
} from '../NewVersionToast'

jest.mock('~/core/utils/reloadWithCacheBust', () => ({
  reloadWithCacheBust: jest.fn(),
}))

const RUNNING_ID = '0123456789abcdef'
const NEW_ID = 'fedcba9876543210'
const NEWER_ID = 'aaaaaaaaaaaaaaaa'

const setRunningBuildId = (buildId: string) => {
  const meta = document.createElement('meta')

  meta.setAttribute('name', BUILD_ID_META_NAME)
  meta.setAttribute('content', buildId)
  document.head.appendChild(meta)
}

const serveBuildId = (buildId: string) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ buildId }),
  })
}

// Moves past the throttle, then refocuses the window, which triggers a check.
const focusLater = async () => {
  await act(async () => {
    jest.advanceTimersByTime(MIN_CHECK_GAP_MS + 1)
    window.dispatchEvent(new Event('focus'))
  })
}

const queryToast = () => screen.queryByTestId(NEW_VERSION_TOAST_TEST_ID)

describe('NewVersionToast', () => {
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
    setRunningBuildId(RUNNING_ID)
    serveBuildId(RUNNING_ID)
    render(<NewVersionToast />)

    await focusLater()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(queryToast()).not.toBeInTheDocument()
  })

  it('shows once a new build is deployed', async () => {
    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)

    await focusLater()

    expect(queryToast()).toBeInTheDocument()
  })

  it('does not check right after the page loads', async () => {
    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('never checks without a build id, as on the dev server', async () => {
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)

    await focusLater()

    expect(global.fetch).not.toHaveBeenCalled()
    expect(queryToast()).not.toBeInTheDocument()
  })

  it('does not hide again when a request reaches a pod still on the old build', async () => {
    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)

    await focusLater()
    serveBuildId(RUNNING_ID)
    await focusLater()

    expect(queryToast()).toBeInTheDocument()
  })

  it('ignores an unreadable answer', async () => {
    setRunningBuildId(RUNNING_ID)
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) })
    render(<NewVersionToast />)

    await focusLater()

    expect(queryToast()).not.toBeInTheDocument()
  })

  it('reloads the page from the CTA', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)
    await focusLater()

    await user.click(screen.getByTestId(NEW_VERSION_TOAST_RELOAD_TEST_ID))

    expect(reloadWithCacheBust).toHaveBeenCalledTimes(1)
  })

  it('stays closed for the dismissed build and shows again for a later one', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)
    await focusLater()

    await user.click(screen.getByTestId(NEW_VERSION_TOAST_CLOSE_TEST_ID))
    expect(queryToast()).not.toBeInTheDocument()

    await focusLater()
    expect(queryToast()).not.toBeInTheDocument()

    serveBuildId(NEWER_ID)
    await focusLater()
    expect(queryToast()).toBeInTheDocument()
  })

  it('keeps every dismissed build quiet while a rollout alternates between two of them', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    setRunningBuildId(RUNNING_ID)
    serveBuildId(NEW_ID)
    render(<NewVersionToast />)
    await focusLater()
    await user.click(screen.getByTestId(NEW_VERSION_TOAST_CLOSE_TEST_ID))

    serveBuildId(NEWER_ID)
    await focusLater()
    serveBuildId(NEW_ID)
    await focusLater()
    expect(queryToast()).toBeInTheDocument()

    await user.click(screen.getByTestId(NEW_VERSION_TOAST_CLOSE_TEST_ID))
    serveBuildId(NEW_ID)
    await focusLater()
    expect(queryToast()).not.toBeInTheDocument()

    serveBuildId(NEWER_ID)
    await focusLater()
    expect(queryToast()).not.toBeInTheDocument()
  })
})
