import { act, renderHook } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { ContractStatusEnum } from '~/generated/graphql'

import { getContractTerminationCopy, useTerminateContractDialog } from '../TerminateContractDialog'

const mockOpen = jest.fn()
const mockTerminateContract = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen, close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateContractMutation: () => [mockTerminateContract],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const openDialog = (contract?: { externalId: string; status: ContractStatusEnum }): void => {
  const { result } = renderHook(() => useTerminateContractDialog())

  act(() => {
    result.current.openTerminateContractDialog(contract)
  })
}

const getDialogProps = () => mockOpen.mock.calls[0][0]

describe('useTerminateContractDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTerminateContract.mockResolvedValue({ data: { terminateContract: { id: 'contract-1' } } })
  })

  describe('GIVEN no contract', () => {
    describe('WHEN the dialog is opened', () => {
      it('THEN should not open the dialog', () => {
        openDialog(undefined)

        expect(mockOpen).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a contract that can no longer be terminated', () => {
    describe('WHEN the dialog is opened', () => {
      it.each([ContractStatusEnum.Terminated, ContractStatusEnum.Canceled])(
        'THEN should not open the dialog for a %s contract',
        (status) => {
          openDialog({ externalId: 'premium-contract', status })

          expect(mockOpen).not.toHaveBeenCalled()
        },
      )
    })
  })

  describe('GIVEN an active contract', () => {
    describe('WHEN the dialog is opened', () => {
      it('THEN should open a danger confirmation dialog', () => {
        openDialog({ externalId: 'premium-contract', status: ContractStatusEnum.Active })

        expect(mockOpen).toHaveBeenCalledTimes(1)
        expect(mockOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            colorVariant: 'danger',
            title: expect.any(String),
            description: expect.any(String),
            actionText: expect.any(String),
          }),
        )
      })
    })

    describe('WHEN the confirmation is accepted', () => {
      it('THEN should terminate the contract by its external id', async () => {
        openDialog({ externalId: 'premium-contract', status: ContractStatusEnum.Active })

        await act(async () => {
          await getDialogProps().onAction()
        })

        expect(mockTerminateContract).toHaveBeenCalledWith({
          variables: { input: { externalId: 'premium-contract' } },
        })
      })

      it('THEN should confirm with a success toast', async () => {
        openDialog({ externalId: 'premium-contract', status: ContractStatusEnum.Active })

        await act(async () => {
          await getDialogProps().onAction()
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN the mutation returns no contract', () => {
      it('THEN should not confirm with a success toast', async () => {
        mockTerminateContract.mockResolvedValue({ data: { terminateContract: null } })

        openDialog({ externalId: 'premium-contract', status: ContractStatusEnum.Active })

        await act(async () => {
          await getDialogProps().onAction()
        })

        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a pending contract', () => {
    describe('WHEN the dialog is opened', () => {
      it('THEN should open the cancellation copy rather than the termination one', () => {
        openDialog({ externalId: 'premium-contract', status: ContractStatusEnum.Pending })

        expect(mockOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            colorVariant: 'danger',
            title: getContractTerminationCopy(ContractStatusEnum.Pending)?.title,
          }),
        )
      })
    })
  })
})

describe('getContractTerminationCopy', () => {
  describe('GIVEN a contract that can still be stopped', () => {
    describe('WHEN the copy is read', () => {
      it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
        'THEN should return a full set of copy for a %s contract',
        (status) => {
          expect(getContractTerminationCopy(status)).toEqual({
            actionText: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            successToastKey: expect.any(String),
          })
        },
      )

      it('THEN should distinguish cancelling a pending contract from terminating an active one', () => {
        expect(getContractTerminationCopy(ContractStatusEnum.Pending)).not.toEqual(
          getContractTerminationCopy(ContractStatusEnum.Active),
        )
      })
    })
  })

  describe('GIVEN a contract already stopped', () => {
    describe('WHEN the copy is read', () => {
      it.each([ContractStatusEnum.Terminated, ContractStatusEnum.Canceled])(
        'THEN should return no copy for a %s contract',
        (status) => {
          expect(getContractTerminationCopy(status)).toBeNull()
        },
      )
    })
  })
})
