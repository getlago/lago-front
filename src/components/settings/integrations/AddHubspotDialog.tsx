import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useId, useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { Checkbox } from '~/components/form'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { getHubspotTargetedObjectTranslationKey } from '~/core/constants/form'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { HUBSPOT_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  GetHubspotIntegrationsListDocument,
  HubspotForCreateDialogFragment,
  HubspotTargetedObjectsEnum,
  useCreateHubspotIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateHubspotIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment HubspotForCreateDialog on HubspotIntegration {
    id
    name
    code
    defaultTargetedObject
    syncInvoices
    syncSubscriptions
  }

  mutation createHubspotIntegration($input: CreateHubspotIntegrationInput!) {
    createHubspotIntegration(input: $input) {
      ...HubspotForCreateDialog
    }
  }

  mutation updateHubspotIntegration($input: UpdateHubspotIntegrationInput!) {
    updateHubspotIntegration(input: $input) {
      ...HubspotForCreateDialog
    }
  }
`

const ADD_HUBSPOT_FORM_ID = 'form-add-hubspot-integration'

type AddHubspotFormValues = {
  name: string
  code: string
  defaultTargetedObject: HubspotTargetedObjectsEnum
  syncInvoices: boolean
  syncSubscriptions: boolean
}

const defaultFormValues: AddHubspotFormValues = {
  name: '',
  code: '',
  defaultTargetedObject: HubspotTargetedObjectsEnum.Companies,
  syncInvoices: false,
  syncSubscriptions: false,
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  defaultTargetedObject: z.nativeEnum(HubspotTargetedObjectsEnum),
  syncInvoices: z.boolean(),
  syncSubscriptions: z.boolean(),
})

type OpenAddHubspotDialogData = {
  provider?: HubspotForCreateDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddHubspotDialog = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddHubspotDialogData | null>(null)
  const successRef = useRef(false)

  const [showGlobalError, setShowGlobalError] = useState(false)

  const [createIntegration] = useCreateHubspotIntegrationMutation({
    onCompleted({ createHubspotIntegration }) {
      if (createHubspotIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(HUBSPOT_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createHubspotIntegration.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_1727190044775psjhxh09fsq'),
          severity: 'success',
        })
      }
    },
  })

  const [updateIntegration] = useUpdateHubspotIntegrationMutation({
    onCompleted({ updateHubspotIntegration }) {
      if (updateHubspotIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_172719004477535rfq4o0j1s'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteHubspot] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setShowGlobalError(false)

      const hubspotProvider = dataRef.current?.provider
      const isEdition = !!hubspotProvider

      const handleError = (errors: readonly GraphQLFormattedError[]) => {
        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
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
              ...value,
              id: hubspotProvider?.id || '',
            },
          },
        })

        if (res.errors) {
          handleError(res.errors)
        }
      } else {
        const connectionId = `hubspot-${componentId.replaceAll(':', '')}-${Date.now()}`
        const Nango = (await import('@nangohq/frontend')).default
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoAuthResult = await nango.auth('hubspot', connectionId)

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
          setShowGlobalError(true)
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

  const openAddHubspotDialog = (data?: OpenAddHubspotDialogData) => {
    setShowGlobalError(false)
    dataRef.current = data ?? null
    const hubspotProvider = data?.provider
    const isEdition = !!hubspotProvider

    form.reset()
    if (hubspotProvider) {
      form.setFieldValue('name', hubspotProvider.name || '')
      form.setFieldValue('code', hubspotProvider.code || '')
      form.setFieldValue(
        'defaultTargetedObject',
        hubspotProvider.defaultTargetedObject || HubspotTargetedObjectsEnum.Companies,
      )
      form.setFieldValue('syncInvoices', !!hubspotProvider.syncInvoices)
      form.setFieldValue('syncSubscriptions', !!hubspotProvider.syncSubscriptions)
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_1727189568053ifu63v2q1gf',
          {
            name: hubspotProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_1727189568053fu2g4sonout' : 'text_1727189568054z4qhm7flfgh',
        ),
        children: (
          <div className="flex w-full flex-col gap-8 p-8">
            {showGlobalError && (
              <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
            )}

            <div className="flex w-full flex-row items-start gap-6 *:flex-1">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_6419c64eace749372fc72b0f')}
                    placeholder={translate('text_6584550dc4cec7adf861504f')}
                  />
                )}
              </form.AppField>
              <form.AppField name="code">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter="code"
                    label={translate('text_62876e85e32e0300e1803127')}
                    placeholder={translate('text_6584550dc4cec7adf8615053')}
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-12">
              <form.AppField name="defaultTargetedObject">
                {(field) => (
                  <field.ComboBoxField
                    label={translate('text_17271895680545qv3cvwk1jx')}
                    data={[
                      {
                        label: translate(
                          getHubspotTargetedObjectTranslationKey[
                            HubspotTargetedObjectsEnum.Companies
                          ],
                        ),
                        value: HubspotTargetedObjectsEnum.Companies,
                      },
                      {
                        label: translate(
                          getHubspotTargetedObjectTranslationKey[
                            HubspotTargetedObjectsEnum.Contacts
                          ],
                        ),
                        value: HubspotTargetedObjectsEnum.Contacts,
                      },
                    ]}
                    PopperProps={{ displayInDialog: true }}
                  />
                )}
              </form.AppField>

              <div className="flex flex-col gap-4">
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_1727190044775k62adpax08b')}
                  </Typography>
                  <Typography variant="caption" color="grey600">
                    {translate('text_661ff6e56ef7e1b7c542b28e')}
                  </Typography>
                </div>

                <Checkbox
                  disabled
                  label={
                    <CheckboxLabelWithCode
                      firstPart={translate('text_1727190044775yssj1flnpe9')}
                      code={translate('text_1727281892403bkjbojs75t7')}
                      lastPart={translate('text_1727190044775p6mbfwbzv36')}
                    />
                  }
                  value={true}
                />

                <Checkbox
                  disabled
                  label={
                    <CheckboxLabelWithCode
                      firstPart={translate('text_1727190044775yssj1flnpe9')}
                      code={translate('text_1727281892403m7aoqothh7r')}
                      lastPart={translate('text_1727190044775p6mbfwbzv36')}
                    />
                  }
                  value={true}
                />

                <form.AppField name="syncInvoices">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <CheckboxLabelWithCode
                          firstPart={translate('text_1727190044775yssj1flnpe9')}
                          code={translate('text_1727281892403ljelfgyyupg')}
                          lastPart={translate('text_172719004477572tu71psqqt')}
                        />
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="syncSubscriptions">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <CheckboxLabelWithCode
                          firstPart={translate('text_1727190044775yssj1flnpe9')}
                          code={translate('text_1727281892403w0qjgmdf8n4')}
                          lastPart={translate('text_172719004477572tu71psqqt')}
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
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1727189568053ifu63v2q1gf',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_HUBSPOT_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: hubspotProvider?.name }),
          description: translate('text_1727453876790u9azb7rvhox'),
          actionText: translate('text_645d071272418a14c1c76a81'),
          colorVariant: 'danger',
          onAction: async () => {
            const res = await deleteHubspot({
              variables: { input: { id: hubspotProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'HubspotIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetHubspotIntegrationsListDocument,
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
          setShowGlobalError(false)
        }
      })
  }

  return { openAddHubspotDialog }
}

const CheckboxLabelWithCode = ({
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
