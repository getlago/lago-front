import { isBoolean } from 'lodash'
import { forwardRef, ReactNode, useId, useRef, useState } from 'react'

import { Typography, TypographyProps } from '~/components/designSystem'
import { tw } from '~/styles/utils'

export interface RadioProps {
  name?: string
  value: string | number | boolean
  checked: boolean
  disabled?: boolean
  label?: string | ReactNode
  labelVariant?: TypographyProps['variant']
  sublabel?: string | ReactNode
  onChange?: (value: string | number | boolean) => void
}

export const Radio = forwardRef<HTMLDivElement, RadioProps>(
  (
    { name, checked, label, labelVariant, sublabel, disabled, value, onChange }: RadioProps,
    ref,
  ) => {
    const componentId = useId()

    const inputRef = useRef<HTMLInputElement>(null)
    const [focused, setFocused] = useState(false)

    return (
      //  eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div
        onClick={() => inputRef.current?.click()}
        ref={ref}
        className={tw('flex w-full items-start', !disabled && 'group/radio-icon cursor-pointer')}
      >
        <div className="mr-3 flex items-start pt-1">
          <input
            readOnly
            id={componentId}
            ref={inputRef}
            disabled={disabled}
            aria-label={name}
            {...(isBoolean(value) ? { checked: value } : { value: value })}
            type="radio"
            onClick={() => onChange && onChange(value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="absolute m-0 size-0 p-0 opacity-0"
          />

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={tw(focused && 'rounded-full ring')}
          >
            {checked ? (
              <>
                <circle
                  className={tw(checked && 'fill-blue-700', disabled && 'fill-grey-400')}
                  cx="8"
                  cy="8"
                  r="8"
                  fill="currentColor"
                />
                <circle
                  className="group-hover/radio-icon:fill-blue-100 group-active/radio-icon:fill-blue-200"
                  cx="8"
                  cy="8"
                  r="7"
                  fill="white"
                />
                <circle
                  className={tw(checked && 'fill-blue-700', disabled && 'fill-grey-400')}
                  cx="8"
                  cy="8"
                  r="4"
                  fill="currentColor"
                />
              </>
            ) : (
              <>
                <circle
                  className={tw(disabled && 'fill-grey-400')}
                  cx="8"
                  cy="8"
                  r="8"
                  fill="currentColor"
                />
                <circle
                  className="group-hover/radio-icon:fill-grey-200 group-active/radio-icon:fill-grey-300"
                  cx="8"
                  cy="8"
                  r="7"
                  fill="white"
                />
              </>
            )}
          </svg>
        </div>
        <div className="w-full">
          <Typography
            variant={labelVariant || 'bodyHl'}
            color={disabled ? 'disabled' : 'textSecondary'}
            className={tw(!disabled && 'cursor-pointer')}
            component={(labelProps) => <label htmlFor={componentId} {...labelProps} />}
          >
            {label}
          </Typography>
          {!!label &&
            (typeof sublabel === 'string' ? (
              <Typography variant="caption" color={disabled ? 'disabled' : 'grey600'}>
                {sublabel}
              </Typography>
            ) : (
              sublabel
            ))}
        </div>
      </div>
    )
  },
)

Radio.displayName = 'Radio'
