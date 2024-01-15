import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { ADYEN_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddAdyenPaymentProviderInput,
  AddAdyenProviderDialogFragment,
  AdyenIntegrationDetailsFragmentDoc,
  LagoApiError,
  useAddAdyenApiKeyMutation,
  useGetProviderByCodeForAdyenLazyQuery,
  useUpdateAdyenApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { DeleteAdyenIntegrationDialogRef } from './DeleteAdyenIntegrationDialog'

gql`
  fragment AddAdyenProviderDialog on AdyenProvider {
    id
    name
    code
    apiKey
    hmacKey
    livePrefix
    merchantAccount
  }

  query getProviderByCodeForAdyen($code: String) {
    paymentProvider(code: $code) {
      ... on AdyenProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on StripeProvider {
        id
      }
    }
  }

  mutation addAdyenApiKey($input: AddAdyenPaymentProviderInput!) {
    addAdyenPaymentProvider(input: $input) {
      id

      ...AddAdyenProviderDialog
      ...AdyenIntegrationDetails
    }
  }

  mutation updateAdyenApiKey($input: UpdateAdyenPaymentProviderInput!) {
    updateAdyenPaymentProvider(input: $input) {
      id

      ...AddAdyenProviderDialog
      ...AdyenIntegrationDetails
    }
  }

  ${AdyenIntegrationDetailsFragmentDoc}
`

type TAddAdyenDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteAdyenIntegrationDialogRef>
  provider: AddAdyenProviderDialogFragment
  deleteDialogCallback: Function
}>

export interface AddAdyenDialogRef {
  openDialog: (props?: TAddAdyenDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddAdyenDialog = forwardRef<AddAdyenDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddAdyenDialogProps | undefined>(undefined)
  const adyenProvider = localData?.provider
  const isEdition = !!adyenProvider

  const [addApiKey] = useAddAdyenApiKeyMutation({
    onCompleted({ addAdyenPaymentProvider }) {
      if (addAdyenPaymentProvider?.id) {
        navigate(
          generatePath(ADYEN_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addAdyenPaymentProvider.id,
          }),
        )

        addToast({
          message: translate('text_645d071272418a14c1c76a93'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateAdyenApiKeyMutation({
    onCompleted({ updateAdyenPaymentProvider }) {
      if (updateAdyenPaymentProvider?.id) {
        addToast({
          message: translate('text_645d071272418a14c1c76a3e'),
          severity: 'success',
        })
      }
    },
  })

  const [getAdyenProviderByCode] = useGetProviderByCodeForAdyenLazyQuery()

  const formikProps = useFormik<AddAdyenPaymentProviderInput>({
    initialValues: {
      name: adyenProvider?.name || '',
      code: adyenProvider?.code || '',
      apiKey: adyenProvider?.apiKey || '',
      hmacKey: adyenProvider?.hmacKey || undefined,
      livePrefix: adyenProvider?.livePrefix || undefined,
      merchantAccount: adyenProvider?.merchantAccount || '',
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      apiKey: string().required(''),
      hmacKey: string(),
      livePrefix: string(),
      merchantAccount: string().required(''),
    }),
    onSubmit: async ({ apiKey, merchantAccount, hmacKey, livePrefix, ...values }, formikBag) => {
      const res = await getAdyenProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== adyenProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              ...values,
              id: adyenProvider?.id || '',
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: { ...values, apiKey, merchantAccount, hmacKey, livePrefix },
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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1fa',
        {
          name: adyenProvider?.name,
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
                  provider: adyenProvider,
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
      <Content>
        <InlineInputs>
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </InlineInputs>

        <TextInputField
          name="apiKey"
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a77')}
          placeholder={translate('text_645d071272418a14c1c76a83')}
          formikProps={formikProps}
        />
        <TextInputField
          name="merchantAccount"
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a8f')}
          placeholder={translate('text_645d071272418a14c1c76a9c')}
          formikProps={formikProps}
        />
        {(!isEdition || !!adyenProvider.livePrefix) && (
          <TextInputField
            name="livePrefix"
            disabled={isEdition}
            label={translate('text_645d071272418a14c1c76aa6')}
            placeholder={translate('text_645d071272418a14c1c76ab0')}
            formikProps={formikProps}
          />
        )}
        {(!isEdition || !!adyenProvider.hmacKey) && (
          <TextInputField
            name="hmacKey"
            disabled={isEdition}
            label={translate('text_645d071272418a14c1c76aba')}
            placeholder={translate('text_645d071272418a14c1c76ac4')}
            formikProps={formikProps}
          />
        )}
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineInputs = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing(6)};

  > * {
    flex: 1;
  }
`

AddAdyenDialog.displayName = 'AddAdyenDialog'
