import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'

import { BaseDrawer } from './BaseDrawer'
import { FormDrawerProps as FormProps } from './types'
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
