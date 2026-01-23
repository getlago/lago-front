import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import BaseDialog from './BaseDialog'
import { HookDialogReturnType } from './types'

export const CENTRALIZED_DIALOG_NAME = 'CentralizedDialog'

export const DIALOG_TITLE_TEST_ID = 'dialog-title'

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
      modal.reject()
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

export const useCentralizedDialog = (): HookDialogReturnType<CentralizedDialogProps> => {
  const modal = useModal(CENTRALIZED_DIALOG_NAME)

  return {
    open: (props?: CentralizedDialogProps) => modal.show(props),
    close: () => modal.hide(),
    resolve: (args?: unknown) => modal.resolve(args),
    reject: (args?: unknown) => modal.reject(args),
  }
}
