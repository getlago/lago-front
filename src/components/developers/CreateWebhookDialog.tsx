import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { RadioField, TextInput } from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'
import {
  CreateWebhookEndpointMutation,
  LagoApiError,
  useCreateWebhookEndpointMutation,
  useUpdateWebhookEndpointMutation,
  WebhookEndpointCreateInput,
  WebhookEndpointSignatureAlgoEnum,
  WebhookEndpointUpdateInput,
  WebhookForCreateAndEditFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment WebhookForCreateAndEdit on WebhookEndpoint {
    id
    webhookUrl
    signatureAlgo
  }

  mutation createWebhookEndpoint($input: WebhookEndpointCreateInput!) {
    createWebhookEndpoint(input: $input) {
      id
      ...WebhookForCreateAndEdit
    }
  }

  mutation updateWebhookEndpoint($input: WebhookEndpointUpdateInput!) {
    updateWebhookEndpoint(input: $input) {
      id
      ...WebhookForCreateAndEdit
    }
  }
`
export interface CreateWebhookDialogRef {
  openDialog: (webhook?: WebhookForCreateAndEditFragment) => unknown
  closeDialog: () => unknown
}

export const CreateWebhookDialog = forwardRef<CreateWebhookDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const navigate = useNavigate()
  const [mutationError, setMutationError] = useState<string | undefined>(undefined)
  const [localWebhook, setLocalWebhook] = useState<WebhookForCreateAndEditFragment | undefined>(
    undefined
  )
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [createWebhook] = useCreateWebhookEndpointMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })
  const [updateWebhook] = useUpdateWebhookEndpointMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const formikProps = useFormik<WebhookEndpointCreateInput | WebhookEndpointUpdateInput>({
    initialValues: {
      signatureAlgo: localWebhook?.signatureAlgo || WebhookEndpointSignatureAlgoEnum.Jwt,
      webhookUrl: localWebhook?.webhookUrl || '',
    },
    validateOnMount: true,
    enableReinitialize: true,
    validationSchema: object().shape({
      signatureAlgo: string().required(''),
      webhookUrl: string().required(''),
    }),

    onSubmit: async (values) => {
      let res

      if (isEdit) {
        res = await updateWebhook({
          variables: {
            input: {
              id: localWebhook?.id as string,
              ...values,
            },
          },
        })
      } else {
        res = await createWebhook({
          variables: {
            input: {
              ...values,
            },
          },
        })
      }

      const { errors } = res

      if (hasDefinedGQLError('UrlIsInvalid', errors)) {
        setMutationError(translate('text_6271200984178801ba8bdf58'))
      } else if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        setMutationError(translate('text_649453975a0bb300724162f6'))
      } else if (!errors) {
        addToast({
          message: translate(
            isEdit ? 'text_64d23b49d481ab00681c22ab' : 'text_6271200984178801ba8bdf7f'
          ),
          severity: 'success',
        })

        if (!isEdit) {
          navigate(
            generatePath(WEBHOOK_LOGS_ROUTE, {
              webhookId: (res?.data as CreateWebhookEndpointMutation)?.createWebhookEndpoint?.id,
            })
          )
        }
        dialogRef.current?.closeDialog()
        setMutationError(undefined)
      }
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      formikProps.resetForm()
      setLocalWebhook(data)
      setIsEdit(!!data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(isEdit ? 'text_64d23a81a7d807f8aa570509' : 'text_6271200984178801ba8bdec0')}
      description={translate(
        isEdit ? 'text_64d23a81a7d807f8aa57050b' : 'text_6271200984178801ba8bdee6'
      )}
      onClickAway={() => {
        !!mutationError && setMutationError(undefined)
        setLocalWebhook(undefined)
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              !!mutationError && setMutationError(undefined)
              setLocalWebhook(undefined)
              formikProps.resetForm()
            }}
          >
            {translate('text_6271200984178801ba8bdf4a')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty || !!mutationError}
            onClick={async () => {
              await formikProps.submitForm()
            }}
          >
            {translate(isEdit ? 'text_64d23a81a7d807f8aa57051f' : 'text_6271200984178801ba8bdf5e')}
          </Button>
        </>
      )}
    >
      <Content>
        <TextInput
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          label={translate('text_6271200984178801ba8bdf22')}
          placeholder={translate('text_6271200984178801ba8bdf36')}
          value={localWebhook?.webhookUrl}
          error={mutationError}
          onChange={(value) => {
            !!mutationError && setMutationError(undefined)
            formikProps.setFieldValue('webhookUrl', value)
          }}
          helperText={
            <Typography
              variant="caption"
              color="inherit"
              html={translate('text_62ce85fb3fb6842020331d83')}
            />
          }
        />

        <div>
          <WebhookSignatureLabel variant="captionHl" color="grey700">
            {translate('text_64d23a81a7d807f8aa570513')}
          </WebhookSignatureLabel>
          <RadioField
            name="signatureAlgo"
            formikProps={formikProps}
            value={WebhookEndpointSignatureAlgoEnum.Jwt}
            label={translate('text_64d23a81a7d807f8aa570515')}
            sublabel={translate('text_64d23a81a7d807f8aa570517')}
          />
          <RadioField
            name="signatureAlgo"
            formikProps={formikProps}
            value={WebhookEndpointSignatureAlgoEnum.Hmac}
            label={translate('text_64d23a81a7d807f8aa570519')}
            sublabel={translate('text_64d23a81a7d807f8aa57051b')}
          />
        </div>
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

const WebhookSignatureLabel = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

CreateWebhookDialog.displayName = 'forwardRef'
