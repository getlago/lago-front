import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { LAGO_TAX_DOCUMENTATION_URL } from '~/core/constants/externalUrls'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { TAX_MANAGEMENT_INTEGRATION_ROUTE, useNavigate } from '~/core/router'
import {
  CountryCode,
  LagoApiError,
  useGetBillingEntitiesQuery,
  useUpdateBillingEntityMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useIntegrations } from '~/hooks/useIntegrations'

import { hasNonEuEligibilityError } from './utils'

export const ADD_LAGO_TAX_MANAGEMENT_FORM_ID = 'form-add-lago-tax-management'
export const ADD_LAGO_TAX_MANAGEMENT_SUBMIT_BUTTON_TEST_ID = 'add-lago-tax-management-submit-button'

type BillingEntityFormItem = {
  id?: string
  country?: string | null
  initialCountry?: string | null
}

type AddLagoTaxManagementFormValues = {
  billingEntities: BillingEntityFormItem[]
}

const billingEntityItemSchema = z.object({
  id: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  country: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  initialCountry: z.string().nullable().optional(),
})

type OpenAddLagoTaxManagementDialogData = {
  isUpdate?: boolean
}

export const useAddLagoTaxManagementDialog = () => {
  const { translate } = useInternationalization()
  const { hasTaxProvider } = useIntegrations()
  const navigate = useNavigate()
  const formDialog = useFormDialog()

  const isUpdateRef = useRef(false)
  const successRef = useRef(false)

  const { data: billingEntitiesData, loading: billingEntitiesLoading } =
    useGetBillingEntitiesQuery()

  const [update] = useUpdateBillingEntityMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
  })

  const validationSchema = z.object({
    billingEntities: z
      .array(billingEntityItemSchema)
      .refine((items) => items.length > 0 || isUpdateRef.current, ''),
  })

  const form = useAppForm({
    defaultValues: { billingEntities: [] as BillingEntityFormItem[] },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const entities = billingEntitiesData?.billingEntities?.collection || []

      const results = await Promise.all(
        entities.map((billingEntity) => {
          const updated = value.billingEntities.find(
            (b: BillingEntityFormItem) => b.id === billingEntity.id,
          )

          return update({
            variables: {
              input: {
                id: billingEntity.id as string,
                country:
                  (updated?.country as CountryCode | null | undefined) || billingEntity.country,
                euTaxManagement: !!updated,
              },
            },
          })
        }),
      )

      const hasErrors = results.some((res) => !!res.errors)

      if (hasErrors) {
        if (hasNonEuEligibilityError(results)) {
          addToast({
            severity: 'danger',
            message: translate('text_1740672955723utwsgy8vzy2'),
          })
        }

        return
      }

      successRef.current = true

      navigate(
        generatePath(TAX_MANAGEMENT_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Community,
        }),
      )

      addToast({
        message: translate('text_1746630247115t9xocnxcb1n'),
        severity: 'success',
      })
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

  const openAddLagoTaxManagementDialog = (data?: OpenAddLagoTaxManagementDialogData) => {
    const isUpdate = !!data?.isUpdate

    isUpdateRef.current = isUpdate

    const initialItems: BillingEntityFormItem[] =
      billingEntitiesData?.billingEntities?.collection
        ?.filter((billingEntity) => billingEntity?.euTaxManagement === true)
        .map((billingEntity) => ({
          id: billingEntity.id,
          country: billingEntity.country,
          initialCountry: billingEntity?.country,
        })) || []

    form.reset()
    form.setFieldValue('billingEntities', initialItems)

    formDialog
      .open({
        title: translate('text_657078c28394d6b1ae1b974d'),
        description: (
          <Typography
            variant="body"
            color="grey600"
            html={translate('text_657078c28394d6b1ae1b9759', {
              href: LAGO_TAX_DOCUMENTATION_URL,
            })}
          />
        ),
        children: (
          <div className="p-8">
            <BillingEntitiesFormBody
              form={form}
              isUpdate={isUpdate}
              billingEntitiesLoading={billingEntitiesLoading}
              billingEntitiesList={
                billingEntitiesData?.billingEntities?.collection?.map((billingEntity) => ({
                  label: billingEntity.name || billingEntity.code,
                  value: billingEntity.id,
                })) || []
              }
              billingEntitiesCollection={billingEntitiesData?.billingEntities?.collection || []}
            />

            {hasTaxProvider && (
              <Alert type="info" className="mb-6">
                <Typography variant="body" color="grey700">
                  {translate('text_66ba65e562cbc500f04c7dbb')}
                </Typography>
              </Alert>
            )}
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton data-test={ADD_LAGO_TAX_MANAGEMENT_SUBMIT_BUTTON_TEST_ID}>
              {translate(
                isUpdate ? 'text_1746700487143wqtrv2xw3c7' : 'text_657078c28394d6b1ae1b9789',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_LAGO_TAX_MANAGEMENT_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
        }
      })
  }

  return { openAddLagoTaxManagementDialog }
}

type BillingEntitiesFormBodyProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  isUpdate: boolean
  billingEntitiesLoading: boolean
  billingEntitiesList: Array<{ label?: string | null; value: string }>
  billingEntitiesCollection: Array<{
    id: string
    name?: string | null
    code: string
    country?: CountryCode | null
  }>
}

const BillingEntitiesFormBody = ({
  form,
  isUpdate,
  billingEntitiesLoading,
  billingEntitiesList,
  billingEntitiesCollection,
}: BillingEntitiesFormBodyProps) => {
  const { translate } = useInternationalization()

  return (
    <form.Subscribe
      selector={(state: { values: AddLagoTaxManagementFormValues }) => state.values.billingEntities}
    >
      {(billingEntities: BillingEntityFormItem[]) => {
        const maxBillingEntities = billingEntitiesList.length
        const canCreateBillingEntity = billingEntities.length < maxBillingEntities

        const availableBillingEntities = billingEntitiesList.filter(
          (b) => !billingEntities.find((bl: BillingEntityFormItem) => bl.id === b.value),
        )

        const originalBillingEntity = (id: string) => {
          const entity = billingEntitiesCollection.find((b) => b.id === id)

          if (!entity) {
            return null
          }

          return {
            value: entity.id,
            label: entity.name || entity.code,
          }
        }

        const availableBillingEntitiesForEntity = (id?: string) => {
          if (!id) {
            return availableBillingEntities
          }

          const original = originalBillingEntity(id)

          if (original) {
            return availableBillingEntities.concat(original)
          }

          return availableBillingEntities
        }

        return (
          <>
            <div className="flex flex-col gap-3">
              {billingEntities.length > 0 && (
                <div className="grid grid-cols-7 gap-3">
                  <div className="col-span-3">
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_1743077296189ms0shds6g53')}
                    </Typography>
                  </div>

                  <div className="col-span-3">
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_62ab2d0396dd6b0361614da0')}
                    </Typography>
                  </div>
                </div>
              )}

              {billingEntities.map((item: BillingEntityFormItem, index: number) => (
                <div
                  className="grid grid-cols-7 gap-3"
                  key={`add-lago-tax-management-billing-entity-${index}`}
                >
                  <div className="col-span-3">
                    <form.AppField name={`billingEntities[${index}].id`}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <field.ComboBoxField
                          placeholder={translate('text_174360002513391n72uwg6bb')}
                          PopperProps={{ displayInDialog: true }}
                          loading={billingEntitiesLoading}
                          data={availableBillingEntitiesForEntity(item.id)}
                          sortValues={false}
                          customOnChange={(val: string) => {
                            const entity = billingEntitiesCollection.find((_b) => _b.id === val)

                            if (!val) {
                              return form.setFieldValue(`billingEntities[${index}]`, {})
                            }

                            if (entity?.country) {
                              return form.setFieldValue(`billingEntities[${index}]`, {
                                id: entity.id,
                                country: entity.country,
                                initialCountry: entity.country,
                              })
                            }

                            return form.setFieldValue(`billingEntities[${index}]`, {
                              id: entity?.id,
                            })
                          }}
                        />
                      )}
                    </form.AppField>
                  </div>

                  <div className="col-span-3">
                    <form.AppField name={`billingEntities[${index}].country`}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <field.ComboBoxField
                          data={countryDataForCombobox}
                          placeholder={translate('text_657078c28394d6b1ae1b9771')}
                          PopperProps={{ displayInDialog: true }}
                          disabled={!!item.initialCountry}
                          disableClearable={!!item.initialCountry}
                        />
                      )}
                    </form.AppField>
                  </div>

                  <div className="flex items-center justify-center">
                    <Button
                      className="col-span-1"
                      variant="quaternary"
                      size="medium"
                      icon="trash"
                      onClick={() => {
                        const next = [...billingEntities]

                        next.splice(index, 1)
                        form.setFieldValue('billingEntities', next)
                      }}
                      disabled={isUpdate && index === 0}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              fitContent
              variant="inline"
              size="medium"
              startIcon="plus"
              disabled={!canCreateBillingEntity}
              className={tw({
                'mt-6': billingEntities.length > 0,
                'mb-6': true,
              })}
              onClick={() => {
                if (!canCreateBillingEntity) return
                form.setFieldValue('billingEntities', billingEntities.concat({}))
              }}
            >
              {translate('text_1746629562868pknl1wo22fa')}
            </Button>
          </>
        )
      }}
    </form.Subscribe>
  )
}
