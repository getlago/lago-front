import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { BaseDrawer } from './BaseDrawer'
import { CLOSE_DRAWER_PARAMS } from './const'

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
