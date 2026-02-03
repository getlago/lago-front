export type PromiseReturnType =
  | {
      reason: 'error'
      error: Error
    }
  | {
      reason: 'success'
      params?: unknown
    }
  | Error

export type MainFunction = () => PromiseReturnType

export type HookDialogReturnType<Props> = {
  open: (props?: Props) => Promise<unknown>
  close: () => void
}
