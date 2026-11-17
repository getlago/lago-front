import { useEffect } from 'react'

// Set on the root element because poppers are portaled to <body>; the banner's height
// varies as it wraps on narrow screens. Unset (falls back to 0px) when no banner is shown.
export const SANDBOX_BANNER_HEIGHT_CSS_VAR = '--sandbox-banner-height'

export const SANDBOX_BANNER_HEIGHT = `var(${SANDBOX_BANNER_HEIGHT_CSS_VAR}, 0px)`

export const useSandboxBannerHeightCssVar = (banner: HTMLElement | null): void => {
  useEffect(() => {
    const root = document.documentElement

    if (!banner) return

    const update = (): void => {
      root.style.setProperty(
        SANDBOX_BANNER_HEIGHT_CSS_VAR,
        `${banner.getBoundingClientRect().height}px`,
      )
    }

    update()

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)

    observer?.observe(banner)

    return () => {
      observer?.disconnect()
      root.style.removeProperty(SANDBOX_BANNER_HEIGHT_CSS_VAR)
    }
  }, [banner])
}
