import { AutocompleteRenderInputParams } from '@mui/material'
import { PopperProps as MuiPopperProps } from '@mui/material'

import { TextInputProps } from '../TextInput'

export interface ComboBoxData {
  value: string
  selected?: boolean
  label?: string
  disabled?: boolean
  customValue?: boolean
}

export type ComboBoxDataWithLabel = ComboBoxData & Required<Pick<ComboBoxData, 'label'>>

export interface ComboBoxProps extends Omit<ComboBoxInputProps, 'params'> {
  loading?: boolean
  disabled?: boolean
  value?: string
  data: ComboBoxData[]
  sortValues?: boolean
  allowAddValue?: boolean
  PopperProps?: Pick<MuiPopperProps, 'placement'> & {
    minWidth?: number
    maxWidth?: number
    offset?: string
  }
  onChange: (value: string) => unknown
}

export type ComboBoxInputProps = Omit<TextInputProps, 'onChange'> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Omit<AutocompleteRenderInputParams, 'inputProps'> & { inputProps: any }
}
