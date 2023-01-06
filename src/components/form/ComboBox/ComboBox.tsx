import { useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, createFilterOptions } from '@mui/material'
import _sortBy from 'lodash/sortBy'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Icon, Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'

import { ComboBoxItem } from './ComboBoxItem'
import { ComboBoxInput } from './ComboBoxInput'
import { ComboBoxPopperFactory } from './ComboBoxPopperFactory'
import { ComboboxList } from './ComboboxList'
import { ComboBoxData, ComboBoxProps } from './types'

export const ComboBox = ({
  data: rawData,
  loading,
  value,
  disabled,
  allowAddValue = false,
  sortValues = true,
  label,
  infoText,
  placeholder,
  name,
  helperText,
  error,
  PopperProps,
  className,
  loadingText,
  searchQuery,
  emptyText,
  disableClearable = false,
  renderGroupHeader,
  virtualized = true,
  renderGroupInputStartAdornment,
  onChange,
}: ComboBoxProps) => {
  const { translate } = useInternationalization()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // This is to prenvent loading blink if the loading time is really small
    if (searchQuery) {
      setIsLoading(true)
    }
    setTimeout(() => {
      setIsLoading(loading || false)
    }, DEBOUNCE_SEARCH_MS)
  }, [searchQuery, loading])

  // By default, we want to sort `options` alphabetically (by value)
  const data = useMemo(() => {
    return (
      sortValues ? _sortBy(rawData, (item: ComboBoxData) => item.label ?? item.value) : rawData
    ) as ComboBoxData[]
  }, [rawData, sortValues])

  // we need a ref to the previous data (see the following `useEffect()`)
  //  to compute if some options were deleted and update the `value` accordingly
  const prevRawDataRef = useRef<ComboBoxData[] | undefined>()

  useEffect(() => {
    prevRawDataRef.current = rawData
  })
  const prevRawData = prevRawDataRef.current

  // when `data` gets updated, make sure that if the current value is not belonging to
  //   a deleted option
  // N.B: we compute the diff to not delete a "freeForm" value
  useEffect(() => {
    if (prevRawData && data) {
      const deletedOptions = prevRawData.filter(
        ({ value: oldVal }) => !data.find(({ value: newVal }) => oldVal === newVal)
      )

      if (deletedOptions.find(({ value: deletedValue }) => value === deletedValue)) {
        onChange('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData])

  const filter = createFilterOptions<ComboBoxData>({
    matchFrom: allowAddValue ? 'start' : 'any',
    stringify: (option) => option.label || option.value,
  })
  const startAdornmentValue = useMemo(() => {
    if (!renderGroupInputStartAdornment || !value) return undefined

    let foundGroup = data.find((item) => item.value === value)?.group

    return foundGroup ? renderGroupInputStartAdornment[foundGroup] : undefined
  }, [data, renderGroupInputStartAdornment, value])

  return (
    <Autocomplete
      options={data}
      disabled={disabled}
      renderInput={(params) => {
        return (
          <ComboBoxInput
            disableClearable={disableClearable}
            className={className}
            error={error}
            searchQuery={searchQuery}
            helperText={helperText}
            label={label}
            infoText={infoText}
            name={name}
            placeholder={placeholder}
            startAdornmentValue={startAdornmentValue}
            params={params}
          />
        )
      }}
      onChange={(_event, newValue) => {
        if (typeof newValue === 'string') {
          onChange(newValue)
        } else if (newValue && !newValue.disabled) {
          onChange(newValue?.value)
        } else {
          onChange('')
        }
      }}
      // pass `null` to force Autocomplete in controlled mode
      //  (`undefined` value at initial render puts Autocomplete in uncontrolled mode)
      value={value || null}
      loading={isLoading}
      loadingText={
        <LoadingContainer>
          <Loader color="primary" name="processing" animation="spin" />
          <Typography>{loadingText ?? translate('text_623b3acb8ee4e000ba87d084')}</Typography>
        </LoadingContainer>
      }
      noOptionsText={emptyText ?? translate('text_623b3acb8ee4e000ba87d082')}
      selectOnFocus={allowAddValue}
      clearOnBlur
      clearOnEscape
      handleHomeEndKeys={allowAddValue}
      freeSolo={allowAddValue}
      isOptionEqualToValue={(option, val) => {
        return option?.value === (val as unknown as string)
      }}
      renderOption={(props, option, state) => {
        return (
          <ComboBoxItem
            comboboxProps={props}
            id={`option-${option.value}`}
            key={`option-${option.value}`}
            option={option}
            selected={state.selected}
            virtualized={virtualized}
          />
        )
      }}
      filterOptions={(options, params) => {
        if (searchQuery) return options

        const filtered = filter(
          options,
          params.inputValue !== value
            ? params
            : { getOptionLabel: params.getOptionLabel, inputValue: '' }
        )

        // Suggest the creation of a new value
        if (filtered.length === 0 && params.inputValue !== '' && allowAddValue) {
          filtered.push({
            value: params.inputValue,
            label: `Add "${params.inputValue}"`,
            customValue: true,
          })
        }

        return filtered
      }}
      ListboxComponent={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ComboboxList as any
      }
      ListboxProps={
        // @ts-ignore
        { value, renderGroupHeader, virtualized }
      }
      PopperComponent={ComboBoxPopperFactory({
        ...PopperProps,
        grouped: !!(data || [])[0]?.group,
        virtualized,
      })}
      getOptionDisabled={(option) => !!option?.disabled}
      getOptionLabel={(option) => {
        const optionForString =
          typeof option === 'string' ? data.find(({ value: val }) => val === option) : null

        return typeof option === 'string'
          ? optionForString
            ? optionForString.label || optionForString.value
            : option
          : option.label || option.value
      }}
    />
  )
}

const Loader = styled(Icon)`
  margin-bottom: ${theme.spacing(4)};
`
const LoadingContainer = styled.div`
  text-align: center;
`
