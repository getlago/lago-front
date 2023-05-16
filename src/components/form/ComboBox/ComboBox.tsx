import { useEffect, useMemo, useRef } from 'react'
import { Autocomplete, createFilterOptions } from '@mui/material'
import _sortBy from 'lodash/sortBy'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { Skeleton } from '~/components/designSystem'

import { ComboBoxItem, ITEM_HEIGHT } from './ComboBoxItem'
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
  addValueProps,
  sortValues = true,
  label,
  infoText,
  placeholder,
  name,
  helperText,
  error,
  PopperProps,
  className,
  searchQuery,
  emptyText,
  disableClearable = false,
  renderGroupHeader,
  virtualized = true,
  renderGroupInputStartAdornment,
  onChange,
}: ComboBoxProps) => {
  const { translate } = useInternationalization()

  const { debouncedSearch, isLoading } = useDebouncedSearch(searchQuery, loading)

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
            hasValueSelected={!!value}
            searchQuery={debouncedSearch}
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
        <>
          {[1, 2, 3].map((i) => (
            <LoadingItem key={`combobox-loading-item-${i}`}>
              <Skeleton variant="circular" width={16} height={16} marginRight="16px" />
              <Skeleton variant="text" width="100%" height={12} />
            </LoadingItem>
          ))}
        </>
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
            addValueRedirectionUrl={option.addValueRedirectionUrl}
          />
        )
      }}
      filterOptions={(options, params) => {
        const filtered = searchQuery
          ? options
          : filter(
              options,
              params.inputValue !== value
                ? params
                : { getOptionLabel: params.getOptionLabel, inputValue: '' }
            )

        // Suggest the creation of a new value
        if (filtered.length === 0 && params.inputValue !== '' && allowAddValue && addValueProps) {
          filtered.push({
            value: params.inputValue,
            label: addValueProps.label || `Add "${params.inputValue}"`,
            addValueRedirectionUrl: addValueProps.redirectionUrl,
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

const LoadingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${ITEM_HEIGHT}px;
  box-sizing: border-box;
  margin: 0 ${theme.spacing(2)};
  padding: 0 ${theme.spacing(4)};
`
