/**
 * Discriminated union type for all possible dialog results
 */
export type DialogResult =
  | {
      reason: 'close'
    }
  | {
      reason: 'open-other-dialog'
      otherDialog: Promise<DialogResult>
    }
  | {
      reason: 'success'
      params?: unknown
    }
  | {
      reason: 'error'
      error: Error
    }

export type HookDialogReturnType<Props> = {
  open: (props: Props) => Promise<DialogResult>
  close: () => void
}

export type PremiumWarningHookDialogReturnType<Props> = {
  open: (props?: Props) => Promise<DialogResult>
  close: () => void
}
