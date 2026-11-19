import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

import { dialogFormProps } from '~/components/dialogs/dialogFormProps'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError, onNetworkError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, useGetPlansForAgentStorefrontLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useSoldPlans } from './useSoldPlans'
import { SoldPlan, SoldPlanAmounts } from './utils'

gql`
  query getPlansForAgentStorefront($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
        amountCurrency
      }
    }
  }
`

const SELL_PLAN_FORM_ID = 'form-sell-plan-to-agents'
const REQUIRED_ERROR = 'text_624ea7c29103fd010732ab7d'
const MAX_NOT_GREATER_ERROR = 'text_1758722900801nbox9c5bgnn'
const PLAN_NOT_USAGE_ONLY_ERROR = 'text_17950964499737ljcb8hjwjz'

const SELL_PLAN_SUBMIT_TEST_ID = 'sell-plan-to-agents-submit'

type AmountValue = string | number | undefined

const amountSchema = z.union([z.string(), z.number()]).optional()

const isPositiveAmount = (value: AmountValue): boolean => Number(value || 0) > 0

const sellPlanValidationSchema = z
  .object({
    planCode: z.string({ error: REQUIRED_ERROR }).min(1, { message: REQUIRED_ERROR }),
    amountCurrency: z.enum(CurrencyEnum),
    minimumTopup: amountSchema.refine(isPositiveAmount, { message: REQUIRED_ERROR }),
    maximumTopup: amountSchema.refine(isPositiveAmount, { message: REQUIRED_ERROR }),
    freeCredits: amountSchema,
  })
  .superRefine(({ minimumTopup, maximumTopup }, ctx) => {
    if (Number(maximumTopup) > Number(minimumTopup)) return

    ctx.addIssue({ code: 'custom', message: MAX_NOT_GREATER_ERROR, path: ['maximumTopup'] })
  })

type SellPlanFormValues = z.infer<typeof sellPlanValidationSchema>

const sellPlanDefaultValues: SellPlanFormValues = {
  planCode: '',
  amountCurrency: CurrencyEnum.Usd,
  minimumTopup: undefined,
  maximumTopup: undefined,
  freeCredits: undefined,
}

const toCents = (value: AmountValue, currency: CurrencyEnum): number =>
  Number(serializeAmount(value ?? 0, currency))

const mapFormToAmounts = ({
  minimumTopup,
  maximumTopup,
  freeCredits,
  amountCurrency,
}: SellPlanFormValues): SoldPlanAmounts => ({
  minimumTopupCents: toCents(minimumTopup, amountCurrency),
  maximumTopupCents: toCents(maximumTopup, amountCurrency),
  freeCreditsCents:
    freeCredits === undefined || freeCredits === '' ? null : toCents(freeCredits, amountCurrency),
})

const toFormAmount = (cents: SoldPlan['minimumTopupCents'], currency: CurrencyEnum): AmountValue =>
  cents === null || cents === undefined ? undefined : deserializeAmount(cents, currency)

type EditablePlan = NonNullable<SoldPlan['plan']>

type EditableSoldPlan = SoldPlan & { plan: EditablePlan }

type SellPlanToAgentsDialogContentProps = {
  soldPlanCodes: string[]
  editedPlan: EditablePlan | null
}

const contentDefaultProps: SellPlanToAgentsDialogContentProps = {
  soldPlanCodes: [],
  editedPlan: null,
}

