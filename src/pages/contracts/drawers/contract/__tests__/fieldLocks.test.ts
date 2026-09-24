import { ContractStatusEnum } from '~/generated/graphql'

import { CREATE_CONTRACT_FIELD_LOCKS, getContractFieldLocks } from '../fieldLocks'

describe('getContractFieldLocks', () => {
  it('locks nothing in create mode', () => {
    expect(getContractFieldLocks(undefined)).toEqual({
      planCode: false,
      externalId: false,
      startedAt: false,
      billingAnchorDate: false,
    })
    expect(getContractFieldLocks(null)).toEqual(CREATE_CONTRACT_FIELD_LOCKS)
  })

  it('locks only the external id on a pending contract', () => {
    expect(getContractFieldLocks(ContractStatusEnum.Pending)).toEqual({
      planCode: false,
      externalId: true,
      startedAt: false,
      billingAnchorDate: false,
    })
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Terminated, ContractStatusEnum.Canceled])(
    'locks the plan, external id, start date and billing anchor on a %s contract',
    (status) => {
      expect(getContractFieldLocks(status)).toEqual({
        planCode: true,
        externalId: true,
        startedAt: true,
        billingAnchorDate: true,
      })
    },
  )
})
