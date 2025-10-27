import { gql } from '@apollo/client'
import { FormikProps, useFormik } from 'formik'
import { debounce } from 'lodash'
import { useEffect, useMemo } from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { array, boolean, number, object, string } from 'yup'

import {
  LocalPricingUnitType,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import { transformFilterObjectToString } from '~/components/plans/utils'
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
import { chargeSchema } from '~/formValidation/chargeSchema'
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
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const DEBOUNCE_MS = window.Cypress ? 0 : 150

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

interface UsePlanFormReturn {
  formikProps: FormikProps<PlanFormInput>
  isEdition: boolean
  loading: boolean
  plan?: (Omit<EditPlanFragment, 'name' | 'code'> & { name?: string; code?: string }) | null
  type: PLAN_FORM_TYPE
}

export const usePlanForm: ({
  planIdToFetch,
  isUsedInSubscriptionForm,
}: {
  planIdToFetch?: string
  isUsedInSubscriptionForm?: boolean
}) => UsePlanFormReturn = ({ planIdToFetch, isUsedInSubscriptionForm }) => {
  const navigate = useNavigate()
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const { planId: id } = useParams()
  const { hasAnyPricingUnitConfigured } = useCustomPricingUnits()
  const { parentId, type: actionType } = useDuplicatePlanVar()
  const { data, loading, error } = useGetSinglePlanQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: (id as string) || (parentId as string) || (planIdToFetch as string) },
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
  const onSave =
    type === FORM_TYPE_ENUM.edition
      ? async (values: PlanFormInput) => {
          await update({
            variables: {
              input: { id: id as string, ...serializePlanInput(values) },
            },
          })
        }
      : async (values: PlanFormInput) => {
          await create({
            variables: {
              input: {
                ...serializePlanInput(values),
              },
            },
          })
        }

  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
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
        ? ''
        : String(deserializeAmount(plan?.amountCents || 0, initialCurrency)),
      amountCurrency: initialCurrency,
      trialPeriod:
        plan?.trialPeriod === null || plan?.trialPeriod === undefined
          ? isEdition
            ? 0
            : undefined
          : plan?.trialPeriod,
      billChargesMonthly: plan?.billChargesMonthly || undefined,
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
      fixedCharges: [],
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
                // Used to not enable submit button on invoiceDisplayName reset
                invoiceDisplayName: invoiceDisplayName || '',
                taxes: taxes || [],
                minAmountCents:
                  // Some plan have been saved with minAmountCents as 0 string but it makes the sub form send an override plan each time
                  // This || minAmountCents === '0' serves to prevent this to happen
                  isNaN(minAmountCents) || minAmountCents === '0'
                    ? undefined
                    : String(
                        deserializeAmount(
                          minAmountCents || 0,
                          plan.amountCurrency || CurrencyEnum.Usd,
                        ),
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
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: string().required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')).nullable(),
      amountCurrency: string().required(''),
      entitlements: array().of(
        object().shape({
          featureCode: string().required(''),
          privileges: array().of(
            object().shape({
              privilegeCode: string().required(''),
              privilegeName: string().required(''),
              value: string().required(''),
            }),
          ),
        }),
      ),
      minimumCommitment: object()
        .test({
          test: function (value, { from }) {
            if (from && from[1]) {
              // If minimum commitment is an empty object
              if (
                from[1]?.value?.minimumCommitment &&
                !Object.keys(from[1]?.value?.minimumCommitment).length
              ) {
                return true
              }
              // If no minimum commitment amount cents is defined but object is present
              if (
                from[1]?.value?.minimumCommitment &&
                !Number(from[1]?.value?.minimumCommitment?.amountCents)
              ) {
                return false
              }
            }

            return true
          },
        })
        .nullable(),
      charges: chargeSchema,
      nonRecurringUsageThresholds: array()
        .test({
          test: (nonRecurringUsageThresholds) => {
            let isValid = true

            if (!nonRecurringUsageThresholds) {
              return true
            }

            if (nonRecurringUsageThresholds?.length === 0) {
              return false
            }

            nonRecurringUsageThresholds?.every(({ amountCents }, i) => {
              if (amountCents === undefined) {
                isValid = false
                return false
              }

              if (i === 0 && Number(amountCents) <= 0) {
                isValid = false
                return false
              }

              const previousThreshold = nonRecurringUsageThresholds[i - 1]

              if (
                previousThreshold &&
                Number(amountCents) <= Number(previousThreshold.amountCents)
              ) {
                isValid = false
                return false
              }

              return true
            })

            return isValid
          },
        })
        .nullable()
        .default(undefined),
      recurringUsageThreshold: object()
        .shape({
          amountCents: number().required().moreThan(0),
        })
        .nullable()
        .default(undefined),
      cascadeUpdates: boolean(),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    validateOnChange: false,
    // In subscription form, the form should be valid by default whereas in create/edit plan form, it should not
    isInitialValid: !!isUsedInSubscriptionForm,
    onSubmit: onSave,
  })

  const debouncedValidate = useMemo(
    () => debounce(formikProps.validateForm, DEBOUNCE_MS, { leading: true }),
    [formikProps.validateForm],
  )

  useEffect(() => {
    debouncedValidate(formikProps.values)
  }, [formikProps.values, debouncedValidate])

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

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

  const isAnnual = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
    formikProps.values.interval,
  )

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

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      scrollToTop()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  useEffect(() => {
    if (
      (!formikProps.values.charges || !formikProps.values.charges.length || !isAnnual) &&
      !!formikProps.values.billChargesMonthly
    ) {
      formikProps.setFieldValue('billChargesMonthly', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikProps.values.charges,
    formikProps.values.billChargesMonthly,
    formikProps.values.interval,
  ])

  return useMemo(
    () => ({
      formikProps,
      isEdition,
      loading,
      type,
      plan,
    }),
    [formikProps, isEdition, loading, type, plan],
  )
}
