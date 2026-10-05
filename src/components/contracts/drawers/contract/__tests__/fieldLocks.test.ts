import { ContractStatusEnum } from '~/generated/graphql'

import { getContractFieldLocks } from '../fieldLocks'

describe('getContractFieldLocks', () => {
  it.each([ContractStatusEnum.Pending, ContractStatusEnum.Terminated, ContractStatusEnum.Canceled])(
    'locks nothing on a %s contract',
    (status) => {
      expect(getContractFieldLocks(status)).toEqual({
        planCode: false,
        startedAt: false,
        billingAnchorDate: false,
      })
    },
  )

  it('locks the plan, start date and billing anchor on an active contract', () => {
    expect(getContractFieldLocks(ContractStatusEnum.Active)).toEqual({
      planCode: true,
      startedAt: true,
      billingAnchorDate: true,
    })
  })
})
