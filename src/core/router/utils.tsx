import { ComponentType, lazy } from 'react'

const retry = (
  fn: Function,
  retriesLeft: number = 3,
  interval: number = 1000
): Promise<{ default: ComponentType<unknown> }> => {
  return new Promise((resolve) => {
    fn()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            return window.location.reload() // refresh the page as last resort
          }

          retry(fn, retriesLeft - 1, interval)
        }, interval)
      })
  })
}

export const lazyLoad = (fn: Function) => lazy(() => retry(fn))
