import { ReactNode } from 'react'
import { AutocompleteRenderInputParams } from '@mui/material'
import { PopperProps as MuiPopperProps } from '@mui/material'

import { TextInputProps } from '../TextInput'

export interface BasicComboBoxData {
  value: string
  selected?: boolean
  label?: string
  labelNode?: ReactNode
  disabled?: boolean
  customValue?: boolean
  group?: never
}

export interface ComboboxDataGrouped extends Omit<BasicComboBoxData, 'group'> {
  group: string
}

export type ComboBoxData = BasicComboBoxData | ComboboxDataGrouped

interface BasicComboboxProps extends Omit<ComboBoxInputProps, 'params'> {
  loading?: boolean
  disabled?: boolean
  value?: string
  data: BasicComboBoxData[]
  sortValues?: boolean
  allowAddValue?: boolean
  loadingText?: string
  emptyText?: string
  virtualized?: boolean
  disableClearable?: boolean
  PopperProps?: Pick<MuiPopperProps, 'placement'> & {
    minWidth?: number
    maxWidth?: number
    displayInDialog?: boolean
    offset?: string
  }
  renderGroupHeader?: never
  onChange: (value: string) => unknown
}

interface GroupedComboboxProps extends Omit<BasicComboboxProps, 'data' | 'renderGroupHeader'> {
  data: ComboboxDataGrouped[]
  renderGroupHeader?: Record<string, ReactNode>
}

export type ComboBoxProps = BasicComboboxProps | GroupedComboboxProps

export type ComboBoxInputProps = Pick<
  TextInputProps,
  'error' | 'label' | 'name' | 'placeholder' | 'helperText' | 'className' | 'infoText'
> & {
  disableClearable?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Omit<AutocompleteRenderInputParams, 'inputProps'> & { inputProps: any }
}