const SellPlanToAgentsDialogContent = withForm({
  defaultValues: sellPlanDefaultValues,
  props: contentDefaultProps,
  render: function SellPlanToAgentsDialogContentRender({ form, soldPlanCodes, editedPlan }) {
    const { translate } = useInternationalization()
    const currency = useStore(form.store, (state) => state.values.amountCurrency)

    const [getPlans, { data, loading }] = useGetPlansForAgentStorefrontLazyQuery({
      variables: { limit: 50 },
    })

    useEffect(() => {
      if (!editedPlan) getPlans()
    }, [editedPlan, getPlans])

    const getPlanOptions = (): { label: string; value: string }[] => {
      if (editedPlan) {
        return [{ label: `${editedPlan.name} · ${editedPlan.code}`, value: editedPlan.code }]
      }

      return (data?.plans?.collection ?? [])
        .filter(({ code }) => !soldPlanCodes.includes(code))
        .map(({ name, code }) => ({ label: `${name} · ${code}`, value: code }))
    }

    const currencyAdornment = (
      <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
    )

    return (
      <div className="flex flex-col gap-6 p-8">
        <form.AppField
          name="planCode"
          listeners={{
            onChange: ({ value }) => {
              const plan = data?.plans?.collection.find(({ code }) => code === value)

              if (plan) form.setFieldValue('amountCurrency', plan.amountCurrency)
            },
          }}
        >
          {(field) => (
            <field.ComboBoxField
              label={translate('text_63d3a658c6d84a5843032145')}
              placeholder={translate('text_1795096449973124lb0ebx0m')}
              data={getPlanOptions()}
              disabled={!!editedPlan}
              loading={loading}
              searchQuery={editedPlan ? undefined : getPlans}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>

        <div className="flex flex-row gap-4">
          <form.AppField name="minimumTopup">
            {(field) => (
              <field.AmountInputField
                className="flex-1"
                currency={currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_1795096449973wdexjkly512')}
                InputProps={{ endAdornment: currencyAdornment }}
              />
            )}
          </form.AppField>

          <form.AppField name="maximumTopup">
            {(field) => (
              <field.AmountInputField
                className="flex-1"
                currency={currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_1795096449973uyfbucivd3q')}
                InputProps={{ endAdornment: currencyAdornment }}
              />
            )}
          </form.AppField>
        </div>

        <form.AppField name="freeCredits">
          {(field) => (
            <field.AmountInputField
              isOptional
              currency={currency}
              beforeChangeFormatter={['positiveNumber']}
              label={translate('text_1795096449973dbb7ia1ev0a')}
              helperText={translate('text_1795096449973iy30qx82ui0')}
              InputProps={{ endAdornment: currencyAdornment }}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

type UseSellPlanToAgentsDialogReturn = {
  openSellPlanDialog: (soldPlanCodes: string[]) => void
  openEditPlanDialog: (soldPlan: EditableSoldPlan) => void
}

export const useSellPlanToAgentsDialog = (
  integrationId: string,
): UseSellPlanToAgentsDialogReturn => {
  const { translate } = useInternationalization()
  const formDialog = useFormDialog()
  const { organization } = useOrganizationInfos()
  const { sellPlan, editPlan } = useSoldPlans(integrationId)
  const isEditionRef = useRef(false)

  const form = useAppForm({
    defaultValues: sellPlanDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: sellPlanValidationSchema },
    onSubmit: async ({ value, formApi }) => {
      const isEdition = isEditionRef.current
      const amounts = mapFormToAmounts(value)

      const response = isEdition
        ? await editPlan(value.planCode, amounts)
        : await sellPlan(value.planCode, amounts)

      if (response.reason === 'guardrail') {
        addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
        throw new Error('Submit failed')
      }

      const { result } = response

      if (result.errors || !result.data?.updateAgentStorefrontIntegration?.id) {
        if (hasDefinedGQLError('PlanNotUsageOnly', result.errors, 'plans')) {
          formApi.setErrorMap({
            onDynamic: {
              fields: { planCode: { message: PLAN_NOT_USAGE_ONLY_ERROR, path: ['planCode'] } },
            },
          })
        }

        throw new Error('Submit failed')
      }

      addToast({
        severity: 'success',
        translateKey: isEdition ? 'text_1789030049529tdyr0nk1liw' : 'text_1795096449973hbn8o7srlh5',
      })
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(SELL_PLAN_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const openDialog = ({
    soldPlanCodes,
    editedPlan,
  }: {
    soldPlanCodes: string[]
    editedPlan: EditablePlan | null
  }): void => {
    const isEdition = !!editedPlan

    void formDialog.open({
      title: translate(
        isEdition ? 'text_1789030049528hmelti5lsxj' : 'text_1795096449973zx39wbk3u61',
      ),
      description: translate('text_1795096449973whvv8hx6wij'),
      closeOnError: false,
      onError: onNetworkError,
      onEntered: focusFirstInput,
      children: (
        <SellPlanToAgentsDialogContent
          form={form}
          soldPlanCodes={soldPlanCodes}
          editedPlan={editedPlan}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={SELL_PLAN_SUBMIT_TEST_ID}>
            {translate(
              isEdition ? 'text_17432414198706rdwf76ek3u' : 'text_1795096449973959poz3mvu1',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      form: dialogFormProps(SELL_PLAN_FORM_ID, form),
    })
  }

  const openSellPlanDialog = (soldPlanCodes: string[]): void => {
    isEditionRef.current = false
    form.reset(
      {
        ...sellPlanDefaultValues,
        amountCurrency: organization?.defaultCurrency ?? CurrencyEnum.Usd,
      },
      { keepDefaultValues: true },
    )

    openDialog({ soldPlanCodes, editedPlan: null })
  }

  const openEditPlanDialog = (soldPlan: EditableSoldPlan): void => {
    const { plan } = soldPlan
    const currency = plan.amountCurrency

    isEditionRef.current = true
    form.reset(
      {
        planCode: soldPlan.planCode,
        amountCurrency: currency,
        minimumTopup: toFormAmount(soldPlan.minimumTopupCents, currency),
        maximumTopup: toFormAmount(soldPlan.maximumTopupCents, currency),
        freeCredits: toFormAmount(soldPlan.freeCreditsCents, currency),
      },
      { keepDefaultValues: true },
    )

    openDialog({ soldPlanCodes: [], editedPlan: plan })
  }

  return { openSellPlanDialog, openEditPlanDialog }
}
