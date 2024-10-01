import { useState } from 'react'
import styled from 'styled-components'

import { UseDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { theme } from '~/styles'

import { Icon } from './designSystem'
import { TextInput } from './form'

interface SearchInputProps {
  onChange: ReturnType<UseDebouncedSearch>['debouncedSearch']
  placeholder?: string
}

export const SearchInput = ({ onChange, placeholder }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState<string>('')

  return (
    <TextInputForSearch
      placeholder={placeholder}
      value={localValue}
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

const TextInputForSearch = styled(TextInput)`
  max-width: 240px;

  .MuiInputBase-inputAdornedStart {
    height: 40px;
    padding-left: ${theme.spacing(3)};
  }
`
