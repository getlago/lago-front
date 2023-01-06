import { useState } from 'react'
import styled from 'styled-components'

import { theme } from '~/styles'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

import { Icon } from './designSystem'
import { TextInput } from './form'

interface SearchInputProps {
  placeholder?: string
  searchQuery: Function
}

export const SearchInput = ({ placeholder, searchQuery }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState<string>('')
  const debouncedSearch = useDebouncedSearch(searchQuery)

  return (
    <TextInputForSearch
      placeholder={placeholder}
      value={localValue}
      onChange={(value) => {
        setLocalValue(value)
        debouncedSearch(value)
      }}
      InputProps={{
        startAdornment: <SearchIcon name="magnifying-glass" />,
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

const SearchIcon = styled(Icon)`
  padding-left: ${theme.spacing(4)};
`
