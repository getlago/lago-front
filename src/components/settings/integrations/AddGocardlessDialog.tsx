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
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { GOCARDLESS_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddGocardlessPaymentProviderInput,
  AddGocardlessProviderDialogFragment,
  GocardlessIntegrationDetailsFragmentDoc,
  LagoApiError,
  useGetProviderByCodeForGocardlessLazyQuery,
  useUpdateGocardlessApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { DeleteGocardlessIntegrationDialogRef } from './DeleteGocardlessIntegrationDialog'

gql`
  fragment AddGocardlessProviderDialog on GocardlessProvider {
    id
    name
    code
  }

  query getProviderByCodeForGocardless($code: String) {
    paymentProvider(code: $code) {
      ... on GocardlessProvider {
        id
      }
      ... on AdyenProvider {
        id
      }
      ... on StripeProvider {
        id
      }
    }
  }

  mutation updateGocardlessApiKey($input: UpdateGocardlessPaymentProviderInput!) {
    updateGocardlessPaymentProvider(input: $input) {
      id
      ...AddGocardlessProviderDialog
      ...GocardlessIntegrationDetails
    }
  }

  ${GocardlessIntegrationDetailsFragmentDoc}
`

type TAddGocardlessDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteGocardlessIntegrationDialogRef>
  provider: AddGocardlessProviderDialogFragment
  deleteDialogCallback: Function
}>

export interface AddGocardlessDialogRef {
  openDialog: (props?: TAddGocardlessDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddGocardlessDialog = forwardRef<AddGocardlessDialogRef>((_, ref) => {
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const { lagoOauthProxyUrl } = envGlobalVar()

  const { translate } = useInternationalization()
  const [localData, setLocalData] = useState<TAddGocardlessDialogProps | undefined>(undefined)
  const gocardlessProvider = localData?.provider
  const isEdition = !!gocardlessProvider

  const [updateApiKey] = useUpdateGocardlessApiKeyMutation({
    onCompleted({ updateGocardlessPaymentProvider }) {
      if (updateGocardlessPaymentProvider?.id) {
        navigate(
          generatePath(GOCARDLESS_INTEGRATION_DETAILS_ROUTE, {
            integrationId: updateGocardlessPaymentProvider.id,
          }),
        )

        addToast({
          message: translate(
            isEdition ? 'Edit gocardless success toast' : 'Add gocardless success toast',
          ),
          severity: 'success',
        })
      }
    },
  })

  const [getGocardlessProviderByCode] = useGetProviderByCodeForGocardlessLazyQuery()

  const formikProps = useFormik<AddGocardlessPaymentProviderInput>({
    initialValues: {
      code: gocardlessProvider?.code || '',
      name: gocardlessProvider?.name || '',
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
    }),
    onSubmit: async (values, formikBag) => {
      const res = await getGocardlessProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== gocardlessProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: { ...values, id: gocardlessProvider?.id || '' },
          },
        })

        dialogRef.current?.closeDialog()
      } else {
        window.open(
          `${lagoOauthProxyUrl}/gocardless/auth?lago_name=${values.name}&lago_code=${values.code}`,
        )
        dialogRef.current?.closeDialog()
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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1f9',
        {
          name: gocardlessProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_658461066530343fe1808cdd' : 'text_658466afe6140b469140e1fb',
      )}
      onClose={() => {
        formikProps.resetForm()
      }}
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
                  provider: gocardlessProvider,
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
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_658466afe6140b469140e207',
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

AddGocardlessDialog.displayName = 'AddGocardlessDialog'
