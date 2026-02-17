import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useFieldContext } from './formContext'

type UseFieldErrorOptions = {
  silentError?: boolean
  displayErrorText?: boolean
  showOnlyErrors?: string[]
  noBoolean?: boolean
  translateErrors?: boolean
}

type UseFieldErrorResult<T extends boolean | undefined> = T extends true
  ? string | undefined
  : string | boolean | undefined

export function useFieldError<TNoBoolean extends boolean | undefined = undefined>(
  options: UseFieldErrorOptions & { noBoolean?: TNoBoolean } = {},
): UseFieldErrorResult<TNoBoolean> {
  const {
    silentError = false,
    displayErrorText = true,
    showOnlyErrors,
    noBoolean,
    translateErrors = false,
  } = options

  const field = useFieldContext()
  const { translate } = useInternationalization()

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)
  const allErrors = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .filter(Boolean)

  // Filter errors if showOnlyErrors is provided
  const filteredErrors = showOnlyErrors
    ? allErrors.filter((err) => showOnlyErrors.includes(err as string))
    : allErrors

  // Translate errors if needed, then join
  const error = translateErrors
    ? filteredErrors.map((errorKey) => translate(errorKey as string)).join('\n')
    : filteredErrors.join('')

  if (noBoolean) {
    return getErrorToDisplay({
      error,
      errorMap,
      silentError,
      displayErrorText,
      noBoolean: true,
    }) as UseFieldErrorResult<TNoBoolean>
  }

  return getErrorToDisplay({
    error,
    errorMap,
    silentError,
    displayErrorText,
  }) as UseFieldErrorResult<TNoBoolean>
}
