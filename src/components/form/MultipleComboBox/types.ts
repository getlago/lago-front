import { AutocompleteRenderInputParams } from '@mui/material'
import { PopperProps as MuiPopperProps } from '@mui/material'
import { ReactNode } from 'react'

import { TextInputProps } from '../TextInput'

export interface BasicMultipleComboBoxData {
  value: string
  selected?: boolean
  label?: string
  labelNode?: ReactNode
  disabled?: boolean
  customValue?: boolean
  group?: never
  addValueRedirectionUrl?: string
}

export interface MultipleComboBoxDataGrouped extends Omit<BasicMultipleComboBoxData, 'group'> {
  group: string
}

export type MultipleComboBoxData = BasicMultipleComboBoxData | MultipleComboBoxDataGrouped

interface BasicMultipleComboBoxProps
  extends Omit<MultipleComboBoxInputProps, 'params' | 'searchQuery'> {
  disabled?: boolean
  freeSolo?: boolean
  value?: MultipleComboBoxData[]
  data?: BasicMultipleComboBoxData[]
  sortValues?: boolean
  forcePopupIcon?: boolean
  hideTags?: boolean
  emptyText?: string
  virtualized?: boolean
  limitTags?: number
  disableClearable?: boolean
  PopperProps?: Pick<MuiPopperProps, 'placement'> & {
    minWidth?: number
    maxWidth?: number
    displayInDialog?: boolean
    offset?: string
  }
  renderGroupHeader?: never
  onChange: (value: (string | BasicMultipleComboBoxData | MultipleComboBoxDataGrouped)[]) => void
}

interface GroupedMultipleComboBoxProps
  extends Omit<BasicMultipleComboBoxProps, 'data' | 'renderGroupHeader'> {
  data: MultipleComboBoxDataGrouped[]
  renderGroupHeader?: Record<string, ReactNode>
}

export type MultipleComboBoxProps = BasicMultipleComboBoxProps | GroupedMultipleComboBoxProps

export type MultipleComboBoxInputProps = Pick<
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Omit<AutocompleteRenderInputParams, 'inputProps'> & { inputProps: any }
}
