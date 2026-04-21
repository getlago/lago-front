// Console suppression is handled in jest-setup-early.ts (runs before imports)
import '@testing-library/jest-dom'

import muiSnapshotSerializer from './src/test-utils/snapshotSerializer'

const mockNavigate = jest.fn()

;(globalThis as unknown as { __testRouterMocks: unknown }).__testRouterMocks = {
  mockNavigate,
}

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  const mockUseParams = jest.fn(actual.useParams)

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  }
})

expect.addSnapshotSerializer(muiSnapshotSerializer)
