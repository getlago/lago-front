import { ComponentType, lazy } from 'react'

const retry = (
  fn: Function,
  retriesLeft: number = 2,
  interval: number = 1000,
): Promise<{ default: ComponentType<unknown> }> => {
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

export const lazyLoad = (fn: Function) => lazy(() => retry(fn))
