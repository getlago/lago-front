import { StatusType } from '~/components/designSystem/Status'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { ContractStatusEnum } from '~/generated/graphql'

describe('contractStatusMapping', () => {
  it('GIVEN each contract status THEN maps it to its own status type', () => {
    expect(contractStatusMapping(ContractStatusEnum.Active)).toEqual({
      type: StatusType.success,
      label: 'active',
    })
    expect(contractStatusMapping(ContractStatusEnum.Pending)).toEqual({
      type: StatusType.default,
      label: 'pending',
    })
    expect(contractStatusMapping(ContractStatusEnum.Canceled)).toEqual({
      type: StatusType.disabled,
      label: 'canceled',
    })
    expect(contractStatusMapping(ContractStatusEnum.Terminated)).toEqual({
      type: StatusType.danger,
      label: 'terminated',
    })
  })

  it('GIVEN no status THEN falls back to pending', () => {
    expect(contractStatusMapping(null)).toEqual({ type: StatusType.default, label: 'pending' })
    expect(contractStatusMapping(undefined)).toEqual({ type: StatusType.default, label: 'pending' })
  })
})
