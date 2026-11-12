import { useState } from 'react'

import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { JSON_EDITOR_ERROR_ENUM, JsonEditor, JsonEditorProps } from './JsonEditor'

type JsonEditorFieldForTanstackProps = Omit<
  JsonEditorProps,
  'name' | 'value' | 'error' | 'onChange' | 'onBlur' | 'onError'
> & {
  silentError?: boolean
  displayErrorText?: boolean
}

type ParseFailure = {
  value: unknown
  error: keyof typeof JSON_EDITOR_ERROR_ENUM
}

const JsonEditorField = ({
  silentError = false,
  displayErrorText = true,
  ...props
}: JsonEditorFieldForTanstackProps) => {
  const field = useFieldContext<string | Record<string, unknown> | undefined>()
  const fieldError = useFieldError({
    silentError,
    displayErrorText,
    noBoolean: true,
    translateErrors: true,
  })
  // Not form state: nothing in the submit-first cycle clears a field-owned error. Pinned
  // to the value that failed instead, so any edit drops it and the next blur re-evaluates.
  const [parseFailure, setParseFailure] = useState<ParseFailure | undefined>()
  const parseError =
    parseFailure && parseFailure.value === field.state.value ? parseFailure.error : undefined

  return (
    <JsonEditor
      {...props}
      name={field.name}
      value={field.state.value}
      error={silentError ? undefined : fieldError || parseError}
      onChange={(value) => field.handleChange(value)}
      onError={(error) => setParseFailure({ value: field.state.value, error })}
      onBlur={field.handleBlur}
    />
  )
}

export default JsonEditorField
