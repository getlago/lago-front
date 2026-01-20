export type HookDialogReturnType<Props> = {
  open: (props?: Props) => Promise<unknown>
  close: () => void
  resolve: (args?: unknown) => void
  reject: (args?: unknown) => void
}
