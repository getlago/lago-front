import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { MONEYHASH_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddMoneyhashPaymentProviderInput,
  AddMoneyhashProviderDialogFragment,
  GetMoneyhashIntegrationsListDocument,
  LagoApiError,
  MoneyhashIntegrationDetailsFragmentDoc,
  useAddMoneyhashApiKeyMutation,
  useDeleteMoneyhashIntegrationMutation,
  useGetProviderByCodeForMoneyhashLazyQuery,
  useUpdateMoneyhashApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddMoneyhashProviderDialog on MoneyhashProvider {
    id
    name
    code
    apiKey
    flowId
  }
  query getProviderByCodeForMoneyhash($code: String) {
    paymentProvider(code: $code) {
      ... on AdyenProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on FlutterwaveProvider {
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

const ADD_MONEYHASH_FORM_ID = 'form-add-moneyhash-integration'

type OpenAddMoneyhashDialogData = {
  provider?: AddMoneyhashProviderDialogFragment
  deleteDialogCallback?: () => void
}

const defaultFormValues: AddMoneyhashPaymentProviderInput = {
  name: '',
  code: '',
  apiKey: '',
  flowId: '',
}

const validationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  apiKey: z.string().min(1),
  flowId: z.string().min(1),
})

export const useAddMoneyhashDialog = () => {
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddMoneyhashDialogData | null>(null)
  const successRef = useRef(false)

  const [addApiKey] = useAddMoneyhashApiKeyMutation({
    onCompleted({ addMoneyhashPaymentProvider }) {
      if (addMoneyhashPaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(MONEYHASH_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addMoneyhashPaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
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
        successRef.current = true
        addToast({
          message: translate('text_17337300102103wt4s6yz2gh'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteMoneyhash] = useDeleteMoneyhashIntegrationMutation()

  const [getMoneyhashProviderByCode] = useGetProviderByCodeForMoneyhashLazyQuery()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const provider = dataRef.current?.provider
      const isEdition = !!provider

      const res = await getMoneyhashProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: value.code,
        },
      })

      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== provider?.id)

      if (isNotAllowedToMutate) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              code: {
                message: translate('text_632a2d437e341dcc76817556'),
                path: ['code'],
              },
            },
          },
        })
        return
      }

      const { apiKey, flowId, name, code } = value

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              id: provider.id,
              name,
              code,
              flowId,
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: {
              name,
              code,
              apiKey,
              flowId,
            },
          },
        })
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openAddMoneyhashDialog = (data?: OpenAddMoneyhashDialogData) => {
    dataRef.current = data ?? null
    const provider = data?.provider
    const isEdition = !!provider

    form.reset()
    if (provider) {
      form.setFieldValue('name', provider.name || '')
      form.setFieldValue('code', provider.code || '')
      form.setFieldValue('apiKey', provider.apiKey || '')
      form.setFieldValue('flowId', provider.flowId || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_1733489819311q0nzqi3u7wz',
          {
            name: provider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_17337299668343fncntgiyhf' : 'text_1733491430992msh3b2v8nlx',
        ),
        children: (
          <div className="flex flex-col gap-6 p-8">
            <div className="flex items-start gap-6">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    className="flex-1"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    label={translate('text_6584550dc4cec7adf861504d')}
                    placeholder={translate('text_6584550dc4cec7adf861504f')}
                  />
                )}
              </form.AppField>
              <form.AppField name="code">
                {(field) => (
                  <field.TextInputField
                    className="flex-1"
                    label={translate('text_6584550dc4cec7adf8615051')}
                    placeholder={translate('text_6584550dc4cec7adf8615053')}
                  />
                )}
              </form.AppField>
            </div>
            <form.AppField name="apiKey">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_645d071272418a14c1c76a77')}
                  placeholder={translate('text_645d071272418a14c1c76a83')}
                />
              )}
            </form.AppField>
            <form.AppField name="flowId">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1737453888927uw38sepj7xy')}
                  placeholder={translate('text_1737453902655bnm8uycr7o7')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_1733729938415dtehv31k9in' : 'text_1733489819311q0nzqi3u7wz',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_MONEYHASH_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: provider?.name }),
          description: translate('text_658461066530343fe1808cc2'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const res = await deleteMoneyhash({
              variables: { input: { id: provider?.id as string } },
            })

            const destroyedId = res.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'MoneyhashProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetMoneyhashIntegrationsListDocument,
              })

              data?.deleteDialogCallback?.()

              addToast({
                message: translate('text_1737463302046fgixue5wtvu'),
                severity: 'success',
              })
            }
          },
        },
      })
      .then((response) => {
        if (response.reason === 'close' || response.reason === 'open-other-dialog') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openAddMoneyhashDialog }
}
