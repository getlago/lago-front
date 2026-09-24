import { renderHook } from '@testing-library/react'

import { ContractStatusEnum } from '~/generated/graphql'
import { useContractPermissionsActions } from '~/hooks/useContractPermissionsActions'

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

describe('useContractPermissionsActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
    'allows terminating a %s contract',
    (status) => {
      const { result } = renderHook(() => useContractPermissionsActions())

      expect(result.current.isStatusTerminable(status)).toBe(true)
      expect(result.current.canTerminateContract(status)).toBe(true)
      expect(mockHasPermissions).toHaveBeenCalledWith(['contractsTerminate'])
    },
  )

  it.each([ContractStatusEnum.Canceled, ContractStatusEnum.Terminated, null, undefined])(
    'does not allow terminating a terminal or absent status (%s)',
    (status) => {
      const { result } = renderHook(() => useContractPermissionsActions())

      expect(result.current.isStatusTerminable(status)).toBe(false)
      expect(result.current.canTerminateContract(status)).toBe(false)
    },
  )

  it('requires contractsTerminate permission', () => {
    mockHasPermissions.mockReturnValue(false)
    const { result } = renderHook(() => useContractPermissionsActions())

    expect(result.current.canTerminateContract(ContractStatusEnum.Active)).toBe(false)
    expect(mockHasPermissions).toHaveBeenCalledWith(['contractsTerminate'])
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
    'allows editing a %s contract with contractsUpdate',
    (status) => {
      const { result } = renderHook(() => useContractPermissionsActions())

      expect(result.current.canEditContract(status)).toBe(true)
      expect(mockHasPermissions).toHaveBeenCalledWith(['contractsUpdate'])
    },
  )

  it.each([ContractStatusEnum.Canceled, ContractStatusEnum.Terminated, null, undefined])(
    'does not allow editing a terminal or absent status (%s)',
    (status) => {
      const { result } = renderHook(() => useContractPermissionsActions())

      expect(result.current.canEditContract(status)).toBe(false)
    },
  )

  it('requires contractsUpdate permission to edit', () => {
    mockHasPermissions.mockReturnValue(false)
    const { result } = renderHook(() => useContractPermissionsActions())

    expect(result.current.canEditContract(ContractStatusEnum.Pending)).toBe(false)
  })
})
