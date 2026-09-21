import { act, renderHook } from '@testing-library/react'

import { ContractStatusEnum } from '~/generated/graphql'

import { useContractTableActions } from '../useContractTableActions'

const mockCopyContractExternalId = jest.fn()
const mockOpenTerminateContractDialog = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('../useCopyContractExternalId', () => ({
  useCopyContractExternalId: () => ({
    copyContractExternalId: mockCopyContractExternalId,
    copyContractExternalIdLabel: 'Copy external ID',
  }),
}))

jest.mock('../useTerminateContractDialog', () => ({
  getContractTerminationCopy: jest.requireActual('../useTerminateContractDialog')
    .getContractTerminationCopy,
  useTerminateContractDialog: () => ({
    openTerminateContractDialog: mockOpenTerminateContractDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const contract = {
  externalId: 'external-contract-1',
  status: ContractStatusEnum.Active,
}

describe('useContractTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('keeps Copy external ID as the first action', () => {
    const { result } = renderHook(() => useContractTableActions())
    const actions = result.current.getContractTableActions(contract)

    expect(actions[0]).toEqual(expect.objectContaining({ dataTest: 'copy-contract-external-id' }))

    act(() => actions[0]?.onAction?.(contract))
    expect(mockCopyContractExternalId).toHaveBeenCalledWith('external-contract-1')
  })

  it.each([
    [ContractStatusEnum.Active, 'terminate-contract'],
    [ContractStatusEnum.Pending, 'cancel-contract'],
  ])('adds the matching lifecycle action for %s contracts', (status, dataTest) => {
    const { result } = renderHook(() => useContractTableActions())
    const target = { ...contract, status }
    const actions = result.current.getContractTableActions(target)

    expect(actions[1]).toEqual(expect.objectContaining({ dataTest }))

    act(() => actions[1]?.onAction?.(target))
    expect(mockOpenTerminateContractDialog).toHaveBeenCalledWith(target)
  })

  it.each([ContractStatusEnum.Canceled, ContractStatusEnum.Terminated])(
    'hides the lifecycle action for %s contracts',
    (status) => {
      const { result } = renderHook(() => useContractTableActions())

      expect(result.current.getContractTableActions({ ...contract, status })).toHaveLength(1)
    },
  )

  it('hides the lifecycle action without contractsUpdate', () => {
    mockHasPermissions.mockReturnValue(false)
    const { result } = renderHook(() => useContractTableActions())

    expect(result.current.getContractTableActions(contract)).toHaveLength(1)
    expect(mockHasPermissions).toHaveBeenCalledWith(['contractsUpdate'])
  })
})
