import { Icon } from 'lago-design-system'
import { useState } from 'react'

import { UseDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { tw } from '~/styles/utils'

import { TextInput } from './form'

interface SearchInputProps {
  className?: string
  onChange: ReturnType<UseDebouncedSearch>['debouncedSearch']
  placeholder?: string
  disabled?: boolean
}

export const SearchInput = ({ className, onChange, placeholder, disabled }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState<string>('')

  return (
    <TextInput
      className={tw('max-w-60 [&_input]:h-10 [&_input]:!pl-3', className)}
      placeholder={placeholder}
      value={localValue}
      disabled={disabled}
      onChange={(value) => {
        onChange && onChange(value)
        setLocalValue(value)
      }}
      InputProps={{
        startAdornment: <Icon className="ml-4" name="magnifying-glass" />,
      }}
      cleanable
    />
  )
}
