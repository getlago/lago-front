import { ComponentType, ReactElement, useEffect, useRef, useState } from 'react'

/**
 * It's a function that dynamically imports a module on demand without the need of React Suspense.
 * Supports both default exports and named exports.
 *
 * @param loader - Function that returns a Promise of the module to import
 * @param options - Optional configuration object with delay and/or exportName
 * @param options.delay - Delay in milliseconds before loading the component (default: 0)
 * @param options.exportName - Name of the named export to use (default: 'default')
 * @returns A React component that dynamically loads the target component
 *
 * @example
 * ```tsx
 * // Default export
 * const LazyComponent = dynamicImport(
 *   () => import('~/components/MyComponent'),
 *   { delay: 200 }
 * )
 *
 * // Named export
 * const LazyComponent = dynamicImport(
 *   () => import('~/components/MyComponent'),
 *   { exportName: 'MyComponent' }
 * )
 *
 * // Use as a normal component
 * <LazyComponent prop1="value" prop2={123} />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dynamicImport = <Props = any,>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: () => Promise<Record<string, any> & { default?: ComponentType<Props> }>,
  options?: { delay?: number; exportName?: string },
): ComponentType<Props> => {
  const DynamicComponent = (props: Props): ReactElement | null => {
    const [Component, setComponent] = useState<ComponentType<Props> | null>(null)
    const loaderRef = useRef(loader)
    const optionsRef = useRef(options)

    loaderRef.current = loader
    optionsRef.current = options

    useEffect(() => {
      let isMounted = true
      let timeoutId: ReturnType<typeof setTimeout> | null = null

      const loadComponent = () => {
        loaderRef
          .current()
          .then((module) => {
            if (isMounted) {
              const exportName = optionsRef.current?.exportName || 'default'
              const component = exportName === 'default' ? module.default : module[exportName]

              if (!component) {
                // eslint-disable-next-line no-console
                console.error(
                  `Failed to load component: export "${exportName}" not found in module`,
                  module,
                )
                return
              }

              setComponent(() => component as ComponentType<Props>)
            }
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error('Failed to load component:', error)
          })
      }

      const delayMs = optionsRef.current?.delay ?? 0

      if (delayMs > 0) {
        timeoutId = setTimeout(loadComponent, delayMs)
      } else {
        loadComponent()
      }

      return () => {
        isMounted = false
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [])

    if (!Component) {
      return null
    }

    return <Component {...(props as Props & Record<string, unknown>)} />
  }

  DynamicComponent.displayName = 'DynamicComponent'

  return DynamicComponent
}
