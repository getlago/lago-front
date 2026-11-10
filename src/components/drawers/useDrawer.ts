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

  // The drawer can also close itself (cancel, submit), so hiding forgets the props too.
  useEffect(() => {
    if (!visible) openProps.current = null
  }, [visible])

  const update = useCallback(
    (props: Partial<Props>): void => {
      const current = openProps.current

      if (!current) return

      const keys = Object.keys(props) as Array<keyof Props>

      if (keys.every((key) => current[key] === props[key])) return

      openProps.current = { ...current, ...props }
      void show(openProps.current)
    },
    [show],
  )

  return {
    open: (props: Props): Promise<DrawerResult> => {
      openProps.current = props

      return show(props) as Promise<DrawerResult>
    },
    update,
    close: (): void => {
      openProps.current = null
      modal.resolve(CLOSE_DRAWER_PARAMS)
      modal.hide()
    },
  }
}

export const useDrawer = (): HookDrawerReturnType<CentralizedDrawerProps> =>
  useRegisteredDrawer<CentralizedDrawerProps>(CentralizedDrawer)

export const useFormDrawer = (): HookDrawerReturnType<FormDrawerProps> =>
  useRegisteredDrawer<FormDrawerProps>(FormDrawer)
