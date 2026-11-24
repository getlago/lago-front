import { GraphQLFormattedError } from 'graphql'

import { hasDefinedGQLError } from '~/core/apolloClient'
import { LagoApiError } from '~/generated/graphql'

export const QUICKBOOKS_GENERIC_ERROR_KEY = 'text_62b31e1f6a5b8b1b745ece48'
export const QUICKBOOKS_COMPANY_TAKEN_KEY = 'text_1795442089878h1a9gppfypr'

// The codes the error link leaves without a toast: the one the dialog passes, plus forbidden.
const SILENCED_ERROR_CODES = [LagoApiError.UnprocessableEntity, LagoApiError.Forbidden]

// Only a refusal about the form keeps the QuickBooks login for the next submit.
export type QuickbooksSubmitErrorOutcome = {
  isCodeTaken: boolean
  keepConnection: boolean
  toastKey: string | undefined
}

export const getQuickbooksSubmitErrorOutcome = (
  errors: readonly GraphQLFormattedError[],
): QuickbooksSubmitErrorOutcome => {
  if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
    return { isCodeTaken: true, keepConnection: true, toastKey: undefined }
  }

  if (hasDefinedGQLError('ValueAlreadyExist', errors, 'realmId')) {
    return { isCodeTaken: false, keepConnection: false, toastKey: QUICKBOOKS_COMPANY_TAKEN_KEY }
  }

  const isSilenced = errors.some((error) =>
    SILENCED_ERROR_CODES.some((code) => code === error.extensions?.code),
  )

  return {
    isCodeTaken: false,
    keepConnection: false,
    toastKey: isSilenced ? QUICKBOOKS_GENERIC_ERROR_KEY : undefined,
  }
}
