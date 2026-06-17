import { OrderExecutionModeEnum } from '~/generated/graphql'

import { buildSignOrderFormInput, signOrderFormValidationSchema } from '../validationSchema'

describe('signOrderFormValidationSchema', () => {
  it('fails when execution mode and date are missing', () => {
    expect(signOrderFormValidationSchema.safeParse({}).success).toBe(false)
  })

  it('passes when execution mode and date are present', () => {
    expect(
      signOrderFormValidationSchema.safeParse({
        executionMode: OrderExecutionModeEnum.ExecuteInLago,
        executeAt: '2026-07-01',
      }).success,
    ).toBe(true)
  })
})

describe('buildSignOrderFormInput', () => {
  it('maps form values to the mutation input', () => {
    expect(
      buildSignOrderFormInput('of-1', {
        executionMode: OrderExecutionModeEnum.OrderOnly,
        executeAt: '2026-07-01',
        signedDocument: 'data:application/pdf;base64,AAAA',
      }),
    ).toEqual({
      id: 'of-1',
      executionMode: OrderExecutionModeEnum.OrderOnly,
      executeAt: '2026-07-01',
      signedDocument: 'data:application/pdf;base64,AAAA',
    })
  })

  it('omits signedDocument when empty', () => {
    expect(
      buildSignOrderFormInput('of-1', {
        executionMode: OrderExecutionModeEnum.ExecuteInLago,
        executeAt: '2026-07-01',
        signedDocument: undefined,
      }),
    ).toEqual({
      id: 'of-1',
      executionMode: OrderExecutionModeEnum.ExecuteInLago,
      executeAt: '2026-07-01',
      signedDocument: undefined,
    })
  })
})
