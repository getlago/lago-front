import { useStore } from '@tanstack/react-form'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldHelp,
  FieldLabel,
} from 'lago-ui/field'
import { Input, InputProps, PasswordInput, SearchInput } from 'lago-ui/input'
import { forwardRef, ReactNode, useId, useRef, useState } from 'react'

import { formatValue, ValueFormatterType } from '~/core/form/formatInputValue'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

export interface InputFieldProps extends Omit<
  InputProps,
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onBlur'
  | 'onCompositionStart'
  | 'onCompositionEnd'
  | 'aria-invalid'
> {
  label?: ReactNode
  description?: string
  helperText?: string
  help?: { label: string; content: ReactNode }
  isOptional?: boolean
  beforeChangeFormatter?: ValueFormatterType | ValueFormatterType[]
  silentError?: boolean
  displayErrorText?: boolean
  showOnlyErrors?: string[]
  errorOverride?: string | boolean
  translateError?: TranslateFunc
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      description,
      helperText,
      help,
      isOptional,
      beforeChangeFormatter,
      silentError,
      displayErrorText,
      showOnlyErrors,
      errorOverride,
      translateError,
      type = 'text',
      variant = 'default',
      'aria-describedby': describedBy,
      ...props
    },
    ref,
  ) => {
    const field = useFieldContext<string | undefined>()
    const value = useStore(field.store, (state) => state.value) ?? ''
    const { translate } = useInternationalization()
    const generatedId = useId()
    const inputId = id ?? generatedId
    const error = useFieldError({
      silentError,
      displayErrorText,
      showOnlyErrors,
      translateErrors: true,
      translateError,
    })
    const displayedError = errorOverride ?? error
    const errorText = typeof displayedError === 'string' ? displayedError : undefined
    const supportingText = errorText || helperText
    const descriptionId = description ? `${inputId}-description` : undefined
    const supportingId = supportingText ? `${inputId}-supporting` : undefined
    const composing = useRef(false)
    const [compositionValue, setCompositionValue] = useState<string | null>(null)

    const commitValue = (input: HTMLInputElement): void => {
      const raw = input.value
      const start = input.selectionStart
      const end = input.selectionEnd
      const direction = input.selectionDirection ?? undefined
      const formatted = formatValue(raw, beforeChangeFormatter)
      const accepted = formatted ?? field.state.value ?? ''

      if (raw !== accepted) {
        input.value = accepted
        if (start !== null && end !== null) {
          const mapPosition = (position: number): number => {
            if (formatted === null) {
              return Math.max(
                0,
                Math.min(position - (raw.length - accepted.length), accepted.length),
              )
            }
            return Math.min(
              formatValue(raw.slice(0, position), beforeChangeFormatter)?.length ?? position,
              accepted.length,
            )
          }

          input.setSelectionRange(mapPosition(start), mapPosition(end), direction)
        }
      }
      if (formatted !== null) field.handleChange(formatted)
    }

    const inputProps: InputProps = {
      ...props,
      id: inputId,
      name: field.name,
      value: compositionValue ?? value,
      variant,
      type,
      'aria-invalid': !!displayedError,
      'aria-describedby':
        [describedBy, descriptionId, supportingId].filter(Boolean).join(' ') || undefined,
      onChange: (event) => {
        if (composing.current) {
          setCompositionValue(event.currentTarget.value)
          return
        }
        commitValue(event.currentTarget)
      },
      onBlur: () => field.handleBlur(),
      onCompositionStart: (event) => {
        composing.current = true
        setCompositionValue(event.currentTarget.value)
      },
      onCompositionEnd: (event) => {
        composing.current = false
        commitValue(event.currentTarget)
        setCompositionValue(null)
      },
    }

    const renderInput = (): ReactNode => {
      if (type === 'password') {
        return (
          <PasswordInput
            {...inputProps}
            ref={ref}
            showPasswordLabel={translate('text_620bc4d4269a55014d493f8f')}
            hidePasswordLabel={translate('text_620bc4d4269a55014d493f9e')}
          />
        )
      }
      if (type === 'search' || variant === 'search') {
        return <SearchInput {...inputProps} ref={ref} />
      }
      return <Input {...inputProps} ref={ref} />
    }

    const renderSupportingText = (): ReactNode => {
      if (!supportingText) return null
      if (displayedError) return <FieldError id={supportingId}>{supportingText}</FieldError>
      return <FieldDescription id={supportingId}>{supportingText}</FieldDescription>
    }

    return (
      <Field data-disabled={props.disabled || undefined}>
        {(label || description || help) && (
          <FieldContent>
            {(label || help) && (
              <div className="flex items-center gap-1">
                {label && (
                  <FieldLabel htmlFor={inputId}>
                    {label}
                    {isOptional && (
                      <span className="font-normal text-text-muted">
                        - {translate('text_17661418227616cvcuga1x7m')}
                      </span>
                    )}
                  </FieldLabel>
                )}
                {help && <FieldHelp label={help.label}>{help.content}</FieldHelp>}
              </div>
            )}
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
          </FieldContent>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {renderInput()}
          {renderSupportingText()}
        </div>
      </Field>
    )
  },
)

InputField.displayName = 'InputField'
export default InputField
