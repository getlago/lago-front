import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type TProps = {
  title?: string
  description?: string
  mailtoSubject?: string
  mailtoBody?: string
}

export interface PremiumWarningDialogRef extends DialogRef {
  openDialog: (data?: TProps) => unknown
  closeDialog: () => unknown
}

export const PremiumWarningDialog = forwardRef<PremiumWarningDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [localData, setLocalData] = useState<TProps | null>(null)

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      !!data?.description && setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={localData?.title || translate('text_63b3155768489ee342482f4f')}
      description={localData?.description || translate('text_63b3155768489ee342482f51')}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62f50d26c989ab03196884ae')}
          </Button>
          <LinkTo
            href={`mailto:hello@getlago.com?subject=${
              localData?.mailtoSubject || translate('text_63b3f676d44671bf24d81411')
            }&body=${localData?.mailtoBody || translate('text_63b3f676d44671bf24d81413')}`}
          >
            <FullWidthButton>{translate('text_63b3155768489ee342482f55')}</FullWidthButton>
          </LinkTo>
        </>
      )}
    />
  )
})

const LinkTo = styled.a`
  margin-right: 0;
  margin-bottom: 0;
`

const FullWidthButton = styled(Button)`
  /* Fixes the button witdh on small screens */
  width: 100%;
`

PremiumWarningDialog.displayName = 'PremiumWarningDialog'
