import { forwardRef } from 'react'
import styled from 'styled-components'

import { Dialog, DialogRef, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export interface PremiumWarningDialogRef extends DialogRef {}

export const PremiumWarningDialog = forwardRef<DialogRef>(({}, ref) => {
  const { translate } = useInternationalization()

  return (
    <Dialog
      ref={ref}
      title={translate('text_63b3155768489ee342482f4f')}
      description={translate('text_63b3155768489ee342482f51')}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62f50d26c989ab03196884ae')}
          </Button>
          <LinkTo
            href={`mailto:hello@getlago.com?subject=${translate(
              'text_63b3f676d44671bf24d81411'
            )}&body=${translate('text_63b3f676d44671bf24d81413')}`}
          >
            <Button>{translate('text_63b3155768489ee342482f55')}</Button>
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

PremiumWarningDialog.displayName = 'PremiumWarningDialog'
