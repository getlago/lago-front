import { act, renderHook } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { ContractForContractDrawerFragment, ContractStatusEnum } from '~/generated/graphql'

import {
  getContractTerminationCopy,
  useTerminateContractDialog,
} from '../useTerminateContractDialog'

const mockOpen = jest.fn()
const mockTerminateContract = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen, close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateContractMutation: () => [mockTerminateContract],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const openDialog = (contract?: Pick<ContractForContractDrawerFragment, 'id' | 'status'>) => {
  const hook = renderHook(() => useTerminateContractDialog())

  act(() => hook.result.current.openTerminateContractDialog(contract))

  return hook
}

const getDialogProps = () => mockOpen.mock.calls[0][0]

describe('useTerminateContractDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTerminateContract.mockResolvedValue({
      data: { terminateContract: { id: 'contract-1', status: ContractStatusEnum.Terminated } },
    })
  })

  it.each([undefined, ContractStatusEnum.Canceled, ContractStatusEnum.Terminated])(
    'does not open for an absent or terminal contract (%s)',
    (status) => {
      openDialog(
        status
          ? {
              id: 'contract-1',
              status,
            }
          : undefined,
      )

      expect(mockOpen).not.toHaveBeenCalled()
    },
  )

  it('opens a persistent danger confirmation for an active contract', () => {
    openDialog({ id: 'contract-1', status: ContractStatusEnum.Active })

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'text_1789971751136dxn6qmh7ef9',
        actionText: 'text_1789971751136nrprlsnx192',
        colorVariant: 'danger',
        closeOnError: false,
      }),
    )
  })

  it('uses cancellation copy for a pending contract', () => {
    openDialog({ id: 'contract-1', status: ContractStatusEnum.Pending })

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'text_1789971751136xsgqxsasdpd',
        actionText: 'text_1789971751136h7hm7pbipln',
      }),
    )
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
    'calls terminateContract by ID for a %s contract and shows the matching toast',
    async (status) => {
      openDialog({ id: 'contract-1', status })

      await act(async () => getDialogProps().onAction())

      expect(mockTerminateContract).toHaveBeenCalledWith({
        variables: { input: { id: 'contract-1' } },
      })
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        translateKey:
          status === ContractStatusEnum.Active
            ? 'text_1789971751137egm0tdl3q96'
            : 'text_1789971751137982utge606b',
      })
    },
  )

  it('keeps the action unsuccessful when the API returns no contract', async () => {
    mockTerminateContract.mockResolvedValue({ data: { terminateContract: null } })
    openDialog({ id: 'contract-1', status: ContractStatusEnum.Active })

    await expect(getDialogProps().onAction()).rejects.toThrow(
      'Contract lifecycle mutation returned no contract',
    )
    expect(addToast).not.toHaveBeenCalled()
  })
})

describe('getContractTerminationCopy', () => {
  it('maps only active and pending statuses to lifecycle copy', () => {
    expect(getContractTerminationCopy(ContractStatusEnum.Active)).toEqual(
      expect.objectContaining({ actionText: 'text_1789971751136nrprlsnx192' }),
    )
    expect(getContractTerminationCopy(ContractStatusEnum.Pending)).toEqual(
      expect.objectContaining({ actionText: 'text_1789971751136h7hm7pbipln' }),
    )
    expect(getContractTerminationCopy(ContractStatusEnum.Canceled)).toBeNull()
    expect(getContractTerminationCopy(ContractStatusEnum.Terminated)).toBeNull()
  })
})
