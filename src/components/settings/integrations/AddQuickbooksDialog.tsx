import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useId, useRef } from 'react'
import { generatePath } from 'react-router'
import { z } from 'zod'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { Checkbox } from '~/components/form'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { QUICKBOOKS_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  GetQuickbooksIntegrationsListDocument,
  QuickbooksForCreateDialogFragment,
  useCreateQuickbooksIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateQuickbooksIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { QuickbooksIntegrationDetailsTabs } from '~/pages/settings/QuickbooksIntegrationDetails'

import { getQuickbooksNangoIntegrationKey } from './getQuickbooksNangoIntegrationKey'

gql`
  fragment QuickbooksForCreateDialog on QuickbooksIntegration {
    id
    code
    connectionId
    name
    sandbox
    syncCreditNotes
    syncInvoices
    syncPayments
  }

  mutation createQuickbooksIntegration($input: CreateQuickbooksIntegrationInput!) {
    createQuickbooksIntegration(input: $input) {
      ...QuickbooksForCreateDialog
    }
  }

  mutation updateQuickbooksIntegration($input: UpdateQuickbooksIntegrationInput!) {
    updateQuickbooksIntegration(input: $input) {
      ...QuickbooksForCreateDialog
    }
  }
`

const ADD_QUICKBOOKS_FORM_ID = 'form-add-quickbooks-integration'

type AddQuickbooksFormValues = {
  name: string
  code: string
  sandbox: boolean
  syncCreditNotes: boolean
  syncInvoices: boolean
  syncPayments: boolean
}

const defaultFormValues: AddQuickbooksFormValues = {
  name: '',
  code: '',
  sandbox: false,
  syncCreditNotes: false,
  syncInvoices: false,
  syncPayments: false,
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  sandbox: z.boolean(),
  syncCreditNotes: z.boolean(),
  syncInvoices: z.boolean(),
  syncPayments: z.boolean(),
})

