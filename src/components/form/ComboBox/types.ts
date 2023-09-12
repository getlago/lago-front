import { LazyQueryExecFunction } from '@apollo/client'
import { AutocompleteRenderInputParams } from '@mui/material'
import { PopperProps as MuiPopperProps } from '@mui/material'
import { ReactNode } from 'react'

import { Exact, InputMaybe } from '~/generated/graphql'
import { UseDebouncedSearch } from '~/hooks/useDebouncedSearch'

import { TextInputProps } from '../TextInput'

export interface BasicComboBoxData {
  value: string
  selected?: boolean
  label?: string
  labelNode?: ReactNode
  disabled?: boolean
  customValue?: boolean
  group?: never
  addValueRedirectionUrl?: string
}

export interface ComboboxDataGrouped extends Omit<BasicComboBoxData, 'group'> {
  group: string
}

export type ComboBoxData = BasicComboBoxData | ComboboxDataGrouped

interface BasicComboboxProps extends Omit<ComboBoxInputProps, 'params' | 'searchQuery'> {
  loading?: boolean
  disabled?: boolean
  value?: string
  data: BasicComboBoxData[]
  sortValues?: boolean
  allowAddValue?: boolean
  emptyText?: string
  virtualized?: boolean
  disableClearable?: boolean
  renderGroupInputStartAdornment?: { [key: string]: string }
  PopperProps?: Pick<MuiPopperProps, 'placement'> & {
    minWidth?: number
    maxWidth?: number
    displayInDialog?: boolean
    offset?: string
  }
  addValueProps?: {
    label: string
    redirectionUrl?: string
  }
  renderGroupHeader?: never
  onChange: (value: string) => unknown
  searchQuery?: LazyQueryExecFunction<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    Exact<{
      page?: InputMaybe<number> | undefined
      limit?: InputMaybe<number> | undefined
      searchTerm?: InputMaybe<string> | undefined
    }>
  >
}

interface GroupedComboboxProps extends Omit<BasicComboboxProps, 'data' | 'renderGroupHeader'> {
  data: ComboboxDataGrouped[]
  renderGroupHeader?: Record<string, ReactNode>
}

export type ComboBoxProps = BasicComboboxProps | GroupedComboboxProps

export type ComboBoxInputProps = Pick<
  TextInputProps,
  | 'error'
  | 'label'
  | 'name'
  | 'placeholder'
  | 'helperText'
  | 'className'
  | 'infoText'
  | 'startAdornmentValue'
> & {
  disableClearable?: boolean
  hasValueSelected?: boolean
  loading?: boolean
  searchQuery?: ReturnType<UseDebouncedSearch>['debouncedSearch']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Omit<AutocompleteRenderInputParams, 'inputProps'> & { inputProps: any }
}
