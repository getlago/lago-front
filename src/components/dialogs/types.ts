export type HookDialogReturnType<Props> = {
  open: (props?: Props) => Promise<unknown>
  close: () => Promise<unknown>
  resolve: (args?: unknown) => void
  reject: (args?: unknown) => void
}
