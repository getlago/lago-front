import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
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

const SILENT_ERROR_DETAILS = new Set<string>(ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS)

const getDetailCodes = (errors: readonly GraphQLFormattedError[]): string[] => {
  const details = errors[0]?.extensions?.details

  if (!details || typeof details !== 'object') return []

  return Object.values(details)
    .flat()
    .filter((code): code is string => typeof code === 'string')
}

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

  const hasMappedFields = Object.keys(fields).length > 0

  if (hasMappedFields) {
    formApi.setErrorMap({ onDynamic: { fields } })
  }

  const detailCodes = getDetailCodes(errors)
  const isSilenced = detailCodes.some((code) => SILENT_ERROR_DETAILS.has(code))
  const hasUnmappedCode = detailCodes.some((code) => !SILENT_ERROR_DETAILS.has(code))

  if (isSilenced && (hasUnmappedCode || !hasMappedFields)) {
    addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
  }
}
