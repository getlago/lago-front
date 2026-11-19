import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { isSilencedGQLError } from '~/core/apolloClient/errorUtils'
import { LagoApiError } from '~/generated/graphql'

import {
  ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS,
  applyAgentStorefrontServerErrors,
} from '../serverErrors'

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
      it('THEN should set nothing on the form', () => {
        const { formApi, setFieldValue, setErrorMap } = buildFormApi()

        applyAgentStorefrontServerErrors(formApi, buildErrors(details))

        expect(setFieldValue).not.toHaveBeenCalled()
        expect(setErrorMap).not.toHaveBeenCalled()
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
