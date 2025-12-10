import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import { object, string } from 'yup'
import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ADYEN_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddBraintreePaymentProviderInput,
  AddBraintreeProviderDialogFragment,
  BraintreeIntegrationDetailsFragmentDoc,
  LagoApiError,
  useGetProviderByCodeForBraintreeLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DeleteBraintreeIntegrationDialogRef } from './DeleteBraintreeIntegrationDialog'

gql `
  fragment AddBraintreeProviderDialog on BraintreeProvider {
    id
    name
    code
    publicKey
    privateKey
    merchantId
    successRedirectUrl
  }

  query getProviderByCodeForBraintree($code: String) {
    paymentProvider(code: $code) {
      ... on AdyenProvider {
        id
      }
      ... on BraintreeProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on FlutterwaveProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on StripeProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
    }
  }

  ${BraintreeIntegrationDetailsFragmentDoc}
`

type TAddBraintreeDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteBraintreeIntegrationDialogRef>
  provider: AddBraintreeProviderDialogFragment
  deleteDialogCallback: () => void
}>

export interface AddBraintreeDialogRef {
  openDialog: (props?: TAddBraintreeDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddBraintreeDialog = forwardRef<AddBraintreeDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddBraintreeDialogProps | undefined>(undefined)
  const braintreeProvider = localData?.provider
  const isEdition = !!braintreeProvider

  const [getBraintreeProviderByCode] = useGetProviderByCodeForBraintreeLazyQuery()

  const formikProps = useFormik<AddBraintreePaymentProviderInput>({
    initialValues: {
      name: braintreeProvider?.name || '',
      code: braintreeProvider?.code || '',
      publicKey: braintreeProvider?.publicKey || '',
      privateKey: braintreeProvider?.privateKey || '',
      merchantId: braintreeProvider?.merchantId || '',
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      publicKey: string().required(''),
      privateKey: string().required(),
      merchantId: string().required(''),
    }),
    onSubmit: async ({ publicKey, privateKey, merchantId, ...values }, formikBag) => {
      const res = await getBraintreeProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== braintreeProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }
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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1fa',
        {
          name: braintreeProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_65846a0ed9fdbd46c4afc42d' : 'text_658466afe6140b469140e1fc',
      )}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width={isEdition ? '100%' : 'inherit'}
          spacing={3}
        >
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: braintreeProvider,
                  callback: localData.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_645d071272418a14c1c76a67' : 'text_645d071272418a14c1c76ad8',
              )}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-row items-start gap-6">
          <TextInputField
            className="flex-1"
            // eslint-disable-next-line jsx-ally/no-autofocus
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
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a77')}
          placeholder={translate('text_645d071272418a14c1c76a83')}
          formikProps={formikProps}
        />
        <TextInputField
          name="privateKey"
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a77')}
          placeholder={translate('text_645d071272418a14c1c76a83')}
          formikProps={formikProps}
        />
        <TextInputField
          name="merchantId"
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a77')}
          placeholder={translate('text_645d071272418a14c1c76a83')}
          formikProps={formikProps}
        />
      </div>
    </Dialog>
  )
})

AddBraintreeDialog.displayName = 'AddBraintreeDialog'