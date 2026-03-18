import { act, screen } from '@testing-library/react'
import { createRef } from 'react'

import { render } from '~/test-utils'

import {
  TerminateCustomerWalletDialog,
  TerminateCustomerWalletDialogRef,
} from '../TerminateCustomerWalletDialog'

const mockTerminateWallet = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateCustomerWalletMutation: () => [mockTerminateWallet],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

describe('TerminateCustomerWalletDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ customerId: 'customer-1' })
  })

  describe('GIVEN the dialog ref', () => {
    describe('WHEN openDialog is called with undefined', () => {
      it('THEN should not open dialog', () => {
        const ref = createRef<TerminateCustomerWalletDialogRef>()

        render(<TerminateCustomerWalletDialog ref={ref} />)

        act(() => {
          ref.current?.openDialog(undefined)
        })

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    describe('WHEN openDialog is called with walletId', () => {
      it('THEN should show the dialog', () => {
        const ref = createRef<TerminateCustomerWalletDialogRef>()

        render(<TerminateCustomerWalletDialog ref={ref} />)

        act(() => {
          ref.current?.openDialog({ walletId: 'wallet-1' })
        })

        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })
})
