import { ComponentType, lazy, LazyExoticComponent } from 'react'

const retry = (
  fn: () => Promise<{ default: ComponentType<Record<string, never>> }>,
  retriesLeft = 2,
  interval = 1000,
): Promise<{ default: ComponentType<Record<string, never>> }> => {
  return new Promise((resolve) => {
    fn()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          if (retriesLeft === 0) {
            return window.location.reload() // refresh the page as last resort
          }

          retry(fn, retriesLeft - 1, interval)
        }, interval)
      })
  })
}

export const lazyLoad = (
  fn: () => Promise<{ default: ComponentType<Record<string, never>> }>,
): LazyExoticComponent<ComponentType<Record<string, never>>> => lazy(() => retry(fn))
