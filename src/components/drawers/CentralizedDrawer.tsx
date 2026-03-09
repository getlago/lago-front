import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { BaseDrawer } from './BaseDrawer'
import {
  CENTRALIZED_DRAWER_NAME,
  CLOSE_DRAWER_PARAMS,
  SECOND_LEVEL_DRAWER_NAME,
  THIRD_LEVEL_DRAWER_NAME,
} from './const'
import { DrawerResult, HookDrawerReturnType } from './types'

export type CentralizedDrawerProps = {
  title: ReactNode
  children: ReactNode
  actions?: ReactNode
  actionsClassName?: string
  withPadding?: boolean
  fullContentHeight?: boolean
  className?: string
  onClose?: () => void
}

const CentralizedDrawer = create(
  ({
    title,
    children,
    actions,
    actionsClassName,
    withPadding,
    fullContentHeight,
    className,
    onClose: onCloseProp,
  }: CentralizedDrawerProps) => {
    const modal = useModal()

    const handleClose = () => {
      onCloseProp?.()
      modal.resolve(CLOSE_DRAWER_PARAMS)
      modal.hide()
    }

    return (
      <BaseDrawer
        isOpen={modal.visible}
        title={title}
        onClose={handleClose}
        onExited={modal.remove}
        actions={actions}
        actionsClassName={actionsClassName}
        withPadding={withPadding}
        fullContentHeight={fullContentHeight}
        className={className}
      >
        {children}
      </BaseDrawer>
    )
  },
)

export default CentralizedDrawer

const useDrawerByName = (name: string): HookDrawerReturnType<CentralizedDrawerProps> => {
  const modal = useModal(name)

  return {
    open: (props: CentralizedDrawerProps) => modal.show(props) as Promise<DrawerResult>,
    close: () => {
      modal.resolve(CLOSE_DRAWER_PARAMS)
      modal.hide()
    },
  }
}

export const useCentralizedDrawer = (): HookDrawerReturnType<CentralizedDrawerProps> =>
  useDrawerByName(CENTRALIZED_DRAWER_NAME)

export const useSecondLevelDrawer = (): HookDrawerReturnType<CentralizedDrawerProps> =>
  useDrawerByName(SECOND_LEVEL_DRAWER_NAME)

export const useThirdLevelDrawer = (): HookDrawerReturnType<CentralizedDrawerProps> =>
  useDrawerByName(THIRD_LEVEL_DRAWER_NAME)
