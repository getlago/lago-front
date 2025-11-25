import { Spinner } from 'lago-design-system'
import { ComponentType, LazyExoticComponent, Suspense } from 'react'

export const withLazySuspense = <T = Record<string, unknown>,>(
  LazyComponent:
    | ComponentType<T>
    | LazyExoticComponent<ComponentType<T>>
    | LazyExoticComponent<ComponentType<unknown>>,
): ComponentType<T> => {
  const WrappedComponent = (props: T) => {
    const Component = LazyComponent as ComponentType<T>

    return (
      <Suspense fallback={<Spinner />}>
        {/* @ts-expect-error - LazyExoticComponent types are complex, but runtime behavior is correct */}
        <Component {...props} />
      </Suspense>
    )
  }

  return WrappedComponent
}
