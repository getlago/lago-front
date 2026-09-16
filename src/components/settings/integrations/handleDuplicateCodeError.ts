import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { applyExistingCodeErrorOrToast } from '~/core/form/existingCodeError'

// Shared by the integration dialogs whose form is taller than the modal: bring
// the Code input back into view, but only when that is where the error landed.
export const handleDuplicateCodeError = (
  formApi: AnyFormApi,
  errors?: readonly GraphQLFormattedError[],
): void => {
  if (!applyExistingCodeErrorOrToast(formApi, errors)) return

  document.getElementsByClassName('MuiDialog-container')[0]?.scrollTo({ top: 0 })
}
