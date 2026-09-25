import { act, renderHook } from '@testing-library/react'

import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'
import { ContractStatusEnum } from '~/generated/graphql'

import {
  CONTRACT_TABLE_CANCEL_TEST_ID,
  CONTRACT_TABLE_COPY_EXTERNAL_ID_TEST_ID,
  CONTRACT_TABLE_EDIT_TEST_ID,
  CONTRACT_TABLE_TERMINATE_TEST_ID,
  useContractTableActions,
} from '../useContractTableActions'

const mockCopyContractExternalId = jest.fn()
const mockOpenTerminateContractDialog = jest.fn()
const mockCanTerminateContract = jest.fn()
const mockCanEditContract = jest.fn()
const mockOpenContractDrawer = jest.fn()

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

jest.mock('~/hooks/useContractPermissionsActions', () => ({
  useContractPermissionsActions: () => ({
    canTerminateContract: mockCanTerminateContract,
    canEditContract: mockCanEditContract,
  }),
}))

jest.mock('~/components/contracts/drawers/contract/useContractDrawer', () => ({
  useContractDrawer: () => ({ openDrawer: mockOpenContractDrawer }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const contract = { ...contractForDrawerFixture, externalId: 'external-contract-1' }

describe('useContractTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanTerminateContract.mockReturnValue(true)
    mockCanEditContract.mockReturnValue(false)
  })

  it('keeps Copy external ID as the first action', () => {
    const { result } = renderHook(() => useContractTableActions())
    const actions = result.current.getContractTableActions(contract)

    expect(actions[0]).toEqual(
      expect.objectContaining({ dataTest: CONTRACT_TABLE_COPY_EXTERNAL_ID_TEST_ID }),
    )

    act(() => actions[0]?.onAction?.(contract))
    expect(mockCopyContractExternalId).toHaveBeenCalledWith('external-contract-1')
  })

  it.each([
    [ContractStatusEnum.Active, CONTRACT_TABLE_TERMINATE_TEST_ID],
    [ContractStatusEnum.Pending, CONTRACT_TABLE_CANCEL_TEST_ID],
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
    mockCanTerminateContract.mockReturnValue(false)
    const { result } = renderHook(() => useContractTableActions())

    expect(result.current.getContractTableActions(contract)).toHaveLength(1)
    expect(mockCanTerminateContract).toHaveBeenCalledWith(ContractStatusEnum.Active)
  })

  it('adds Edit between the copy and lifecycle actions when the contract is editable', () => {
    mockCanEditContract.mockReturnValue(true)
    const { result } = renderHook(() => useContractTableActions())
    const actions = result.current.getContractTableActions(contract)

    expect(actions.map((action) => action.dataTest)).toEqual([
      CONTRACT_TABLE_COPY_EXTERNAL_ID_TEST_ID,
      CONTRACT_TABLE_EDIT_TEST_ID,
      CONTRACT_TABLE_TERMINATE_TEST_ID,
    ])

    act(() => actions[1]?.onAction?.(contract))
    expect(mockOpenContractDrawer).toHaveBeenCalledWith({ contract })
  })

  it('omits Edit when the contract is not editable', () => {
    const { result } = renderHook(() => useContractTableActions())

    expect(
      result.current
        .getContractTableActions(contract)
        .some((action) => action.dataTest === CONTRACT_TABLE_EDIT_TEST_ID),
    ).toBe(false)
    expect(mockCanEditContract).toHaveBeenCalledWith(ContractStatusEnum.Active)
  })
})
