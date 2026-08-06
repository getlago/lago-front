import { configure, render, screen } from '@testing-library/react'
import { createElement, ReactNode } from 'react'

import { ErrorBoundary } from '~/components/ErrorBoundary'
import { ERROR_FALLBACK_TEST_ID } from '~/components/ErrorFallback'

configure({ testIdAttribute: 'data-test' })

const mockAddToast = jest.fn()
const mockCaptureException = jest.fn()
const mockErrorBoundaryProps: Array<Record<string, unknown>> = []

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('@sentry/react', () => {
  const actual = jest.requireActual('@sentry/react')
  const { createElement: create } = jest.requireActual('react')

  return {
    ...actual,
    captureException: (...args: unknown[]) => mockCaptureException(...args),
    withScope: (callback: (scope: unknown) => void) =>
      callback({
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setExtra: jest.fn(),
      }),
    // Keep the real boundary behaviour, but record the props we pass to it so
    // `handled` and `fallback` can be asserted without rendering internals.
    ErrorBoundary: (props: Record<string, unknown>) => {
      mockErrorBoundaryProps.push(props)

      return create(actual.ErrorBoundary, props)
    },
  }
})

const Boom = (): ReactNode => {
  throw new Error('render exploded')
}

const CustomFallback = () => <div data-test="custom-fallback">custom</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockErrorBoundaryProps.length = 0
  })

  describe('GIVEN a child that throws during render', () => {
    describe('WHEN the boundary catches it', () => {
      it('THEN should render the error fallback instead of an empty tree', () => {
        render(
          <ErrorBoundary>
            <Boom />
          </ErrorBoundary>,
        )

        expect(screen.getByTestId(ERROR_FALLBACK_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should report the error to Sentry and show a toast', () => {
        render(
          <ErrorBoundary>
            <Boom />
          </ErrorBoundary>,
        )

        expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error))
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN showToast is disabled', () => {
    describe('WHEN a child throws', () => {
      it('THEN should still capture to Sentry but not show a toast', () => {
        render(
          <ErrorBoundary showToast={false}>
            <Boom />
          </ErrorBoundary>,
        )

        expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error))
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a custom fallback', () => {
    describe('WHEN a child throws', () => {
      it('THEN should render that fallback', () => {
        render(
          <ErrorBoundary fallback={createElement(CustomFallback)}>
            <Boom />
          </ErrorBoundary>,
        )

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
        expect(screen.queryByTestId(ERROR_FALLBACK_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the Sentry boundary props', () => {
    describe('WHEN the boundary renders', () => {
      it('THEN should keep marking caught errors as unhandled', () => {
        render(
          <ErrorBoundary>
            <div>content</div>
          </ErrorBoundary>,
        )

        expect(mockErrorBoundaryProps[0]).toEqual(
          expect.objectContaining({ handled: false, showDialog: false }),
        )
      })
    })
  })
})
