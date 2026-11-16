import { HookOverlayReturnType, OverlayFormProps, OverlayResult } from '~/core/overlays/types'

export type DrawerResult = OverlayResult

export type HookDrawerReturnType<Props> = HookOverlayReturnType<Props> & {
  update: (props: Partial<Props>) => void
}

export type FormDrawerProps = OverlayFormProps
