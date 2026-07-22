import { gql, useApolloClient } from '@apollo/client'
import { captureException } from '@sentry/react'
import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { AVALARA_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddAvalaraIntegrationDialogFragment,
  AvalaraIntegrationDetailsFragmentDoc,
  GetAvalaraIntegrationsListDocument,
  LagoApiError,
  useCreateAvalaraIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateAvalaraIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AvalaraIntegrationDetailsTabs } from '~/pages/settings/AvalaraIntegrationDetails'

gql`
  fragment AddAvalaraIntegrationDialog on AvalaraIntegration {
    id
    accountId
    code
    companyCode
    licenseKey
    name
  }

  mutation createAvalaraIntegration($input: CreateAvalaraIntegrationInput!) {
    createAvalaraIntegration(input: $input) {
      ...AddAvalaraIntegrationDialog
      ...AvalaraIntegrationDetails
    }
  }

  mutation updateAvalaraIntegration($input: UpdateAvalaraIntegrationInput!) {
    updateAvalaraIntegration(input: $input) {
      id
      ...AddAvalaraIntegrationDialog
      ...AvalaraIntegrationDetails
    }
  }

  ${AvalaraIntegrationDetailsFragmentDoc}
`

const ADD_AVALARA_FORM_ID = 'form-add-avalara-integration'

type OpenAddAvalaraDialogData = {
  integration?: AddAvalaraIntegrationDialogFragment
  deleteDialogCallback?: () => void
}

type AvalaraFormValues = {
  accountId: string
  code: string
  companyCode: string
  licenseKey: string
  name: string
}

const defaultFormValues: AvalaraFormValues = {
  accountId: '',
  code: '',
  companyCode: '',
  licenseKey: '',
  name: '',
}

const validationSchema = z.object({
  accountId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  companyCode: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  licenseKey: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})

type NangoErrorHandle = {
  setShow: (show: boolean) => void
}

const NangoErrorAlert = forwardRef<NangoErrorHandle>((_, ref) => {
  const [show, setShow] = useState(false)
  const { translate } = useInternationalization()

  useImperativeHandle(ref, () => ({ setShow }), [])

  if (!show) return null

  return <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
})

NangoErrorAlert.displayName = 'NangoErrorAlert'

export const useAddAvalaraDialog = () => {
  const componentId = useId()
  const navigate = useNavigate()
  const client = useApolloClient()
  const { nangoPublicKey } = envGlobalVar()
  const { translate } = useInternationalization()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()

  const dataRef = useRef<OpenAddAvalaraDialogData | null>(null)
  const successRef = useRef(false)
  const nangoErrorRef = useRef<NangoErrorHandle | null>(null)

  const [addAvalara] = useCreateAvalaraIntegrationMutation({
    onCompleted({ createAvalaraIntegration }) {
      if (createAvalaraIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(AVALARA_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createAvalaraIntegration.id,
            tab: AvalaraIntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_1744293680332cq4cd1dpiu6'),
          severity: 'success',
        })
      }
    },
  })

  const [updateAvalara] = useUpdateAvalaraIntegrationMutation({
    onCompleted({ updateAvalaraIntegration }) {
      if (updateAvalaraIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_1744293680332firnbl6qch5'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteAvalara] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      nangoErrorRef.current?.setShow(false)

      const integration = dataRef.current?.integration
      const isEdition = !!integration

      if (isEdition) {
        const res = await updateAvalara({
          variables: {
            input: {
              id: integration?.id || '',
              ...value,
            },
          },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', res.errors)) {
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
        }

        return
      }

      const { default: Nango, AuthError } = await import('@nangohq/frontend')
      const connectionId = `avalara-${componentId.replaceAll(':', '')}-${Date.now()}`
      const nango = new Nango({ publicKey: nangoPublicKey })

      try {
        const nangoApiKeyConnection = await nango.auth('avalara-sandbox', connectionId, {
          params: { avalaraClient: 'asd' },
          credentials: {
            username: value.accountId,
            password: value.licenseKey,
          },
        })

        const res = await addAvalara({
          variables: {
            input: {
              ...value,
              connectionId: nangoApiKeyConnection?.connectionId || '',
            },
          },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', res.errors)) {
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
        }
      } catch (error) {
        if (error instanceof AuthError) {
          nangoErrorRef.current?.setShow(true)
          return
        }

        captureException(error, {
          tags: {
            integration: 'avalara',
            action: 'create',
          },
          extra: {
            accountId: value.accountId,
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

  const openAddAvalaraDialog = (data?: OpenAddAvalaraDialogData) => {
    dataRef.current = data ?? null
    const integration = data?.integration
    const isEdition = !!integration

    form.reset()
    if (integration) {
      form.setFieldValue('accountId', integration.accountId || '')
      form.setFieldValue('code', integration.code || '')
      form.setFieldValue('companyCode', integration.companyCode || '')
      form.setFieldValue('licenseKey', integration.licenseKey || '')
      form.setFieldValue('name', integration.name || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_174429360927877m0kmo6gmm',
          {
            name: integration?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_17442936803327ymv9v7ecv0' : 'text_174429360927806xa8sxsreg',
        ),
        children: (
          <div className="flex flex-col gap-6 p-6">
            <NangoErrorAlert ref={nangoErrorRef} />

            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableAutoGenerateCode={isEdition}
              nameProps={{
                label: translate('text_6584550dc4cec7adf861504d'),
                placeholder: translate('text_6584550dc4cec7adf861504f'),
              }}
              codeProps={{
                label: translate('text_6584550dc4cec7adf8615051'),
                placeholder: translate('text_6584550dc4cec7adf8615053'),
              }}
            />

            <form.AppField name="accountId">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_1744293609278tzbixvdszc6')}
                  placeholder={translate('text_1744293635186p3wseb9b7hl')}
                />
              )}
            </form.AppField>

            <form.AppField name="licenseKey">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_1744293635187073v2g6xw0o')}
                  placeholder={translate('text_1744293635187idjlrbzbv21')}
                />
              )}
            </form.AppField>

            <form.AppField name="companyCode">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_1744293635187hxvz11n5bq3')}
                  placeholder={translate('text_1744293635187q00705sjtf8')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_174429360927877m0kmo6gmm',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_AVALARA_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition && !!data?.deleteDialogCallback,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: integration?.name }),
          description: translate('text_1744293719130klvtjda8wjz'),
          actionText: translate('text_645d071272418a14c1c76a81'),
          colorVariant: 'danger',
          onAction: async () => {
            const res = await deleteAvalara({
              variables: { input: { id: integration?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'AvalaraIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetAvalaraIntegrationsListDocument,
              })

              data?.deleteDialogCallback?.()

              addToast({
                message: translate('text_661ff6e56ef7e1b7c542b2f9'),
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
          nangoErrorRef.current?.setShow(false)
        }
      })
  }

  return { openAddAvalaraDialog }
}
