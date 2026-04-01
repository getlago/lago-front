import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  LocalPricingUnitType,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import { isPlanIntervalAnnual, transformFilterObjectToString } from '~/components/plans/utils'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  PLAN_FORM_TYPE,
  resetDuplicatePlanVar,
  useDuplicatePlanVar,
} from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import { FORM_ERRORS_ENUM, FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  CustomerSubscriptionDetailsTabsOptionsEnum,
  PlanDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  ERROR_404_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
} from '~/core/router'
import { serializePlanInput } from '~/core/serializers'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { scrollToTop } from '~/core/utils/domUtils'
import { planFormSchema } from '~/formValidation/planFormSchema'
import {
  CurrencyEnum,
  DeletePlanDialogFragmentDoc,
  EditPlanFragment,
  EditPlanFragmentDoc,
  LagoApiError,
  PlanInterval,
  PlanItemFragmentDoc,
  useCreatePlanMutation,
  useGetSinglePlanQuery,
  useUpdatePlanMutation,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getSinglePlan($id: ID!) {
    plan(id: $id) {
      ...EditPlan
    }
  }

  mutation createPlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      id
    }
  }

  mutation updatePlan($input: UpdatePlanInput!) {
    updatePlan(input: $input) {
      ...PlanItem
      ...DeletePlanDialog
      ...EditPlan
    }
  }

  ${PlanItemFragmentDoc}
  ${DeletePlanDialogFragmentDoc}
  ${EditPlanFragmentDoc}
