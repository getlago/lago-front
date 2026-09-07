// Console suppression is handled in jest-setup-early.ts (runs before imports)
import '@testing-library/jest-dom'
import type { ComponentType } from 'react'

// Registers the default Zod error message for every suite — pure schema tests never go
// through `test-utils`, so they would otherwise see a different default than the app.
import './src/formValidation/initializeZod'
import muiSnapshotSerializer from './src/test-utils/snapshotSerializer'

// jsdom has no ResizeObserver; components that observe layout (virtualized lists, the
// plan-details sidebar) reference it on mount. Provide a global no-op so any test that
// renders them does not crash. Individual suites can still override it to assert calls.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const mockNavigate = jest.fn()

;(globalThis as unknown as { __testRouterMocks: unknown }).__testRouterMocks = {
  mockNavigate,
}

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  const React = jest.requireActual('react')
  const mockUseParams = jest.fn(actual.useParams)
  const FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }
  const withFuture =
    (Router: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) =>
      React.createElement(Router, { future: FUTURE, ...props })

  return {
    ...actual,
    BrowserRouter: withFuture(actual.BrowserRouter),
    MemoryRouter: withFuture(actual.MemoryRouter),
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  }
})

expect.addSnapshotSerializer(muiSnapshotSerializer)
