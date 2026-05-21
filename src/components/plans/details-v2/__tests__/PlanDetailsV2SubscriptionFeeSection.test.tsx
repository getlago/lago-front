import { MockedProvider } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'

import { PlanDetailsV2SubscriptionFeeSection } from '../PlanDetailsV2SubscriptionFeeSection'

import { planDetailsV2Fixture } from './fixtures'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const SubscriptionFeeDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openDrawer: mockOpenDrawer, closeDrawer: mockCloseDrawer }))
    return null
  })

  return { __esModule: true, SubscriptionFeeDrawer }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    <NiceModal.Provider>{children}</NiceModal.Provider>
  </MockedProvider>
)

describe('PlanDetailsV2SubscriptionFeeSection', () => {
  beforeEach(() => {
    mockOpenDrawer.mockClear()
    mockCloseDrawer.mockClear()
  })

  it('renders the section header and accordion summary', () => {
    render(<PlanDetailsV2SubscriptionFeeSection plan={planDetailsV2Fixture} />, {
      wrapper: Wrapper,
    })

    expect(screen.getAllByText('text_642d5eb2783a2ad10d670336').length).toBeGreaterThan(0)
  })

  it('opens the drawer with current values when Edit is clicked', async () => {
    render(<PlanDetailsV2SubscriptionFeeSection plan={planDetailsV2Fixture} />, {
      wrapper: Wrapper,
    })

    await userEvent.click(await screen.findByRole('button', { name: /actions/i }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'text_63e51ef4985f0ebd75c212fc' }),
    )

    await waitFor(() => expect(mockOpenDrawer).toHaveBeenCalledTimes(1))
    expect(mockOpenDrawer).toHaveBeenCalledWith({
      amountCents: '1000',
      payInAdvance: false,
      trialPeriod: 0,
      invoiceDisplayName: undefined,
    })
  })

  // Drift test (memory/feedback_drift_test_pattern.md): lock in the Edit
  // action present in plan mode so a future refactor can't silently drop it.
  it('should keep the Edit action wired when isInSubscriptionForm is undefined or false', async () => {
    render(<PlanDetailsV2SubscriptionFeeSection plan={planDetailsV2Fixture} />, {
      wrapper: Wrapper,
    })

    await userEvent.click(await screen.findByRole('button', { name: /actions/i }))

    expect(
      await screen.findByRole('button', { name: 'text_63e51ef4985f0ebd75c212fc' }),
    ).toBeInTheDocument()
  })

  it('hides the Edit action when isInSubscriptionForm is true', () => {
    render(
      <PlanDetailsV2SubscriptionFeeSection plan={planDetailsV2Fixture} isInSubscriptionForm />,
      { wrapper: Wrapper },
    )

    expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument()
  })
})
