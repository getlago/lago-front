import { Autocomplete, createFilterOptions } from '@mui/material'
import _sortBy from 'lodash/sortBy'
import { useMemo } from 'react'
import styled from 'styled-components'

import { Chip, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { MultipleComboBoxItem } from './MultipleComboBoxItem'
import { MultipleComboBoxList } from './MultipleComboBoxList'
import { MultipleComboBoxPopperFactory } from './MultipleComboBoxPopperFactory'
import { MultipleComboBoxData, MultipleComboBoxProps } from './types'

import { TextInput } from '../TextInput'

const DEFAULT_LIMIT_TAGS = 2

export const MultipleComboBox = ({
  data: rawData,
  value,
  disabled,
  sortValues = true,
  label,
  infoText,
  placeholder,
  name,
  helperText,
  error,
  PopperProps,
  className,
  freeSolo,
  emptyText,
  disableClearable = false,
  renderGroupHeader,
  virtualized = true,
  limitTags,
  onChange,
}: MultipleComboBoxProps) => {
  const { translate } = useInternationalization()

  // By default, we want to sort `options` alphabetically (by value)
  const data = useMemo(() => {
    return (
      sortValues
        ? _sortBy(rawData, (item: MultipleComboBoxData) => item.label ?? item.value)
        : rawData
    ) as MultipleComboBoxData[]
  }, [rawData, sortValues])
  const filter = createFilterOptions<MultipleComboBoxData>({
    matchFrom: 'start',
    stringify: (option) => option.label || option.value,
  })

  return (
    <Container>
      <Autocomplete
        multiple
        forcePopupIcon
        disableCloseOnSelect
        disableClearable={disableClearable}
        disabled={disabled}
        limitTags={limitTags || DEFAULT_LIMIT_TAGS}
        options={data}
        sx={{ width: '100%' }}
        renderInput={(params) => (
          <TextInput
            {...params}
            className={className}
            infoText={infoText}
            error={error}
            helperText={helperText}
            label={label}
            name={name}
            placeholder={placeholder}
          />
        )}
        onChange={(_, newValue) => {
          if (freeSolo) {
            // On free solo mode, turn typed values into objects
            onChange(
              newValue.map((val) => {
                if (typeof val === 'string') {
                  val = { value: val }
                }
                return val
              }),
            )
          } else {
            onChange(newValue)
          }
        }}
        value={value || []}
        renderTags={(tagValues, getTagProps) =>
          tagValues.map((option, index) => {
            const tagOptions = getTagProps({ index })

            return (
              <Chip
                {...tagOptions}
                key={tagOptions.key}
                label={option.value}
                sx={{
                  margin: '8px 0px 8px 8px',
                }}
              />
            )
          })
        }
        clearIcon={<Icon name="close-circle-filled" />}
        popupIcon={<Icon name="chevron-up-down" />}
        noOptionsText={emptyText ?? translate('text_623b3acb8ee4e000ba87d082')}
        clearOnBlur
        freeSolo={freeSolo}
        isOptionEqualToValue={(option, val) => {
          return option?.value === val.value
        }}
        renderOption={(props, option, state) => {
          return (
            <MultipleComboBoxItem
              multipleComboBoxProps={props}
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
          const filtered = filter(options, params)

          const { inputValue } = params
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => inputValue === option.value || inputValue === option.label,
          )

          if (inputValue !== '' && !isExisting && freeSolo) {
            filtered.push({
              value: inputValue,
              label: `Add "${inputValue}"`,
            })
          }

          return filtered
        }}
        ListboxComponent={
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          MultipleComboBoxList as any
        }
        ListboxProps={
          // @ts-ignore
          { value, renderGroupHeader, virtualized }
        }
        PopperComponent={MultipleComboBoxPopperFactory({
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
    </Container>
  )
}
const Container = styled.div`
  width: 100%;

  /* Prevent dropdown and clear button to overlap input */
  .MuiAutocomplete-inputRoot {
    padding-right: 50px !important;
  }

  /* Ensure the input does not shrink too much when items are selected */
  .MuiAutocomplete-input {
    min-width: 80px !important;
  }

  /* Fix the placement of the adornment elements */
  .MuiAutocomplete-endAdornment {
    top: calc(50% - 19px);
  }

  /* Make sure scursor is visible when overing svg */
  .MuiAutocomplete-popupIndicator,
  .MuiAutocomplete-clearIndicator {
    svg {
      cursor: pointer;
    }
  }
`
