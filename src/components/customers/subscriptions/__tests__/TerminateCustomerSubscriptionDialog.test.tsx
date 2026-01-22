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

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateCustomerSubscriptionMutation: () => [jest.fn()],
  useGetInvoicesForTerminationQuery: () => ({
    data: {
      invoices: {
        collection: [],
      },
    },
  }),
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

describe('TerminateCustomerSubscriptionDialog', () => {
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
  })
})
