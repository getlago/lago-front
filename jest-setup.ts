// Console suppression is handled in jest-setup-early.ts (runs before imports)
import '@testing-library/jest-dom'
import type { ReactElement } from 'react'
import type { BrowserRouterProps, MemoryRouterProps } from 'react-router-dom'

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
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  const { createElement } = jest.requireActual<typeof import('react')>('react')
  const mockUseParams = jest.fn(actual.useParams)

  return {
    ...actual,
    BrowserRouter: (props: BrowserRouterProps): ReactElement =>
      createElement(actual.BrowserRouter, { useTransitions: false, ...props }),
    MemoryRouter: (props: MemoryRouterProps): ReactElement =>
      createElement(actual.MemoryRouter, { useTransitions: false, ...props }),
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  }
})

expect.addSnapshotSerializer(muiSnapshotSerializer)
