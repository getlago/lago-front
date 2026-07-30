import { OverlayResult } from '~/core/overlays/types'

export type DialogResult =
  | OverlayResult
  | {
      reason: 'open-other-dialog'
      otherDialog: Promise<DialogResult>
    }

export type HookDialogReturnType<Props> = {
  open: (props: Props) => Promise<DialogResult>
  close: () => void
}

export type PremiumWarningHookDialogReturnType<Props> = {
  open: (props?: Props) => Promise<DialogResult>
  close: () => void
}

export type FormProps = {
  id: string
  submit: () => void | Promise<void> | DialogResult | Promise<DialogResult>
  /**
   * Evaluated once `submit` settles: returning `false` keeps the dialog open.
   *
   * TanStack forms resolve `handleSubmit()` even when validation failed (`onSubmit`
   * simply never runs), so without this guard the dialog would close on invalid
   * input and discard the inline field errors it just rendered.
   *
   * Use `dialogFormProps()` rather than wiring it by hand.
   */
  didSubmitSucceed?: () => boolean
}

/**
 * Minimal surface of a TanStack form needed to drive a dialog's submit.
 * A form returned by `useAppForm` satisfies it.
 */
export type SubmittableForm = {
  handleSubmit: () => Promise<void>
  state: {
    isSubmitSuccessful: boolean
  }
}
