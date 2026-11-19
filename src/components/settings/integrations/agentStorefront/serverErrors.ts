import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { hasDefinedGQLError } from '~/core/apolloClient'
import { LagoApiError } from '~/generated/graphql'

const CODE_ALREADY_USED_ERROR = 'text_17950838252057vnoo7fnaty'
const URL_INVALID_ERROR = 'text_1795083825205yq6aurg1d7a'

const URL_FIELDS = ['resourceEndpoint', 'resourceInstructions'] as const

type FieldError = { message: string; path: string[] }

export const ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS = [
  LagoApiError.ValueAlreadyExist,
  LagoApiError.UrlIsInvalid,
  LagoApiError.EventsTargetingWalletsDisabled,
]

export const applyAgentStorefrontServerErrors = (
  formApi: AnyFormApi,
  errors: readonly GraphQLFormattedError[],
): void => {
  if (hasDefinedGQLError('EventsTargetingWalletsDisabled', errors, 'base')) {
    formApi.setFieldValue('isRefused', true)

    return
  }

  const fields: Record<string, FieldError> = {}

  if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
    fields.code = { message: CODE_ALREADY_USED_ERROR, path: ['code'] }
  }

  URL_FIELDS.forEach((field) => {
    if (hasDefinedGQLError('UrlIsInvalid', errors, field)) {
      fields[field] = { message: URL_INVALID_ERROR, path: [field] }
    }
  })

  if (!Object.keys(fields).length) return

  formApi.setErrorMap({ onDynamic: { fields } })
}
