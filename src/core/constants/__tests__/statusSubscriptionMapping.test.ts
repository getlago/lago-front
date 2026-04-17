import { StatusType } from '~/components/designSystem/Status'
import { StatusTypeEnum } from '~/generated/graphql'

import { subscriptionStatusMapping } from '../statusSubscriptionMapping'

describe('subscriptionStatusMapping', () => {
  it.each([
    [StatusTypeEnum.Active, StatusType.success, 'active'],
    [StatusTypeEnum.Pending, StatusType.default, 'pending'],
    [StatusTypeEnum.Canceled, StatusType.disabled, 'canceled'],
    [StatusTypeEnum.Incomplete, StatusType.warning, 'incomplete'],
    [StatusTypeEnum.Terminated, StatusType.danger, 'terminated'],
  ])(
    'GIVEN status is %s THEN should return type %s and label %s',
    (status, expectedType, expectedLabel) => {
      const result = subscriptionStatusMapping(status)

      expect(result).toEqual({ type: expectedType, label: expectedLabel })
    },
  )

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('GIVEN status is %s THEN should return default (pending)', (_, status) => {
    const result = subscriptionStatusMapping(status as StatusTypeEnum | null | undefined)

    expect(result).toEqual({ type: StatusType.default, label: 'pending' })
  })
})
