import { AnyFormApi, useStore } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'

import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { DatePicker, DatePickerProps } from './DatePicker'

// `DatePicker` withholds an unparseable value from onChange, so without this flag the field
// keeps its last valid value and the form submits a date the input is not showing.
const PICKER_ERROR_MAP_KEY = 'onDatePickerError'

const hasPickerError = (errorMap: Record<string, unknown> = {}): boolean =>
  !!errorMap[PICKER_ERROR_MAP_KEY]

const setPickerError = (form: AnyFormApi, name: string, hasError: boolean): void => {
  if (hasError === hasPickerError(form.getFieldMeta(name)?.errorMap)) return

  form.setFieldMeta(name, (meta) => ({
    ...meta,
    errorMap: {
      ...meta.errorMap,
      [PICKER_ERROR_MAP_KEY]: hasError ? { message: UNSUPPORTED_DATE_ERROR } : undefined,
    },
  }))
}

const DatePickerField = (
  props: Omit<DatePickerProps, 'name' | 'value' | 'onChange' | 'onError' | 'error'> & {
    silentError?: boolean
    displayErrorText?: boolean
    /**
     * Full control over the displayed error: a string replaces it, `false`
     * suppresses it entirely. When omitted, the field meta errors are used.
     */
    errorOverride?: string | false
    /** Maps the picked ISO date, or `undefined` once cleared, to the value the field stores. */
    transformValue?: (value: string | undefined) => string | undefined
  },
): JSX.Element => {
  const {
    silentError = false,
    displayErrorText = true,
    errorOverride,
    defaultZone,
    transformValue,
    ...rest
  } = props
  const field = useFieldContext<string | undefined>()
  const { form, name } = field
  const value = field.state.value
  const isFlagged = useStore(field.store, (state) => hasPickerError(state.meta.errorMap))
  const isShowingUnparseableRef = useRef(false)
  const [pickerKey, setPickerKey] = useState(0)

  const fieldError = useFieldError({
    silentError,
    displayErrorText,
    translateErrors: true,
    noBoolean: true,
  })

  // The picker also drops the typed input, silently, on re-sync from props and on unmount.
  // Keyed on `form` + `name`: `field` is rebuilt on every meta change and would clear it.
  useEffect(
    () => () => {
      isShowingUnparseableRef.current = false
      setPickerError(form, name, false)
    },
    [form, name, value, defaultZone],
  )

  // A form reset drops the flag but not the typed input, so the picker is remounted from the value.
  useEffect(() => {
    if (isFlagged || !isShowingUnparseableRef.current) return

    isShowingUnparseableRef.current = false
    setPickerKey((key) => key + 1)
  }, [isFlagged])

  // form-core runs no validation on a submit it refuses, so run it on the attempt itself:
  // every error shows, and `onSubmitInvalid` gets the schema errors it scrolls to.
  useEffect(() => {
    let attempts = form.state.submissionAttempts

    const subscription = form.store.subscribe(() => {
      const previousAttempts = attempts

      attempts = form.state.submissionAttempts

      if (attempts <= previousAttempts || !hasPickerError(form.getFieldMeta(name)?.errorMap)) {
        return
      }

      form.validateAllFields('submit')
      form.validate('submit')
    })

    return () => subscription.unsubscribe()
  }, [form, name])

  const getDisplayedError = (): string | undefined => {
    // While flagged, the picker renders its own invalid-date message: adding ours repeats it.
    if (isFlagged) return undefined
    if (errorOverride !== undefined) return errorOverride || undefined

    return fieldError
  }

  return (
    <DatePicker
      key={pickerKey}
      {...rest}
      name={name}
      defaultZone={defaultZone}
      value={value}
      onChange={(nextValue) => {
        const pickedValue = nextValue ?? undefined

        field.handleChange(transformValue ? transformValue(pickedValue) : pickedValue)
      }}
      onError={(pickerError) => {
        isShowingUnparseableRef.current = !!pickerError
        setPickerError(form, name, !!pickerError)
      }}
      error={getDisplayedError()}
    />
  )
}

export default DatePickerField
