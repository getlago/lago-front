import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'
import { generatePath } from 'react-router'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { QUICKBOOKS_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  GetQuickbooksIntegrationsListDocument,
  LagoApiError,
  QuickbooksForCreateDialogFragment,
  useCreateQuickbooksIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateQuickbooksIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { QuickbooksIntegrationDetailsTabs } from '~/pages/settings/QuickbooksIntegrationDetails'

import {
  getDestroyedQuickbooksId,
  toastQuickbooksDeleteError,
} from './DeleteQuickbooksIntegrationDialog'
import {
  DEFAULT_QUICKBOOKS_FORM_VALUES,
  getQuickbooksFormValues,
  quickbooksFormValidationSchema,
} from './quickbooksIntegrationForm'
import { QuickbooksIntegrationFormContent } from './QuickbooksIntegrationFormContent'
import {
  getQuickbooksSubmitErrorOutcome,
  QUICKBOOKS_GENERIC_ERROR_KEY,
} from './quickbooksSubmitErrors'
import { useQuickbooksAuthorization } from './useQuickbooksAuthorization'

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

type OpenAddQuickbooksDialogData = {
  provider?: QuickbooksForCreateDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddQuickbooksDialog = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddQuickbooksDialogData | null>(null)
  const successRef = useRef(false)
  const quickbooksAuthorization = useQuickbooksAuthorization()

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
    defaultValues: DEFAULT_QUICKBOOKS_FORM_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: quickbooksFormValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const quickbooksProvider = dataRef.current?.provider
      const isEdition = !!quickbooksProvider

      const handleError = (errors: readonly GraphQLFormattedError[]) => {
        const { isCodeTaken, keepConnection, toastKey } = getQuickbooksSubmitErrorOutcome(errors)

        if (!keepConnection) quickbooksAuthorization.reset()
        if (toastKey) addToast({ severity: 'danger', translateKey: toastKey })
        if (!isCodeTaken) return

        applyExistingCodeError(formApi)
        document.getElementsByClassName('MuiDialog-container')[0]?.scrollTo({ top: 0 })
      }

      if (isEdition) {
        try {
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
            context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
          })

          if (res.errors) {
            handleError(res.errors)
          }
        } catch {
          addToast({ severity: 'danger', translateKey: QUICKBOOKS_GENERIC_ERROR_KEY })
        }

        return
      }

      const connectionId = await quickbooksAuthorization.authorize(value.sandbox)

      if (!connectionId) return

      try {
        const res = await createIntegration({
          variables: { input: { ...value, connectionId } },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })

        if (res.errors) {
          handleError(res.errors)
        }
      } catch {
        quickbooksAuthorization.reset()
        addToast({ severity: 'danger', translateKey: QUICKBOOKS_GENERIC_ERROR_KEY })
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
    quickbooksAuthorization.reset()
    dataRef.current = data ?? null
    const quickbooksProvider = data?.provider
    const isEdition = !!quickbooksProvider

    form.reset(getQuickbooksFormValues(quickbooksProvider))

    void formDialogOpeningDialog
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
        children: <QuickbooksIntegrationFormContent form={form} isEdition={isEdition} />,
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
          onError: toastQuickbooksDeleteError,
          onAction: async () => {
            const res = await deleteQuickbooks({
              variables: { input: { id: quickbooksProvider?.id ?? '' } },
            })

            const destroyedId = getDestroyedQuickbooksId(res)

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
