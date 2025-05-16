import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { WEBHOOK_ROUTE } from '~/components/developers/DevtoolsRouter'
import { RadioField, TextInput } from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
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
    undefined,
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
            isEdit ? 'text_64d23b49d481ab00681c22ab' : 'text_6271200984178801ba8bdf7f',
          ),
          severity: 'success',
        })

        if (!isEdit) {
          navigate(
            generatePath(WEBHOOK_ROUTE, {
              webhookId: (res?.data as CreateWebhookEndpointMutation)?.createWebhookEndpoint
                ?.id as string,
            }),
          )
        }
        dialogRef.current?.closeDialog()
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
        isEdit ? 'text_64d23a81a7d807f8aa57050b' : 'text_6271200984178801ba8bdee6',
      )}
      onClose={() => {
        !!mutationError && setMutationError(undefined)
        setLocalWebhook(undefined)
        formikProps.resetForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_6271200984178801ba8bdf4a')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty || !!mutationError}
            onClick={formikProps.submitForm}
          >
            {translate(isEdit ? 'text_64d23a81a7d807f8aa57051f' : 'text_6271200984178801ba8bdf5e')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
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
          <Typography className="mb-1" variant="captionHl" color="grey700">
            {translate('text_64d23a81a7d807f8aa570513')}
          </Typography>
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
      </div>
    </Dialog>
  )
})

CreateWebhookDialog.displayName = 'forwardRef'
