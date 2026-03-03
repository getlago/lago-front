import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { StatusTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useTerminateCustomerSubscriptionDialog } from '../TerminateCustomerSubscriptionDialog'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)
NiceModal.register(FORM_DIALOG_NAME, FormDialog)

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

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const TestWrapper = ({
  status = StatusTypeEnum.Active,
  payInAdvance = false,
}: {
  status?: StatusTypeEnum
  payInAdvance?: boolean
}) => {
  const { openTerminateCustomerSubscriptionDialog } = useTerminateCustomerSubscriptionDialog()

  return (
    <button
      data-test="open-dialog-btn"
      onClick={() =>
        openTerminateCustomerSubscriptionDialog({
          id: 'sub-123',
          name: 'Test Subscription',
          status,
          payInAdvance,
        })
      }
    >
      Open Dialog
    </button>
  )
}

const createMockInvoiceQueryResult = ({
  offsettableAmountCents = '0',
  refundableAmountCents = '0',
}: {
  offsettableAmountCents?: string
  refundableAmountCents?: string
} = {}) => ({
  loading: false,
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

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN a subscription to terminate', () => {
    describe('WHEN openDialog is called for Active status', () => {
      it('THEN renders the form dialog with title', async () => {
        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
          expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN subscription status is Pending', () => {
      it('THEN renders centralized dialog with title', async () => {
        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Pending} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
          expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN invoice has offsettable amount', () => {
      it('THEN renders Offset radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '1000' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          const offsetRadio = document.querySelector('input[type="radio"][value="offset"]')

          expect(offsetRadio).toBeInTheDocument()
        })
      })

      it('THEN selects Offset as default (first option)', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '1000' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await userEvent.click(screen.getByTestId('open-dialog-btn'))

        await waitFor(() => {
          const offsetRadioLabel = document
            .querySelector('input[type="radio"][value="offset"]')
            ?.closest('label')
          const checkedIndicator = offsetRadioLabel?.querySelector('circle[r="4"]')

          expect(checkedIndicator).toBeInTheDocument()
        })
      })
    })

    describe('WHEN invoice has NO offsettable amount', () => {
      it('THEN does NOT render Offset radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '0' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          const offsetRadio = document.querySelector('input[type="radio"][value="offset"]')

          expect(offsetRadio).not.toBeInTheDocument()
        })
      })

      it('THEN selects Credit as default (first option)', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ offsettableAmountCents: '0' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await userEvent.click(screen.getByTestId('open-dialog-btn'))

        await waitFor(() => {
          const creditRadioLabel = document
            .querySelector('input[type="radio"][value="credit"]')
            ?.closest('label')
          const checkedIndicator = creditRadioLabel?.querySelector('circle[r="4"]')

          expect(checkedIndicator).toBeInTheDocument()
        })
      })
    })

    describe('WHEN invoice has refundable amount', () => {
      it('THEN renders Refund radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ refundableAmountCents: '1000' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          const refundRadio = document.querySelector('input[type="radio"][value="refund"]')

          expect(refundRadio).toBeInTheDocument()
        })
      })
    })

    describe('WHEN invoice has NO refundable amount', () => {
      it('THEN does NOT render Refund radio option', async () => {
        mockUseGetInvoicesForTerminationQuery.mockReturnValue(
          createMockInvoiceQueryResult({ refundableAmountCents: '0' }),
        )

        await act(() =>
          render(
            <NiceModalWrapper>
              <TestWrapper status={StatusTypeEnum.Active} payInAdvance={true} />
            </NiceModalWrapper>,
          ),
        )

        await act(async () => {
          await userEvent.click(screen.getByTestId('open-dialog-btn'))
        })

        await waitFor(() => {
          const refundRadio = document.querySelector('input[type="radio"][value="refund"]')

          expect(refundRadio).not.toBeInTheDocument()
        })
      })
    })
  })
})
