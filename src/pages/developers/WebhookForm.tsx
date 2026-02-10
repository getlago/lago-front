import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { object, string } from 'yup'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { RadioField, TextInput } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import {
  LagoApiError,
  useCreateWebhookEndpointMutation,
  useGetWebhookToEditQuery,
  useUpdateWebhookEndpointMutation,
  WebhookEndpointCreateInput,
  WebhookEndpointSignatureAlgoEnum,
  WebhookEndpointUpdateInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  query getWebhookToEdit($webhookId: ID!) {
    webhookEndpoint(id: $webhookId) {
      id
      name
      webhookUrl
      signatureAlgo
    }
  }

  mutation createWebhookEndpoint($input: WebhookEndpointCreateInput!) {
    createWebhookEndpoint(input: $input) {
      id
      name
      webhookUrl
      signatureAlgo
    }
  }

  mutation updateWebhookEndpoint($input: WebhookEndpointUpdateInput!) {
    updateWebhookEndpoint(input: $input) {
      id
      name
      webhookUrl
      signatureAlgo
    }
  }
`

type WebhookFormValues = {
  name?: string
  webhookUrl: string
  signatureAlgo: WebhookEndpointSignatureAlgoEnum
}

const WebhookForm = () => {
  const devtool = useDeveloperTool()
  const { webhookId = '' } = useParams()
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const [mutationError, setMutationError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (devtool.panelOpen) {
      devtool.closePanel()
    }
  }, [devtool])

  const { data: webhookData, loading: webhookLoading } = useGetWebhookToEditQuery({
    variables: {
      webhookId,
    },
    skip: !webhookId,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const onClose = () => {
    goBack(HOME_ROUTE)
    devtool.openPanel()
  }

  const [createWebhook] = useCreateWebhookEndpointMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const [updateWebhook] = useUpdateWebhookEndpointMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const isEdition = !!webhookId
  const webhook = webhookData?.webhookEndpoint

  const formikProps = useFormik<WebhookFormValues>({
    initialValues: {
      name: webhook?.name || '',
      webhookUrl: webhook?.webhookUrl || '',
      signatureAlgo: webhook?.signatureAlgo || WebhookEndpointSignatureAlgoEnum.Hmac,
    },
    validateOnMount: true,
    enableReinitialize: true,
    validationSchema: object().shape({
      webhookUrl: string().required(''),
      signatureAlgo: string().required(''),
    }),
    onSubmit: async (values) => {
      let res

      if (isEdition) {
        res = await updateWebhook({
          variables: {
            input: {
              id: webhookId,
              ...values,
            } as WebhookEndpointUpdateInput,
          },
        })
      } else {
        res = await createWebhook({
          variables: {
            input: values as WebhookEndpointCreateInput,
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
            isEdition ? 'text_64d23b49d481ab00681c22ab' : 'text_6271200984178801ba8bdf7f',
          ),
          severity: 'success',
        })

        onClose()
      }
    },
  })

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        {webhookLoading ? (
          <Skeleton className="w-50" variant="text" />
        ) : (
          <>
            <Typography variant="bodyHl" color="grey700" noWrap>
              {translate(
                isEdition ? 'text_64d23a81a7d807f8aa570509' : 'text_6271200984178801ba8bdec0',
              )}
            </Typography>
            <Button variant="quaternary" icon="close" onClick={onClose} />
          </>
        )}
      </CenteredPage.Header>

      <CenteredPage.Container>
        {webhookLoading ? (
          <FormLoadingSkeleton id="webhook" />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="grey700">
                {translate(
                  isEdition ? 'text_64d23a81a7d807f8aa570509' : 'text_6271200984178801ba8bdec0',
                )}
              </Typography>
              <Typography variant="body" color="grey600">
                {translate(
                  isEdition ? 'text_64d23a81a7d807f8aa57050b' : 'text_6271200984178801ba8bdee6',
                )}
              </Typography>
            </div>

            <PageSectionTitle
              title={translate('text_17707227517604nyis2xn00d')}
              subtitle={translate(
                isEdition ? 'text_1770722751760qclc7dc4kvd' : 'text_17707227517607yom6ypgxoc',
              )}
            />

            <div className="flex flex-col gap-6 pb-12">
              <TextInput
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                name="name"
                label={translate('text_1770723024044vvqxr476mvd')}
                placeholder={translate('text_1770723024044wi5tokoswxl')}
                value={formikProps.values.name || ''}
                onChange={(value) => formikProps.setFieldValue('name', value)}
              />

              <TextInput
                name="webhookUrl"
                label={translate('text_6271200984178801ba8bdf22')}
                placeholder={translate('text_6271200984178801ba8bdf36')}
                value={formikProps.values.webhookUrl}
                error={mutationError}
                onChange={(value) => {
                  if (mutationError) {
                    setMutationError(undefined)
                  }
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
                  value={WebhookEndpointSignatureAlgoEnum.Hmac}
                  label={translate('text_64d23a81a7d807f8aa570519')}
                  sublabel={translate('text_64d23a81a7d807f8aa57051b')}
                />
                <RadioField
                  name="signatureAlgo"
                  formikProps={formikProps}
                  value={WebhookEndpointSignatureAlgoEnum.Jwt}
                  label={translate('text_64d23a81a7d807f8aa570515')}
                  sublabel={translate('text_64d23a81a7d807f8aa570517')}
                />
              </div>
            </div>
          </>
        )}
      </CenteredPage.Container>

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" onClick={onClose}>
          {translate('text_6271200984178801ba8bdf4a')}
        </Button>
        <Button
          variant="primary"
          onClick={formikProps.submitForm}
          disabled={!formikProps.isValid || !formikProps.dirty || !!mutationError}
        >
          {translate(isEdition ? 'text_64d23a81a7d807f8aa57051f' : 'text_6271200984178801ba8bdf5e')}
        </Button>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default WebhookForm
