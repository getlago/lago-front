import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import BaseDialog from './BaseDialog'
import { CENTRALIZED_DIALOG_NAME, CLOSE_PARAMS } from './const'
import { dialogActionWrapper } from './dialogActionWrapper'
import { ExecutableHookDialogReturnType, MainFunction } from './types'

export type CentralizedDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  actions: ReactNode
}

const CentralizedDialog = create(
  ({ title, description, headerContent, children, actions }: CentralizedDialogProps) => {
    const modal = useModal()

    const handleClose = async () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    }

    return (
      <BaseDialog
        title={title}
        description={description}
        headerContent={headerContent}
        actions={actions}
        isOpen={modal.visible}
        closeDialog={handleClose}
        removeDialog={modal.remove}
      >
        {children}
      </BaseDialog>
    )
  },
)

export default CentralizedDialog

export const useCentralizedDialog = (): ExecutableHookDialogReturnType<CentralizedDialogProps> => {
  const modal = useModal(CENTRALIZED_DIALOG_NAME)

  return {
    open: (props?: CentralizedDialogProps) => modal.show(props),
    close: () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    },
    execute: (mainFunctionToExecute: MainFunction) => {
      dialogActionWrapper(mainFunctionToExecute, modal)
    },
  }
}
