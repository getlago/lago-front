import * as React from 'react'

export interface ComboboxContextValue {
  disabled: boolean
  readOnly: boolean
  virtualized: boolean
  highlightedIndex: React.MutableRefObject<number | undefined>
  scrollToIndex: React.MutableRefObject<((index: number) => void) | undefined>
}
export const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
export const FreeTextContext = React.createContext<{
  commit: () => void
  canAdd: boolean
  addLabel: string
  invalid: boolean
  errorId?: string
  highlighted: React.MutableRefObject<boolean>
} | null>(null)
