export type DrawerResult =
  | { reason: 'close' }
  | { reason: 'success'; params?: unknown }
  | { reason: 'error'; error: Error }

export type HookDrawerReturnType<Props> = {
  open: (props: Props) => Promise<DrawerResult>
  close: () => void
}
