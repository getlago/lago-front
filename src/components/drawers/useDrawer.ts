import NiceModal, { unregister, useModal } from '@ebay/nice-modal-react'
import { useCallback, useEffect, useId, useRef } from 'react'

import CentralizedDrawer, { CentralizedDrawerProps } from './CentralizedDrawer'
import { CLOSE_DRAWER_PARAMS } from './const'
import FormDrawer, { FormDrawerProps } from './FormDrawer'
import { DrawerResult, HookDrawerReturnType } from './types'

type RegisteredDrawer = Parameters<typeof NiceModal.register>[1]

const useRegisteredDrawer = <Props extends Record<string, unknown>>(
  drawer: RegisteredDrawer,
): HookDrawerReturnType<Props> => {
  const id = useId()
  const openProps = useRef<Props | null>(null)

  useEffect(() => {
    NiceModal.register(id, drawer)

    return () => unregister(id)
  }, [id, drawer])

  const modal = useModal(id)
  const { visible, show } = modal

  // Stable while the drawer stays open, so callers can drive it from an effect.
  const update = useCallback(
    (props: Partial<Props>) => {
      if (!visible || !openProps.current) return

      openProps.current = { ...openProps.current, ...props }
      void show(openProps.current)
    },
    [visible, show],
  )

  return {
    open: (props: Props) => {
      openProps.current = props

      return show(props) as Promise<DrawerResult>
    },
    update,
    close: () => {
      modal.resolve(CLOSE_DRAWER_PARAMS)
      modal.hide()
    },
  }
}

export const useDrawer = (): HookDrawerReturnType<CentralizedDrawerProps> =>
  useRegisteredDrawer<CentralizedDrawerProps>(CentralizedDrawer)

export const useFormDrawer = (): HookDrawerReturnType<FormDrawerProps> =>
  useRegisteredDrawer<FormDrawerProps>(FormDrawer)
