import { gql } from '@apollo/client'
import { AnyFormApi, revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'
import { generatePath } from 'react-router'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { TextInput } from '~/components/form'
import { BasicMultipleComboBoxData } from '~/components/form/MultipleComboBox/types'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import {
  getX402Environment,
  X402_ENVIRONMENT_TRANSLATIONS,
  X402_NETWORKS,
  X402EnvironmentEnum,
} from '~/components/settings/integrations/x402Connection'
import {
  mapFromApiToForm,
  mapFromFormToApi,
} from '~/components/settings/integrations/x402ConnectionForm/mappers'
import {
  INVALID_ORIGIN_ERROR,
  REQUIRED_ERROR,
  TOO_MANY_ORIGINS_ERROR,
  x402DefaultValues,
  X402FormValues,
  x402ValidationSchema,
} from '~/components/settings/integrations/x402ConnectionForm/validationSchema'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
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

const SERVER_ERROR_MESSAGES: Record<string, string> = {
  value_already_exist: EXISTING_CODE_ERROR_MESSAGE,
  value_is_mandatory: REQUIRED_ERROR,
  mixed_environments: 'text_17931323948700tocwp025ch',
  value_is_invalid: 'text_17931323948708lpf06sycje',
  unsupported_network: 'text_17931323948708lpf06sycje',
  invalid_checksum: 'text_1793132394870wg65cygf7cw',
  not_in_cdp_project: 'text_1793132394870hge194n3901',
  rejected_by_cdp: 'text_1793132394870lonwnaqx0f7',
  invalid_credentials: 'text_17931323948709pxel9ln0pp',
  payment_method_required: 'text_1793132394870xsex5hshkgm',
  missing_account_read_permission: 'text_1793132394870fi9ve8fdayd',
  value_is_too_long: TOO_MANY_ORIGINS_ERROR,
}

const FIELD_INVALID_FORMAT_MESSAGES: Record<string, string> = {
  allowedOrigins: INVALID_ORIGIN_ERROR,
  evmPayoutAddress: 'text_179313239487010ooo8k2re1',
  svmPayoutAddress: 'text_179313239487010ooo8k2re1',
}

const SERVER_ERROR_FIELDS: Record<string, keyof X402FormValues> = {
  code: 'code',
  name: 'name',
  networks: 'networks',
  allowedOrigins: 'allowedOrigins',
  cdpApiKey: 'cdpApiKeySecret',
  cdpApiKeyId: 'cdpApiKeyId',
  cdpApiKeySecret: 'cdpApiKeySecret',
}

const messageFor = (field: string, codes: string[]): string | undefined => {
  const code = codes[0]

  if (code === 'invalid_format') return FIELD_INVALID_FORMAT_MESSAGES[field]

  return SERVER_ERROR_MESSAGES[code]
}

const getX402ServerFieldErrors = (
  errors?: readonly GraphQLFormattedError[],
): Record<string, { message: string; path: string[] }> => {
  const details = (errors?.[0]?.extensions?.details || {}) as Record<
    string,
    string[] | Record<string, string[]>
  >
  const fieldErrors: Record<string, { message: string; path: string[] }> = {}
  const addError = (field: string, codes: string[]): void => {
    const message = messageFor(field, codes)

    if (message) fieldErrors[field] = { message, path: [field] }
  }

  Object.entries(details).forEach(([key, codes]) => {
    if (key === 'payoutAddresses' && !Array.isArray(codes)) {
      if (codes.evm) addError('evmPayoutAddress', codes.evm)
      if (codes.svm) addError('svmPayoutAddress', codes.svm)
      return
    }

    const field = SERVER_ERROR_FIELDS[key]

    if (field && Array.isArray(codes)) addError(field, codes)
  })

  return fieldErrors
}

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
  const successRef = useRef(false)

  // The error and slow-query links send `operation.variables` to Sentry: these carry the CDP secret.
  const [createConnection] = useCreateX402ConnectionMutation({
    context: { silentError: true, disableSlowQueryTracking: true },
    onCompleted({ createX402Connection }) {
      if (createX402Connection?.id) {
        successRef.current = true
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
        successRef.current = true
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
    onSubmit: async ({ value, formApi }) => {
      const connection = dataRef.current?.connection
      const input = mapFromFormToApi(value)

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

        applyServerErrors(formApi, result.errors)
      } catch {
        addToast({ message: translate('text_62d7ffcb1c57d7e6d15bdce3'), severity: 'danger' })
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

  const networkOptions = (environment: string): BasicMultipleComboBoxData[] =>
    X402_NETWORKS.filter((network) => network.environment === environment).map((network) => ({
      value: network.id,
      label: network.name,
      description: `${network.family.toUpperCase()} ${translate(
        network.environment === X402EnvironmentEnum.Mainnet
          ? 'text_1793132394869qwdol6ok2cm'
          : 'text_179313239486902oyq8t2y3u',
      )} - ${network.id}`,
    }))

  const openAddX402Dialog = (data?: OpenAddX402DialogData): void => {
    dataRef.current = data ?? null
    const connection = data?.connection
    const isEdition = !!connection

    form.reset(connection ? mapFromApiToForm(connection) : x402DefaultValues, {
      keepDefaultValues: true,
    })

    formDialog
      .open({
        title: translate('text_1793132394868hpkrqknydw1'),
        description: translate('text_17931323948682jmdiz5751d'),
        children: (
          <div className="flex flex-col gap-6 p-8">
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

            <form.AppField name="cdpApiKeyId">
              {(field) => (
                <field.TextInputField
                  description={isEdition ? translate('text_179313398974898xp846n9y5') : undefined}
                  label={translate('text_1793132394868pwqbx90cf8b')}
                  placeholder={translate('text_17931323948680vgx0wpgnrf')}
                />
              )}
            </form.AppField>

            <form.AppField name="cdpApiKeySecret">
              {(field) => (
                <field.TextInputField
                  password
                  description={isEdition ? translate('text_179313398974898xp846n9y5') : undefined}
                  label={translate('text_1793132394868dszn9rlgiw7')}
                  placeholder={translate('text_17931323948681jv834fwapk')}
                />
              )}
            </form.AppField>

            <TextInput
              name="asset"
              disabled
              value="USDC"
              label={translate('text_17931323948681cl90eupqde')}
            />

            <form.AppField
              name="environment"
              listeners={{
                onChange: ({ value: environment }) => {
                  form.setFieldValue(
                    'networks',
                    form.state.values.networks.filter(
                      ({ value: network }) => getX402Environment([network]) === environment,
                    ),
                  )
                },
              }}
            >
              {(field) => (
                <field.ComboBoxField
                  PopperProps={{ displayInDialog: true }}
                  disableClearable
                  sortValues={false}
                  virtualized={false}
                  label={translate('text_1793132394869v0rsl99wkms')}
                  placeholder={translate('text_179313239486959hb2v39qfq')}
                  data={[
                    {
                      value: X402EnvironmentEnum.Testnet,
                      label: translate(X402_ENVIRONMENT_TRANSLATIONS[X402EnvironmentEnum.Testnet]),
                      description: translate('text_1793132394869g990pgm13dz'),
                    },
                    {
                      value: X402EnvironmentEnum.Mainnet,
                      label: translate(X402_ENVIRONMENT_TRANSLATIONS[X402EnvironmentEnum.Mainnet]),
                      description: translate('text_1793132394869g0lp95omsra'),
                    },
                  ]}
                />
              )}
            </form.AppField>

            <form.Subscribe selector={(state) => state.values.environment}>
              {(environment) => (
                <form.AppField name="networks">
                  {(field) => (
                    <field.MultipleComboBoxField
                      PopperProps={{ displayInDialog: true }}
                      disabled={!environment}
                      sortValues={false}
                      virtualized={false}
                      label={translate('text_1793132394869jd4bmw58fz1')}
                      placeholder={translate('text_1793132394869scxi2byzi8o')}
                      data={networkOptions(environment)}
                    />
                  )}
                </form.AppField>
              )}
            </form.Subscribe>

            <form.AppField name="evmPayoutAddress">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1793132394869qbewz38n7li')}
                  placeholder={translate('text_1793132394869foz539ute16')}
                />
              )}
            </form.AppField>

            <form.AppField name="svmPayoutAddress">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1793132394869960hjrg0yla')}
                  placeholder={translate('text_1793132394869zq69t7x6ktd')}
                />
              )}
            </form.AppField>

            <form.AppField name="allowedOrigins">
              {(field) => (
                <field.TextInputField
                  multiline
                  rows={4}
                  label={translate('text_1793132394869zlqs0k1l2fm')}
                  placeholder={translate('text_1793132394869cit1k4z7f5a')}
                />
              )}
            </form.AppField>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="subhead1" color="grey700">
                  {translate('text_1793132394869xvpiygh9ecn')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_1793132394869pgcan48dqvx')}
                </Typography>
              </div>

              <form.AppField name="autoCreateCustomers">
                {(field) => (
                  <field.SwitchField
                    label={translate('text_1793132394869hysrxau60dc')}
                    subLabel={translate('text_1793132394869zunprn48m3z')}
                  />
                )}
              </form.AppField>
            </div>
          </div>
        ),
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
        form: {
          id: ADD_X402_FORM_ID,
          submit: handleSubmit,
        },
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
