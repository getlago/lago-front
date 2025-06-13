import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { SwitchField, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  AddFlutterwavePaymentProviderInput,
  FlutterwaveIntegrationDetailsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { DeleteFlutterwaveIntegrationDialogRef } from './DeleteFlutterwaveIntegrationDialog'

gql`
  fragment AddFlutterwaveProviderDialog on FlutterwaveProvider {
    id
    name
    code
    publicKey
    secretKey
    encryptionKey
    production
  }
`

type TAddFlutterwaveDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteFlutterwaveIntegrationDialogRef>
  provider: FlutterwaveIntegrationDetailsFragment
  deleteDialogCallback: () => void
}>

export interface AddFlutterwaveDialogRef {
  openDialog: (props?: TAddFlutterwaveDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddFlutterwaveDialog = forwardRef<AddFlutterwaveDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddFlutterwaveDialogProps | undefined>(undefined)
  const flutterwaveProvider = localData?.provider
  const isEdition = !!flutterwaveProvider

  const formikProps = useFormik<AddFlutterwavePaymentProviderInput>({
    initialValues: {
      name: flutterwaveProvider?.name || '',
      code: flutterwaveProvider?.code || '',
      publicKey: flutterwaveProvider?.publicKey || '',
      secretKey: flutterwaveProvider?.secretKey || '',
      encryptionKey: flutterwaveProvider?.encryptionKey || '',
      production: flutterwaveProvider?.production || false,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      publicKey: string().required(''),
      secretKey: string().required(''),
      encryptionKey: string().required(''),
    }),
    onSubmit: async (values) => {
      // TODO: Implement actual API call when backend support is ready
      // eslint-disable-next-line no-console
      console.log('Flutterwave integration values:', values)
      
      // Show appropriate toast message based on operation
      addToast({
        message: translate(
          isEdition ? 'text_174980344483769h5q79g4ap' : 'text_1749803444837pl1ketrhm8a',
        ),
        severity: 'info',
      })

      dialogRef.current?.closeDialog()
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(
        isEdition ? 'text_1749725331374i3p14ewcpn5' : 'text_1749725331374clf07sez01f',
      )}
      description={translate('text_174972533137460li1pvmw34')}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <div className="flex w-full items-center gap-3">
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: flutterwaveProvider,
                  callback: localData?.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1749725331374clf07sez01f',
              )}
            </Button>
          </div>
        </div>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-start gap-6">
          <TextInputField
            className="flex-1"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            className="flex-1"
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </div>
        <TextInputField
          name="publicKey"
          label={translate('text_1749725287668wpbctffw2gv')}
          placeholder={translate('text_1749725331374936azbwqk89')}
          formikProps={formikProps}
        />
        <TextInputField
          name="secretKey"
          label={translate('text_17497252876688ai900wowoc')}
          placeholder={translate('text_1749725331374uzvwfxs7m82')}
          formikProps={formikProps}
        />
        <TextInputField
          name="encryptionKey"
          label={translate('text_17497253313741h3qgmvlmie')}
          placeholder={translate('text_1749725331374u9ahlz73aq1')}
          formikProps={formikProps}
        />
        <SwitchField
          name="production"
          label={translate('text_1749731835360j494r9wkd0k')}
          formikProps={formikProps}
        />
      </div>
    </Dialog>
  )
})

AddFlutterwaveDialog.displayName = 'AddFlutterwaveDialog'
