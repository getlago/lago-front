import { renderHook } from '@testing-library/react'

import {
  SANDBOX_BANNER_HEIGHT,
  SANDBOX_BANNER_HEIGHT_CSS_VAR,
  useSandboxBannerHeightCssVar,
} from '../sandboxBannerHeight'

const createBanner = (height: number): HTMLDivElement => {
  const banner = document.createElement('div')

  jest.spyOn(banner, 'getBoundingClientRect').mockReturnValue({ height } as DOMRect)

  return banner
}

const readCssVar = (): string =>
  document.documentElement.style.getPropertyValue(SANDBOX_BANNER_HEIGHT_CSS_VAR)

describe('useSandboxBannerHeightCssVar', () => {
  const originalResizeObserver = globalThis.ResizeObserver
  let resizeCallback: (() => void) | undefined
  const mockObserve = jest.fn()
  const mockDisconnect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    resizeCallback = undefined
    globalThis.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
      resizeCallback = () => callback([], {} as ResizeObserver)

      return { observe: mockObserve, unobserve: jest.fn(), disconnect: mockDisconnect }
    }) as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver
    document.documentElement.style.removeProperty(SANDBOX_BANNER_HEIGHT_CSS_VAR)
  })

  it('falls back to 0px when the variable is not set', () => {
    expect(SANDBOX_BANNER_HEIGHT).toBe(`var(${SANDBOX_BANNER_HEIGHT_CSS_VAR}, 0px)`)
  })

  describe('GIVEN no banner is rendered', () => {
    it('THEN should not set the CSS variable', () => {
      renderHook(() => useSandboxBannerHeightCssVar(null))

      expect(readCssVar()).toBe('')
      expect(mockObserve).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a banner is rendered', () => {
    it('THEN should expose its measured height on the root element', () => {
      const banner = createBanner(28)

      renderHook(() => useSandboxBannerHeightCssVar(banner))

      expect(readCssVar()).toBe('28px')
      expect(mockObserve).toHaveBeenCalledWith(banner)
    })

    describe('WHEN the banner wraps over more lines', () => {
      it('THEN should update the CSS variable to the new height', () => {
        const banner = createBanner(28)

        renderHook(() => useSandboxBannerHeightCssVar(banner))

        jest.spyOn(banner, 'getBoundingClientRect').mockReturnValue({ height: 76 } as DOMRect)
        resizeCallback?.()

        expect(readCssVar()).toBe('76px')
      })
    })

    describe('WHEN the banner goes away', () => {
      it('THEN should remove the CSS variable and stop observing', () => {
        const banner = createBanner(28)
        const { rerender } = renderHook(
          ({ element }: { element: HTMLElement | null }) => useSandboxBannerHeightCssVar(element),
          { initialProps: { element: banner as HTMLElement | null } },
        )

        rerender({ element: null })

        expect(readCssVar()).toBe('')
        expect(mockDisconnect).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the hook unmounts', () => {
      it('THEN should remove the CSS variable', () => {
        const { unmount } = renderHook(() => useSandboxBannerHeightCssVar(createBanner(28)))

        unmount()

        expect(readCssVar()).toBe('')
      })
    })

    describe('WHEN ResizeObserver is not available', () => {
      it('THEN should still set the height measured on mount', () => {
        // @ts-expect-error simulating an environment without ResizeObserver
        delete globalThis.ResizeObserver

        renderHook(() => useSandboxBannerHeightCssVar(createBanner(28)))

        expect(readCssVar()).toBe('28px')
      })
    })
  })
})
