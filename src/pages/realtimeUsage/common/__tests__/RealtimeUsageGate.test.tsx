import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { RealtimeUsageGate } from '../RealtimeUsageGate'

const CHILD_TEST_ID = 'realtime-usage-gate-child'
const NOT_FOUND_TEST_ID = 'realtime-usage-gate-not-found'

const mockUseOrganizationInfos = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('~/pages/Error404InApp', () => ({
  __esModule: true,
  default: () => <div data-test={NOT_FOUND_TEST_ID} />,
}))

const renderGate = (): void => {
  render(
    <RealtimeUsageGate>
      <div data-test={CHILD_TEST_ID} />
    </RealtimeUsageGate>,
  )
}

describe('RealtimeUsageGate', () => {
  it('renders the page when real-time usage is enabled for the organization', () => {
    mockUseOrganizationInfos.mockReturnValue({
      loading: false,
      organization: { realtimeUsageEnabled: true },
    })

    renderGate()

    expect(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument()
  })

  it('renders a not found page otherwise', () => {
    mockUseOrganizationInfos.mockReturnValue({
      loading: false,
      organization: { realtimeUsageEnabled: false },
    })

    renderGate()

    expect(screen.queryByTestId(CHILD_TEST_ID)).not.toBeInTheDocument()
    expect(screen.getByTestId(NOT_FOUND_TEST_ID)).toBeInTheDocument()
  })
})
