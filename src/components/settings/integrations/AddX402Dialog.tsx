import { gql } from '@apollo/client'
import { AnyFormApi, revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'
import { generatePath } from 'react-router'

import { dialogFormProps } from '~/components/dialogs/dialogFormProps'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import {
  mapFromApiToForm,
  mapFromFormToApi,
} from '~/components/settings/integrations/x402ConnectionForm/mappers'
import { getX402ServerFieldErrors } from '~/components/settings/integrations/x402ConnectionForm/serverErrors'
import {
  x402DefaultValues,
  x402ValidationSchema,
} from '~/components/settings/integrations/x402ConnectionForm/validationSchema'
import X402ConnectionFields from '~/components/settings/integrations/x402ConnectionForm/X402ConnectionFields'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { useNavigate, X402_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddX402ConnectionDialogFragment,
  useCreateX402ConnectionMutation,
  useUpdateX402ConnectionMutation,
  X402IntegrationDetailsFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddX402ConnectionDialog on X402ConnectionObject {
    id
    name
    code
    networks
    allowedOrigins
    autoCreateCustomers
    payoutAddresses {
      evm
      svm
    }
  }

  mutation createX402Connection($input: CreateX402ConnectionInput!) {
    createX402Connection(input: $input) {
      id
      ...AddX402ConnectionDialog
      ...X402IntegrationDetails
    }
  }

  mutation updateX402Connection($input: UpdateX402ConnectionInput!) {
    updateX402Connection(input: $input) {
      id
      ...AddX402ConnectionDialog
      ...X402IntegrationDetails
    }
  }

  ${X402IntegrationDetailsFragmentDoc}
`

const ADD_X402_FORM_ID = 'form-add-x402-integration'

type OpenAddX402DialogData = {
  connection?: AddX402ConnectionDialogFragment
}

export const useAddX402Dialog = (): {
  openAddX402Dialog: (data?: OpenAddX402DialogData) => void
} => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const dataRef = useRef<OpenAddX402DialogData | null>(null)

  // The error and slow-query links send `operation.variables` to Sentry: these carry the CDP secret.
  const [createConnection] = useCreateX402ConnectionMutation({
    context: { silentError: true, disableSlowQueryTracking: true },
    onCompleted({ createX402Connection }) {
      if (createX402Connection?.id) {
        navigate(
          generatePath(X402_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createX402Connection.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_1793132394870z97i38pt1al'),
          severity: 'success',
        })
      }
    },
  })

  const [updateConnection] = useUpdateX402ConnectionMutation({
    context: { silentError: true, disableSlowQueryTracking: true },
    onCompleted({ updateX402Connection }) {
      if (updateX402Connection?.id) {
        addToast({
          message: translate('text_1793132394870od2nshydnki'),
          severity: 'success',
        })
      }
    },
  })

  const applyServerErrors = (
    formApi: AnyFormApi,
    errors?: readonly GraphQLFormattedError[],
  ): void => {
    const fields = getX402ServerFieldErrors(errors)

    if (Object.keys(fields).length) {
      formApi.setErrorMap({ onDynamic: { fields } })
    } else if (errors?.length) {
      addToast({ message: translate('text_62d7ffcb1c57d7e6d15bdce3'), severity: 'danger' })
    }
  }

  const form = useAppForm({
    defaultValues: x402DefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: x402ValidationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(ADD_X402_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    // A failure is thrown so the submit is not marked successful and the dialog stays open, on
    // its inline errors or a toast.
    onSubmit: async ({ value, formApi }) => {
      const connection = dataRef.current?.connection
      const input = mapFromFormToApi(value)
      let errors: readonly GraphQLFormattedError[] | undefined

      try {
        const result = connection
          ? await updateConnection({ variables: { input: { ...input, id: connection.id } } })
          : await createConnection({
              variables: {
                input: {
                  ...input,
                  cdpApiKeyId: value.cdpApiKeyId,
                  cdpApiKeySecret: value.cdpApiKeySecret,
                },
              },
            })

        errors = result.errors
      } catch (error) {
        addToast({ message: translate('text_62d7ffcb1c57d7e6d15bdce3'), severity: 'danger' })
        throw error
      }

      if (errors?.length) {
        applyServerErrors(formApi, errors)
        throw new Error('x402 connection refused')
      }
    },
  })

  const openAddX402Dialog = (data?: OpenAddX402DialogData): void => {
    dataRef.current = data ?? null
    const connection = data?.connection
    const isEdition = !!connection

    form.reset(connection ? mapFromApiToForm(connection) : x402DefaultValues, {
      keepDefaultValues: true,
    })

    void formDialog
      .open({
        title: translate('text_1793132394868hpkrqknydw1'),
        description: translate('text_17931323948682jmdiz5751d'),
        children: <X402ConnectionFields form={form} isEdition={isEdition} />,
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_1793132394868xq8hzv5hpi7' : 'text_1793132394868hpkrqknydw1',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: dialogFormProps(ADD_X402_FORM_ID, form),
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openAddX402Dialog }
}
