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
import { STRIPE_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddStripePaymentProviderInput,
  AddStripeProviderDialogFragment,
  LagoApiError,
  StripeIntegrationDetailsFragmentDoc,
  useAddStripeApiKeyMutation,
  useGetProviderByCodeForStripeLazyQuery,
  useUpdateStripeApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { DeleteStripeIntegrationDialogRef } from './DeleteStripeIntegrationDialog'

gql`
  fragment AddStripeProviderDialog on StripeProvider {
    id
    name
    code
    secretKey
  }

  query getProviderByCodeForStripe($code: String) {
    paymentProvider(code: $code) {
      ... on StripeProvider {
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
      ... on AdyenProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
    }
  }

  mutation addStripeApiKey($input: AddStripePaymentProviderInput!) {
    addStripePaymentProvider(input: $input) {
      id
      ...AddStripeProviderDialog
      ...StripeIntegrationDetails
    }
  }

  mutation updateStripeApiKey($input: UpdateStripePaymentProviderInput!) {
    updateStripePaymentProvider(input: $input) {
      id
      ...AddStripeProviderDialog
      ...StripeIntegrationDetails
    }
  }

  ${StripeIntegrationDetailsFragmentDoc}
`

type TAddStripeDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteStripeIntegrationDialogRef>
  provider: AddStripeProviderDialogFragment
  deleteDialogCallback: Function
}>

export interface AddStripeDialogRef {
  openDialog: (props?: TAddStripeDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddStripeDialog = forwardRef<AddStripeDialogRef>((_, ref) => {
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [localData, setLocalData] = useState<TAddStripeDialogProps | undefined>(undefined)
  const stripeProvider = localData?.provider
  const isEdition = !!stripeProvider

  const [addApiKey] = useAddStripeApiKeyMutation({
    onCompleted({ addStripePaymentProvider }) {
      if (addStripePaymentProvider?.id) {
        navigate(
          generatePath(STRIPE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addStripePaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_62b1edddbf5f461ab9712743'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateStripeApiKeyMutation({
    onCompleted({ updateStripePaymentProvider }) {
      if (updateStripePaymentProvider?.id) {
        addToast({
          message: translate('text_62b1edddbf5f461ab97126f6'),
          severity: 'success',
        })

        dialogRef.current?.closeDialog()
      }
    },
  })

  const [getStripeProviderByCode] = useGetProviderByCodeForStripeLazyQuery()

  const formikProps = useFormik<AddStripePaymentProviderInput>({
    initialValues: {
      secretKey: stripeProvider?.secretKey || '',
      code: stripeProvider?.code || '',
      name: stripeProvider?.name || '',
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      secretKey: string().required(''),
    }),
    onSubmit: async ({ secretKey, ...values }, formikBag) => {
      const res = await getStripeProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== stripeProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              id: stripeProvider?.id || '',
              ...values,
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: { secretKey, ...values },
          },
        })
      }

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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_6584550dc4cec7adf8615049',
        {
          name: stripeProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_6584697bc905b246e70e5528' : 'text_6584550dc4cec7adf861504b',
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
                  provider: stripeProvider,
                  callback: localData?.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_62b1edddbf5f461ab9712769' : 'text_62b1edddbf5f461ab9712773',
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
          name="secretKey"
          disabled={isEdition}
          label={translate('text_62b1edddbf5f461ab9712748')}
          placeholder={translate('text_62b1edddbf5f461ab9712756')}
          formikProps={formikProps}
        />
      </div>
    </Dialog>
  )
})

AddStripeDialog.displayName = 'AddStripeDialog'
