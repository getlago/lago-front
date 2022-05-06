/* eslint-disable react/prop-types */
import { forwardRef } from 'react'

import { TextInput, TextInputProps } from '../TextInput'

export interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChange' | 'type'> {
  value: number | undefined
  onChange?: (value: number | undefined) => void
}

export const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  ({ value, onChange, ...props }: AmountInputProps, ref) => {
    const valueStandard = value ? value / 100 : value

    return (
      <TextInput
        ref={ref}
        value={valueStandard}
        type="number"
        onChange={(newValue) => {
          onChange && onChange(newValue === '' ? undefined : Math.round(Number(newValue) * 100))
        }}
        {...props}
      />
    )
  }
)

AmountInput.displayName = 'AmountInput'
