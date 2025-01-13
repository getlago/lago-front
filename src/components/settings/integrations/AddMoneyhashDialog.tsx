import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { MONEYHASH_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddMoneyhashPaymentProviderInput,
  AddMoneyhashProviderDialogFragment,
  LagoApiError,
  MoneyhashIntegrationDetailsFragmentDoc,
  useAddMoneyhashApiKeyMutation,
  useGetProviderByCodeForMoneyhashLazyQuery,
  useUpdateMoneyhashApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { DeleteMoneyhashIntegrationDialogRef } from './DeleteMoneyhashIntegrationDialog'

gql`
  fragment AddMoneyhashProviderDialog on MoneyhashProvider {
    id
    name
    code
    apiKey
  }
  query getProviderByCodeForMoneyhash($code: String) {
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
      ... on MoneyhashProvider {
        id
      }
    }
  }
  mutation addMoneyhashApiKey($input: AddMoneyhashPaymentProviderInput!) {
    addMoneyhashPaymentProvider(input: $input) {
      id
      ...AddMoneyhashProviderDialog
      ...MoneyhashIntegrationDetails
    }
  }
  mutation updateMoneyhashApiKey($input: UpdateMoneyhashPaymentProviderInput!) {
    updateMoneyhashPaymentProvider(input: $input) {
      id
      ...AddMoneyhashProviderDialog
      ...MoneyhashIntegrationDetails
    }
  }
  ${MoneyhashIntegrationDetailsFragmentDoc}
`

type TAddMoneyhashDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteMoneyhashIntegrationDialogRef>
  provider: AddMoneyhashProviderDialogFragment
  deleteDialogCallback: Function
}>

export interface AddMoneyhashDialogRef {
  openDialog: (props?: TAddMoneyhashDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddMoneyhashDialog = forwardRef<AddMoneyhashDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddMoneyhashDialogProps | undefined>(undefined)
  const moneyhashProvider = localData?.provider
  const isEdition = !!moneyhashProvider

  const [addApiKey] = useAddMoneyhashApiKeyMutation({
    onCompleted({ addMoneyhashPaymentProvider }) {
      if (addMoneyhashPaymentProvider?.id) {
        navigate(
          generatePath(MONEYHASH_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addMoneyhashPaymentProvider.id,
          }),
        )
        addToast({
          message: translate('text_1733730115018i122xlyi662'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateMoneyhashApiKeyMutation({
    onCompleted({ updateMoneyhashPaymentProvider }) {
      if (updateMoneyhashPaymentProvider?.id) {
        addToast({
          message: translate('text_17337300102103wt4s6yz2gh'),
          severity: 'success',
        })
      }
    },
  })

  const [getMoneyhashProviderByCode] = useGetProviderByCodeForMoneyhashLazyQuery()

  const formikProps = useFormik<AddMoneyhashPaymentProviderInput>({
    initialValues: {
      name: moneyhashProvider?.name || '',
      code: moneyhashProvider?.code || '',
      apiKey: moneyhashProvider?.apiKey || '',
      successRedirectUrl: moneyhashProvider?.successRedirectUrl || '',
      failedRedirectUrl: moneyhashProvider?.failedRedirectUrl || '',
      pendingRedirectUrl: moneyhashProvider?.pendingRedirectUrl || '',
      webhookRedirectUrl: moneyhashProvider?.webhookRedirectUrl || '',
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      apiKey: string(),
      successRedirectUrl: string(),
      failedRedirectUrl: string(),
      pendingRedirectUrl: string(),
      webhookRedirectUrl: string().required(''),
    }),
    onSubmit: async (
      {
        apiKey,
        successRedirectUrl,
        failedRedirectUrl,
        pendingRedirectUrl,
        webhookRedirectUrl,
        ...values
      },
      formikBag,
    ) => {
      const res = await getMoneyhashProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })

      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== moneyhashProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              ...values,
              id: moneyhashProvider?.id,
              successRedirectUrl,
              failedRedirectUrl,
              pendingRedirectUrl,
              webhookRedirectUrl,
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: {
              ...values,
              apiKey,
              successRedirectUrl,
              failedRedirectUrl,
              pendingRedirectUrl,
              webhookRedirectUrl,
            },
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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_1733489819311q0nzqi3u7wz',
        {
          name: moneyhashProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_17337299668343fncntgiyhf' : 'text_1733491430992msh3b2v8nlx',
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
                  provider: moneyhashProvider,
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
                isEdition ? 'text_1733729938415dtehv31k9in' : 'text_1733489819311q0nzqi3u7wz',
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
          name="successRedirectUrl"
          label={translate('text_1733729620554tspzhwa5d3t')}
          placeholder={translate('text_1733729622776cyub16g4it0')}
          formikProps={formikProps}
        />
        <TextInputField
          name="failedRedirectUrl"
          label={translate('text_1733729624253c5lsxyvwal7')}
          placeholder={translate('text_17337296256405ibboaa38oq')}
          formikProps={formikProps}
        />
        <TextInputField
          name="pendingRedirectUrl"
          label={translate('text_17337296266252mlh212u2wb')}
          placeholder={translate('text_173372962787260vsygacc1i')}
          formikProps={formikProps}
        />
        <TextInputField
          name="webhookRedirectUrl"
          label={translate('text_173372976803867ab7rn8nav')}
          placeholder={translate('text_1733729769074rmlw2o104ap')}
          formikProps={formikProps}
        />
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

AddMoneyhashDialog.displayName = 'AddMoneyhashDialog'
