import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'

import { BaseDrawer } from './BaseDrawer'
import { CLOSE_DRAWER_PARAMS, FORM_DRAWER_NAME } from './const'
import { DrawerResult, FormDrawerProps as FormProps, HookDrawerReturnType } from './types'
import { useDrawerActions } from './useDrawerActions'

export type FormDrawerProps = {
  title: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  cancelOrCloseText?: 'close' | 'cancel'
  closeOnError?: boolean
  onError?: (error: Error) => void
  form: FormProps
  className?: string
  withPadding?: boolean
  fullContentHeight?: boolean
}

const FormDrawer = create(
  ({
    title,
    children,
    mainAction,
    cancelOrCloseText = 'close',
    closeOnError = true,
    onError,
    form,
    className,
    withPadding,
    fullContentHeight,
  }: FormDrawerProps) => {
    const modal = useModal()
    const { handleCancel, closeText, handleContinue } = useDrawerActions({
      modal,
      onAction: form.submit,
      cancelOrCloseText,
      closeOnError,
      onError,
    })

    return (
      <BaseDrawer
        isOpen={modal.visible}
        title={title}
        onClose={handleCancel}
        onExited={modal.remove}
        className={className}
        withPadding={withPadding}
        fullContentHeight={fullContentHeight}
        form={{
          id: form.id,
          submit: handleContinue,
        }}
        actions={
          <>
            <Button variant="quaternary" onClick={handleCancel}>
              {closeText}
            </Button>
            {mainAction}
          </>
        }
      >
        {children}
      </BaseDrawer>
    )
  },
)

export default FormDrawer

export const useFormDrawer = (): HookDrawerReturnType<FormDrawerProps> => {
  const modal = useModal(FORM_DRAWER_NAME)

  return {
    open: (props: FormDrawerProps) => modal.show(props) as Promise<DrawerResult>,
    close: () => {
      modal.resolve(CLOSE_DRAWER_PARAMS)
      modal.hide()
    },
  }
}
