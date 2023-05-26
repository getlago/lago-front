import { ComponentType, lazy } from 'react'

const retry = (
  fn: Function,
  retriesLeft: number = 2,
  interval: number = 1000
): Promise<{ default: ComponentType<unknown> }> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: Error) => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error)
            return window.location.reload() // refresh the page as last resort
          }

          retry(fn, retriesLeft - 1, interval)
        }, interval)
      })
  })
}

export const lazyLoad = (fn: Function) => lazy(() => retry(fn))
