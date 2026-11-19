import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { addToast } from '~/core/apolloClient'
import { isSilencedGQLError } from '~/core/apolloClient/errorUtils'
import { LagoApiError } from '~/generated/graphql'

import {
  ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS,
  applyAgentStorefrontServerErrors,
} from '../serverErrors'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const buildErrors = (details: Record<string, string[]>): GraphQLFormattedError[] => [
  {
    message: 'Unprocessable Entity',
    extensions: { code: LagoApiError.UnprocessableEntity, details },
  },
]

const buildFormApi = (): {
  formApi: AnyFormApi
  setFieldValue: jest.Mock
  setErrorMap: jest.Mock
} => {
  const setFieldValue = jest.fn()
  const setErrorMap = jest.fn()

  return {
    formApi: { setFieldValue, setErrorMap } as unknown as AnyFormApi,
    setFieldValue,
    setErrorMap,
  }
}

describe('applyAgentStorefrontServerErrors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the API refuses because wallet-targeted events are disabled', () => {
    describe('WHEN the errors are applied', () => {
      it('THEN should flag the form as refused without field errors', () => {
        const { formApi, setFieldValue, setErrorMap } = buildFormApi()

        applyAgentStorefrontServerErrors(
          formApi,
          buildErrors({ base: [LagoApiError.EventsTargetingWalletsDisabled] }),
        )

        expect(setFieldValue).toHaveBeenCalledWith('isRefused', true)
        expect(setErrorMap).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a duplicate code and an invalid endpoint in the same response', () => {
    describe('WHEN the errors are applied', () => {
      it('THEN should set both field errors in a single error map', () => {
        const { formApi, setFieldValue, setErrorMap } = buildFormApi()

        applyAgentStorefrontServerErrors(
          formApi,
          buildErrors({
            code: [LagoApiError.ValueAlreadyExist],
            resourceEndpoint: [LagoApiError.UrlIsInvalid],
          }),
        )

        expect(setErrorMap).toHaveBeenCalledTimes(1)
        expect(setErrorMap).toHaveBeenCalledWith({
          onDynamic: {
            fields: {
              code: { message: expect.any(String), path: ['code'] },
              resourceEndpoint: { message: expect.any(String), path: ['resourceEndpoint'] },
            },
          },
        })
        expect(setFieldValue).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a duplicate code and a missing payment provider in the same response', () => {
    describe('WHEN the errors are applied', () => {
      it('THEN should set the code error and still toast the silenced provider failure', () => {
        const { formApi, setErrorMap } = buildFormApi()

        applyAgentStorefrontServerErrors(
          formApi,
          buildErrors({
            code: [LagoApiError.ValueAlreadyExist],
            paymentProviderCode: [LagoApiError.PaymentProviderNotFound],
          }),
        )

        expect(setErrorMap).toHaveBeenCalledWith({
          onDynamic: { fields: { code: { message: expect.any(String), path: ['code'] } } },
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe.each([['resourceEndpoint'], ['resourceInstructions']])(
    'GIVEN an invalid url on %s',
    (field) => {
      describe('WHEN the errors are applied', () => {
        it('THEN should set the error on that field only', () => {
          const { formApi, setErrorMap } = buildFormApi()

          applyAgentStorefrontServerErrors(
            formApi,
            buildErrors({ [field]: [LagoApiError.UrlIsInvalid] }),
          )

          expect(setErrorMap).toHaveBeenCalledWith({
            onDynamic: {
              fields: { [field]: { message: expect.any(String), path: [field] } },
            },
          })
        })
      })
    },
  )

  describe.each([
    ['wallet_refresh_unavailable', { base: ['wallet_refresh_unavailable'] }],
    ['payment_provider_not_found', { paymentProviderCode: [LagoApiError.PaymentProviderNotFound] }],
  ])('GIVEN an unmapped %s error', (_, details) => {
    describe('WHEN the errors are applied', () => {
      it('THEN should set nothing on the form and leave the toast to the error link', () => {
        const { formApi, setFieldValue, setErrorMap } = buildFormApi()

        applyAgentStorefrontServerErrors(formApi, buildErrors(details))

        expect(setFieldValue).not.toHaveBeenCalled()
        expect(setErrorMap).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })

      it('THEN should not be silenced, so the default toast shows', () => {
        expect(
          isSilencedGQLError({
            extensions: { code: LagoApiError.UnprocessableEntity, details },
            silentErrorCodes: [],
            silentErrorDetails: ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS,
          }),
        ).toBe(false)
      })
    })
  })
})
