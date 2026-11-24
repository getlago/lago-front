import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

import {
  getQuickbooksSubmitErrorOutcome,
  QUICKBOOKS_COMPANY_TAKEN_KEY,
  QUICKBOOKS_GENERIC_ERROR_KEY,
} from '../quickbooksSubmitErrors'

const takenUnder = (field: string): GraphQLFormattedError[] => [
  {
    message: 'error',
    extensions: {
      code: LagoApiError.UnprocessableEntity,
      details: { [field]: [LagoApiError.ValueAlreadyExist] },
    },
  },
]

const withCode = (code: string): GraphQLFormattedError[] => [
  { message: 'error', extensions: { code } },
]

describe('getQuickbooksSubmitErrorOutcome', () => {
  it('THEN keeps the login and flags the code when the code is taken', () => {
    expect(getQuickbooksSubmitErrorOutcome(takenUnder('code'))).toEqual({
      isCodeTaken: true,
      keepConnection: true,
      toastKey: undefined,
    })
  })

  it('THEN drops the login and explains it when the company is already connected', () => {
    expect(getQuickbooksSubmitErrorOutcome(takenUnder('realmId'))).toEqual({
      isCodeTaken: false,
      keepConnection: false,
      toastKey: QUICKBOOKS_COMPANY_TAKEN_KEY,
    })
  })

  it.each([LagoApiError.UnprocessableEntity, LagoApiError.Forbidden])(
    'THEN drops the login and toasts a %s error, which the error link silences',
    (code) => {
      expect(getQuickbooksSubmitErrorOutcome(withCode(code))).toEqual({
        isCodeTaken: false,
        keepConnection: false,
        toastKey: QUICKBOOKS_GENERIC_ERROR_KEY,
      })
    },
  )

  it('THEN drops the login without a toast for an error the error link reports', () => {
    expect(getQuickbooksSubmitErrorOutcome(withCode('third_party_error'))).toEqual({
      isCodeTaken: false,
      keepConnection: false,
      toastKey: undefined,
    })
  })
})
