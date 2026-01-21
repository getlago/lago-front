import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'

import { StatusTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '../TerminateCustomerSubscriptionDialog'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockUseGetInvoicesForTerminationQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateCustomerSubscriptionMutation: () => [jest.fn()],
  useGetInvoicesForTerminationQuery: () => mockUseGetInvoicesForTerminationQuery(),
}))

const TestWrapper = ({
  status = StatusTypeEnum.Active,
  payInAdvance = false,
}: {
  status?: StatusTypeEnum
  payInAdvance?: boolean
}) => {
  const dialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)

  return (
    <>
      <button
        data-test="open-dialog-btn"
        onClick={() =>
          dialogRef.current?.openDialog({
            id: 'sub-123',
            name: 'Test Subscription',
            status,
            payInAdvance,
          })
        }
      >
        Open Dialog
      </button>
      <TerminateCustomerSubscriptionDialog ref={dialogRef} />
    </>
  )
}

const createMockInvoiceQueryResult = ({
  offsettableAmountCents = '0',
  refundableAmountCents = '0',
}: {
  offsettableAmountCents?: string
  refundableAmountCents?: string
} = {}) => ({
  data: {
    invoices: {
      collection: [
        {
          id: 'invoice-123',
          number: 'INV-001',
          currency: 'USD',
          invoiceType: 'subscription',
          refundableAmountCents,
          offsettableAmountCents,
        },
      ],
    },
  },
})

describe('TerminateCustomerSubscriptionDialog', () => {
  beforeEach(() => {
    mockUseGetInvoicesForTerminationQuery.mockReturnValue(createMockInvoiceQueryResult())
  })

  describe('GIVEN a subscription to terminate', () => {
    describe('WHEN openDialog is called', () => {
      it('THEN renders the warning dialog with title', async () => {
        await act(() => render(<TestWrapper />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        expect(screen.getByTestId('warning-dialog')).toBeInTheDocument()
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    describe('WHEN subscription status is Active', () => {
      it('THEN renders dialog with title and description', async () => {
        await act(() => render(<TestWrapper status={StatusTypeEnum.Active} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
        expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
      })
    })

    describe('WHEN subscription status is Pending', () => {
      it('THEN renders dialog with title and description', async () => {
        await act(() => render(<TestWrapper status={StatusTypeEnum.Pending} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
        expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
      })
    })

    describe('WHEN invoice has offsettable amount', () => {
      it('THEN renders Offset radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '1000' }),
        )

        await act(() => render(<TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        const offsetRadio = document.querySelector('input[type="radio"][value="offset"]')

        expect(offsetRadio).toBeInTheDocument()
      })
    })

    describe('WHEN invoice has NO offsettable amount', () => {
      it('THEN does NOT render Offset radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '0' }),
        )

        await act(() => render(<TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        const offsetRadio = document.querySelector('input[type="radio"][value="offset"]')

        expect(offsetRadio).not.toBeInTheDocument()
      })
    })

    describe('WHEN invoice has refundable amount', () => {
      it('THEN renders Refund radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ refundableAmountCents: '1000' }),
        )

        await act(() => render(<TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        const refundRadio = document.querySelector('input[type="radio"][value="refund"]')

        expect(refundRadio).toBeInTheDocument()
      })
    })

    describe('WHEN invoice has NO refundable amount', () => {
      it('THEN does NOT render Refund radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ refundableAmountCents: '0' }),
        )

        await act(() => render(<TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />))

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        const refundRadio = document.querySelector('input[type="radio"][value="refund"]')

        expect(refundRadio).not.toBeInTheDocument()
      })
    })
  })
})