`

export type PlanFormType = ReturnType<typeof usePlanForm>['form']

const buildDefaultValues = (
  plan: EditPlanFragment | undefined | null,
  type: PLAN_FORM_TYPE,
  initialCurrency: CurrencyEnum,
  hasAnyPricingUnitConfigured: boolean,
): PlanFormInput => ({
  name: type === FORM_TYPE_ENUM.duplicate ? '' : plan?.name || '',
  code: type === FORM_TYPE_ENUM.duplicate ? '' : plan?.code || '',
  description: plan?.description || '',
  entitlements:
    plan?.entitlements?.map(({ code, privileges, name, ...restEntitlement }) => ({
      featureName: name || '',
      featureCode: code,
      privileges: privileges.map(
        ({ code: privilegeCode, name: privilegeName, value, ...restPrivilege }) => ({
          privilegeCode,
          privilegeName,
          value: value || '',
          ...restPrivilege,
        }),
      ),
      ...restEntitlement,
    })) || [],
  interval: plan?.interval || PlanInterval.Monthly,
  taxes: plan?.taxes || [],
  invoiceDisplayName: plan?.invoiceDisplayName || undefined,
  payInAdvance: plan?.payInAdvance || false,
  amountCents: isNaN(plan?.amountCents)
    ? '0'
    : String(deserializeAmount(plan?.amountCents || 0, initialCurrency)),
  amountCurrency: initialCurrency,
  trialPeriod: plan?.trialPeriod ?? 0,
  billChargesMonthly: plan?.billChargesMonthly || false,
  billFixedChargesMonthly: plan?.billFixedChargesMonthly || false,
  minimumCommitment: !!plan?.minimumCommitment
    ? {
        ...plan?.minimumCommitment,
        amountCents: String(
          deserializeAmount(plan?.minimumCommitment.amountCents || 0, initialCurrency),
        ),
      }
    : {},
  nonRecurringUsageThresholds:
    plan?.usageThresholds && plan?.usageThresholds.length > 0
      ? plan?.usageThresholds
          .filter(({ recurring }) => !recurring)
          .map((threshold) => ({
            ...threshold,
            amountCents: deserializeAmount(threshold.amountCents || 0, initialCurrency),
          }))
          .sort((a, b) => a.amountCents - b.amountCents)
      : undefined,
  recurringUsageThreshold: plan?.usageThresholds
    ?.map((threshold) => ({
      ...threshold,
      amountCents: deserializeAmount(threshold.amountCents || 0, initialCurrency),
    }))
    .find(({ recurring }) => !!recurring),
  fixedCharges: plan?.fixedCharges || [],
  charges: plan?.charges
    ? (plan?.charges.map(
        ({
          taxes,
          properties,
          minAmountCents,
          payInAdvance,
          invoiceDisplayName,
          filters,
          appliedPricingUnit,
          ...charge
        }) => {
          return {
            appliedPricingUnit:
              !hasAnyPricingUnitConfigured && !appliedPricingUnit
                ? undefined
                : {
                    code: appliedPricingUnit?.pricingUnit?.code || initialCurrency,
                    conversionRate: String(appliedPricingUnit?.conversionRate || ''),
                    shortName: appliedPricingUnit?.pricingUnit?.shortName || initialCurrency,
                    type: !!appliedPricingUnit?.pricingUnit?.code
                      ? LocalPricingUnitType.Custom
                      : LocalPricingUnitType.Fiat,
                  },
            invoiceDisplayName: invoiceDisplayName || '',
            taxes: taxes || [],
            minAmountCents:
              isNaN(minAmountCents) || minAmountCents === '0'
                ? undefined
                : String(
                    deserializeAmount(minAmountCents || 0, plan.amountCurrency || CurrencyEnum.Usd),
                  ),
            payInAdvance: payInAdvance || false,
            properties: properties ? getPropertyShape(properties) : undefined,
            regroupPaidFees: charge.regroupPaidFees || null,
            filters: (filters || []).map((filter) => {
              const values = Object.entries(filter.values || {}).reduce<string[]>(
                (acc, [key, objectValues]) => {
                  ;(objectValues as string[]).map((v) => {
                    acc.push(transformFilterObjectToString(key, v))
                  })

                  return acc
                },
                [],
              )

              return {
                ...filter,
                properties: getPropertyShape(filter.properties),
                values,
              }
            }),
            ...charge,
          }
        },
      ) as LocalUsageChargeInput[])
    : ([] as LocalUsageChargeInput[]),
  cascadeUpdates: undefined,
})

export const usePlanForm = ({
  planIdToFetch,
  isUsedInSubscriptionForm,
}: {
  planIdToFetch?: string
  isUsedInSubscriptionForm?: boolean
}) => {
  const navigate = useNavigate()
  const { organization } = useOrganizationInfos()
  const [searchParams] = useSearchParams()
  const { planId: id = '' } = useParams()
  const { hasAnyPricingUnitConfigured } = useCustomPricingUnits()
  const { parentId, type: actionType } = useDuplicatePlanVar()
  const { data, loading, error } = useGetSinglePlanQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: id || (parentId as string) || (planIdToFetch as string) },
    skip: !id && !parentId && !planIdToFetch,
  })
  const isDuplicate = actionType === 'duplicate' && !!parentId
  const type = useMemo(() => {
    if (!!id) return FORM_TYPE_ENUM.edition
    if (isDuplicate) return FORM_TYPE_ENUM.duplicate
    return FORM_TYPE_ENUM.creation
  }, [id, isDuplicate])

  const isEdition = type === FORM_TYPE_ENUM.edition
  const plan = data?.plan
  const initialCurrency =
    type === FORM_TYPE_ENUM.creation && !isUsedInSubscriptionForm
      ? organization?.defaultCurrency || CurrencyEnum.Usd
      : plan?.amountCurrency || CurrencyEnum.Usd

  const [create, { error: createError }] = useCreatePlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        if (type === FORM_TYPE_ENUM.duplicate) {
          addToast({
            severity: 'success',
            translateKey: 'text_64fa176933e3b8008e3f15eb',
          })
        } else {
          addToast({
            severity: 'success',
            translateKey: 'text_633336532bdf72cb62dc0694',
          })
        }

        navigate(
          generatePath(PLAN_DETAILS_ROUTE, {
            planId: createPlan.id,
            tab: PlanDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })
  const [update, { error: updateError }] = useUpdatePlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updatePlan }) {
      if (!!updatePlan) {
        const origin = searchParams.get('origin')
        const originSubscriptionId = searchParams.get('subscriptionId')
        const originCustomerId = searchParams.get('customerId')

        addToast({
          severity: 'success',
          translateKey: 'text_625fd165963a7b00c8f598a0',
        })

        if (
          origin === REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE &&
          originSubscriptionId &&
          !!originCustomerId
        ) {
          navigate(
            generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
              customerId: originCustomerId,
              subscriptionId: originSubscriptionId,
              tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
            }),
          )
        } else if (
          origin === REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE &&
          !!originSubscriptionId &&
          updatePlan?.id
        ) {
          navigate(
            generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
              planId: updatePlan?.id,
              subscriptionId: originSubscriptionId,
              tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
            }),
          )
        } else {
          navigate(
            generatePath(PLAN_DETAILS_ROUTE, {
              planId: updatePlan.id,
              tab: PlanDetailsTabsOptionsEnum.overview,
            }),
          )
        }
      }
    },
  })

  const form = useAppForm({
    defaultValues: buildDefaultValues(plan, type, initialCurrency, hasAnyPricingUnitConfigured),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: planFormSchema,
    },
    onSubmit: ({ value }) => {
      const serializedInput = serializePlanInput(value)

      if (type === FORM_TYPE_ENUM.edition) {
        return update({
          variables: {
            input: { ...serializedInput, id },
          },
        })
      }

      return create({
        variables: {
          input: serializedInput,
        },
      })
    },
  })

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

  // Re-initialize form when plan data loads (replaces enableReinitialize)
  const prevPlanRef = useRef(plan)

  useEffect(() => {
    if (plan && plan !== prevPlanRef.current) {
      form.reset(buildDefaultValues(plan, type, initialCurrency, hasAnyPricingUnitConfigured), {
        keepDefaultValues: false,
      })
      prevPlanRef.current = plan
    }
  }, [plan, type, initialCurrency, hasAnyPricingUnitConfigured, form])

  // Clear duplicate plan var when leaving the page
  useEffect(() => {
    return () => {
      if (type === FORM_TYPE_ENUM.duplicate) {
        resetDuplicatePlanVar()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'plan')) {
      navigate(ERROR_404_ROUTE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  // Propagate server-side code error to TanStack form (same pattern as CreateCoupon)
  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onDynamic: { message: 'text_632a2d437e341dcc76817556' },
        },
      }))
      scrollToTop('[data-centered-page-wrapper]')
    }
  }, [errorCode, form])

  // Clear code error when the code field value changes
  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: { ...meta.errorMap, onDynamic: undefined },
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state.values.code])

  // Auto-reset billChargesMonthly when conditions aren't met
  const charges = useStore(form.store, (s) => s.values.charges)
  const billChargesMonthly = useStore(form.store, (s) => s.values.billChargesMonthly)
  const interval = useStore(form.store, (s) => s.values.interval)
  const isAnnual = isPlanIntervalAnnual(interval)

  useEffect(() => {
    if ((!charges || !charges.length || !isAnnual) && !!billChargesMonthly) {
      form.setFieldValue('billChargesMonthly', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charges, billChargesMonthly, interval])

  return useMemo(
    () => ({
      form,
      isEdition,
      loading,
      type,
      plan,
    }),
    [form, isEdition, loading, type, plan],
  )
}
