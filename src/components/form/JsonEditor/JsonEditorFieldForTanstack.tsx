import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { JsonEditor, JsonEditorProps } from './JsonEditor'

type JsonEditorFieldForTanstackProps = Omit<
  JsonEditorProps,
  'name' | 'value' | 'error' | 'onChange' | 'onBlur' | 'onError'
> & {
  silentError?: boolean
  displayErrorText?: boolean
}

const JsonEditorField = ({
  silentError = false,
  displayErrorText = true,
  ...props
}: JsonEditorFieldForTanstackProps) => {
  const field = useFieldContext<string | Record<string, unknown> | undefined>()
  const error = useFieldError({ silentError, displayErrorText, noBoolean: true })

  return (
    <JsonEditor
      {...props}
      name={field.name}
      value={field.state.value}
      error={error}
      onChange={(value) => field.handleChange(value)}
      onBlur={field.handleBlur}
    />
  )
}

export default JsonEditorField
