import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { generatePath } from 'react-router'

import { Alert } from '~/components/designSystem/Alert'
import { dialogFormProps } from '~/components/dialogs/dialogFormProps'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  PremiumIntegrationTypeEnum,
  ProviderTypeEnum,
  useCreateAgentStorefrontIntegrationMutation,
  useGetStripeProvidersForAgentStorefrontQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import {
  ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS,
  applyAgentStorefrontServerErrors,
} from './serverErrors'
import {
  addAgentStorefrontDefaultValues,
  addAgentStorefrontValidationSchema,
  mapFromFormToApi,
} from './validationSchema'

gql`
  query getStripeProvidersForAgentStorefront($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on StripeProvider {
          id
          name
          code
        }
      }
    }
  }

  mutation createAgentStorefrontIntegration($input: CreateAgentStorefrontIntegrationInput!) {
    createAgentStorefrontIntegration(input: $input) {
      id
    }
  }
`

const ADD_AGENT_STOREFRONT_FORM_ID = 'form-add-agent-storefront-integration'

export const ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID = 'add-agent-storefront-submit'

const AddAgentStorefrontDialogContent = withForm({
  defaultValues: addAgentStorefrontDefaultValues,
  render: function AddAgentStorefrontDialogContentRender({ form }) {
    const { translate } = useInternationalization()
    const isRefused = useStore(form.store, (state) => state.values.isRefused)

    const { data, loading } = useGetStripeProvidersForAgentStorefrontQuery({
      variables: { limit: 1000, type: ProviderTypeEnum.Stripe },
    })

    const stripeProviders = (data?.paymentProviders?.collection ?? []).flatMap((provider) =>
      provider.__typename === 'StripeProvider'
        ? [{ label: provider.name, value: provider.code }]
        : [],
    )

    return (
      <div className="flex flex-col gap-6 p-8">
        {isRefused && <Alert type="danger">{translate('text_1795083825205hnjrsshuj3f')}</Alert>}

        <NameAndCodeGroup
          form={form}
          fields={{ name: 'name', code: 'code' }}
          nameProps={{
            label: translate('text_6584550dc4cec7adf861504d'),
            placeholder: translate('text_6584550dc4cec7adf861504f'),
          }}
          codeProps={{
            label: translate('text_6584550dc4cec7adf8615051'),
            placeholder: translate('text_6584550dc4cec7adf8615053'),
          }}
        />

        <form.AppField name="resourceEndpoint">
          {(field) => (
            <field.TextInputField
              isOptional
              label={translate('text_1749819996843c2c5f1j8e0n')}
              placeholder={translate('text_1795083825204sif7pc26ftx')}
              helperText={translate('text_17950838252040lbjy142l2p')}
            />
          )}
        </form.AppField>

        <form.AppField name="resourceInstructions">
          {(field) => (
            <field.TextInputField
              isOptional
              label={translate('text_1795083825204lmkscmx0nq6')}
              placeholder={translate('text_1795083825205hap38wv16ef')}
              helperText={translate('text_1795083825205bpwral25rd1')}
            />
          )}
        </form.AppField>

        <form.AppField name="paymentProviderCode">
          {(field) => (
            <field.ComboBoxField
              label={translate('text_1789557972392jhb3cywzp35')}
              placeholder={translate('text_179508382520571rmhiiha12')}
              data={stripeProviders}
              loading={loading && !data}
              emptyText={translate('text_1795083825205bzt16lj6yrs')}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export const useAddAgentStorefrontDialog = (): { openAddAgentStorefrontDialog: () => void } => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialog = useFormDialog()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const [createAgentStorefrontIntegration] = useCreateAgentStorefrontIntegrationMutation({
    context: { silentErrorDetails: ADD_AGENT_STOREFRONT_SILENT_ERROR_DETAILS },
    refetchQueries: ['integrationsSetting'],
  })

  const form = useAppForm({
    defaultValues: addAgentStorefrontDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: addAgentStorefrontValidationSchema },
    onSubmit: async ({ value, formApi }) => {
      if (value.isRefused) {
        throw new Error('Refused')
      }

      const result = await createAgentStorefrontIntegration({
        variables: { input: mapFromFormToApi(value) },
      }).catch((error: unknown) => {
        addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
        throw error
      })

      const integrationId = result.data?.createAgentStorefrontIntegration?.id

      if (result.errors || !integrationId) {
        applyAgentStorefrontServerErrors(formApi, result.errors ?? [])
        throw new Error('Submit failed')
      }

      addToast({ severity: 'success', translateKey: 'text_1795083825206swpb0ujrehf' })
      navigate(
        generatePath(AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          integrationId,
        }),
      )
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(ADD_AGENT_STOREFRONT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const openAddAgentStorefrontDialog = (): void => {
    form.reset(
      {
        ...addAgentStorefrontDefaultValues,
        isRefused: !hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.EventsTargetingWallets),
      },
      { keepDefaultValues: true },
    )

    void formDialog.open({
      title: translate('text_1795083825204rjjra2qszpz'),
      description: translate('text_1795083825204o2xktr1k5bf'),
      closeOnError: false,
      onEntered: focusFirstInput,
      children: <AddAgentStorefrontDialogContent form={form} />,
      mainAction: (
        <form.AppForm>
          <form.Subscribe selector={(state) => state.values.isRefused}>
            {(isRefused) => (
              <form.SubmitButton
                disabled={isRefused}
                dataTest={ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID}
              >
                {translate('text_1795083825205xsbje4gbwqj')}
              </form.SubmitButton>
            )}
          </form.Subscribe>
        </form.AppForm>
      ),
      form: dialogFormProps(ADD_AGENT_STOREFRONT_FORM_ID, form),
    })
  }

  return { openAddAgentStorefrontDialog }
}