type OpenAddQuickbooksDialogData = {
  provider?: QuickbooksForCreateDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddQuickbooksDialog = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddQuickbooksDialogData | null>(null)
  const successRef = useRef(false)

  const [createIntegration] = useCreateQuickbooksIntegrationMutation({
    onCompleted({ createQuickbooksIntegration }) {
      if (createQuickbooksIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(QUICKBOOKS_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createQuickbooksIntegration.id,
            tab: QuickbooksIntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_1795434241689i332rrnawy2'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getQuickbooksIntegrationsList'],
  })

  const [updateIntegration] = useUpdateQuickbooksIntegrationMutation({
    onCompleted({ updateQuickbooksIntegration }) {
      if (updateQuickbooksIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_179543424168985ec3qr2vtt'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteQuickbooks] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const quickbooksProvider = dataRef.current?.provider
      const isEdition = !!quickbooksProvider

      const handleError = (errors: readonly GraphQLFormattedError[]) => {
        if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
          applyExistingCodeError(formApi)

          const modalContainer = document.getElementsByClassName('MuiDialog-container')[0]

          if (modalContainer) {
            modalContainer.scrollTo({ top: 0 })
          }
        }
      }

      if (isEdition) {
        const res = await updateIntegration({
          variables: {
            input: {
              id: quickbooksProvider?.id || '',
              name: value.name,
              code: value.code,
              syncCreditNotes: value.syncCreditNotes,
              syncInvoices: value.syncInvoices,
              syncPayments: value.syncPayments,
            },
          },
        })

        if (res.errors) {
          handleError(res.errors)
        }
      } else {
        const connectionId = `quickbooks-${componentId.replaceAll(':', '')}-${Date.now()}`
        const Nango = (await import('@nangohq/frontend')).default
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoAuthResult = await nango.auth(
            getQuickbooksNangoIntegrationKey(value.sandbox),
            connectionId,
          )

          if (!!nangoAuthResult) {
            const res = await createIntegration({
              variables: {
                input: { ...value, connectionId },
              },
            })

            if (res.errors) {
              handleError(res.errors)
            }
          }
        } catch {
          addToast({ severity: 'danger', translateKey: 'text_1749562792335fy21gc3sxn0' })
        }
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

  const openAddQuickbooksDialog = (data?: OpenAddQuickbooksDialogData) => {
    dataRef.current = data ?? null
    const quickbooksProvider = data?.provider
    const isEdition = !!quickbooksProvider

    form.reset()
    if (quickbooksProvider) {
      form.setFieldValue('name', quickbooksProvider.name || '')
      form.setFieldValue('code', quickbooksProvider.code || '')
      form.setFieldValue('sandbox', !!quickbooksProvider.sandbox)
      form.setFieldValue('syncCreditNotes', !!quickbooksProvider.syncCreditNotes)
      form.setFieldValue('syncInvoices', !!quickbooksProvider.syncInvoices)
      form.setFieldValue('syncPayments', !!quickbooksProvider.syncPayments)
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_1795434241689x8rpnkscqwf',
          {
            name: quickbooksProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_1795434241689zt7omfc8e2q' : 'text_17954342416896zjyvneqtih',
        ),
        children: (
          <div className="flex flex-col gap-8 p-8">
            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableAutoGenerateCode={isEdition}
              nameProps={{
                label: translate('text_6419c64eace749372fc72b0f'),
                placeholder: translate('text_6584550dc4cec7adf861504f'),
              }}
              codeProps={{
                label: translate('text_62876e85e32e0300e1803127'),
                placeholder: translate('text_6584550dc4cec7adf8615053'),
              }}
            />

            <form.AppField name="sandbox">
              {(field) => (
                <field.SwitchField
                  disabled={isEdition}
                  label={translate('text_1795434241689f1hpeds18j4')}
                  subLabel={translate('text_1795434241689jpvife1j8z1')}
                />
              )}
            </form.AppField>

            <div className="flex flex-col gap-6">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_1795434241689erqzal40vl2')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_661ff6e56ef7e1b7c542b28e')}
                </Typography>
              </div>

              <div className="flex flex-col gap-4">
                <Checkbox
                  disabled
                  label={
                    <QuickbooksSyncLabel
                      firstPart={translate('text_17954342416897g8is3qrydn')}
                      code={translate('text_661ff6e56ef7e1b7c542b2a6')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <Checkbox
                  disabled
                  label={
                    <QuickbooksSyncLabel
                      firstPart={translate('text_17954342416897g8is3qrydn')}
                      code={translate('text_661ff6e56ef7e1b7c542b2c2')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <Checkbox
                  disabled
                  label={
                    <QuickbooksSyncLabel
                      firstPart={translate('text_17954342416897g8is3qrydn')}
                      code={translate('text_661ff6e56ef7e1b7c542b2d7')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <form.AppField name="syncCreditNotes">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <QuickbooksSyncLabel
                          firstPart={translate('text_17954342416897g8is3qrydn')}
                          code={translate('text_661ff6e56ef7e1b7c542b2e9')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="syncInvoices">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <QuickbooksSyncLabel
                          firstPart={translate('text_17954342416897g8is3qrydn')}
                          code={translate('text_661ff6e56ef7e1b7c542b2ff')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="syncPayments">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <QuickbooksSyncLabel
                          firstPart={translate('text_17954342416897g8is3qrydn')}
                          code={translate('text_661ff6e56ef7e1b7c542b311')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
              </div>
            </div>
          </div>
        ),
        closeOnError: false,
        onEntered: isEdition ? undefined : focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1795434241689x8rpnkscqwf',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_QUICKBOOKS_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: quickbooksProvider?.name }),
          description: translate('text_1795434241689o9cv2tkoxb2'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          closeOnError: false,
          onError: () => {
            addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
          },
          onAction: async () => {
            const res = await deleteQuickbooks({
              variables: { input: { id: quickbooksProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'QuickbooksIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetQuickbooksIntegrationsListDocument,
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
        }
      })
  }

  return { openAddQuickbooksDialog }
}

const QuickbooksSyncLabel = ({
  firstPart,
  code,
  lastPart,
}: {
  firstPart: string
  code: string
  lastPart: string
}) => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1">
      <Typography variant="body" color="grey700">
        {firstPart}
      </Typography>
      <Chip size="small" label={code} color="danger600" />
      <Typography variant="body" color="grey700">
        {lastPart}
      </Typography>
    </div>
  )
}
