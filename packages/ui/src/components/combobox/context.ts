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
  commit: (event: React.SyntheticEvent) => void
  hasQuery: boolean
  canAdd: boolean
  addLabel: string
  highlighted: React.MutableRefObject<boolean>
} | null>(null)
