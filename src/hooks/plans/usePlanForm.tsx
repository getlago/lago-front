import { gql } from '@apollo/client'
import { FormikProps, useFormik } from 'formik'
import { useEffect, useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { array, number, object, string } from 'yup'

import { LocalChargeInput, PlanFormInput } from '~/components/plans/types'
import { transformFilterObjectToString } from '~/components/plans/utils'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  PLAN_FORM_TYPE,
  resetDuplicatePlanVar,
  useDuplicatePlanVar,
} from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import { FORM_ERRORS_ENUM, FORM_TYPE_ENUM } from '~/core/constants/form'
import { ERROR_404_ROUTE, PLAN_DETAILS_ROUTE } from '~/core/router'
import { serializePlanInput } from '~/core/serializers'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
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
import { PlanDetailsTabsOptionsEnum } from '~/pages/PlanDetails'

import { useInternationalization } from '../core/useInternationalization'
import { useOrganizationInfos } from '../useOrganizationInfos'

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
  errorCode?: string
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
  const { planId: id } = useParams()
  const { parentId, type: actionType } = useDuplicatePlanVar()
  const { data, loading, error } = useGetSinglePlanQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: (id as string) || (parentId as string) || (planIdToFetch as string) },
    skip: !id && !parentId && !planIdToFetch,
  })
  const isDuplicate = actionType === 'duplicate' && !!parentId
  const type = !!id
    ? FORM_TYPE_ENUM.edition
    : isDuplicate
      ? FORM_TYPE_ENUM.duplicate
      : FORM_TYPE_ENUM.creation

  const isEdition = type === FORM_TYPE_ENUM.edition
  const plan = data?.plan
  const initialCurrency =
    type === FORM_TYPE_ENUM.creation && !isUsedInSubscriptionForm
      ? organization?.defaultCurrency
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
      interval: plan?.interval || PlanInterval.Monthly,
      taxes: plan?.taxes || [],
      invoiceDisplayName: plan?.invoiceDisplayName || undefined,
      payInAdvance: plan?.payInAdvance || false,
      amountCents: isNaN(plan?.amountCents)
        ? ''
        : String(deserializeAmount(plan?.amountCents || 0, initialCurrency || CurrencyEnum.Usd)),
      amountCurrency: initialCurrency || CurrencyEnum.Usd,
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
              deserializeAmount(
                plan?.minimumCommitment.amountCents || 0,
                initialCurrency || CurrencyEnum.Usd,
              ),
            ),
          }
        : {},
      usageThresholds:
        plan?.usageThresholds && plan?.usageThresholds.length > 0
          ? plan?.usageThresholds.map((threshold) => ({
              ...threshold,
              amountCents: deserializeAmount(
                threshold.amountCents || 0,
                initialCurrency || CurrencyEnum.Usd,
              ),
            }))
          : undefined,
      charges: plan?.charges
        ? (plan?.charges.map(
            ({
              taxes,
              properties,
              minAmountCents,
              payInAdvance,
              invoiceDisplayName,
              filters,
              ...charge
            }) => ({
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
            }),
          ) as LocalChargeInput[])
        : ([] as LocalChargeInput[]),
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: string().required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')).nullable(),
      amountCurrency: string().required(''),
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
      usageThresholds: array().test({
        test: (thresholds) => {
          let isValid = true

          const nonRecurringThreshold = thresholds?.filter(({ recurring }) => !recurring)

          nonRecurringThreshold?.every(({ amountCents }, i) => {
            if (amountCents === undefined) {
              isValid = false
              return false
            }

            if (i === 0 && Number(amountCents) <= 0) {
              isValid = false
              return false
            }

            const previousThreshold = nonRecurringThreshold[i - 1]

            if (previousThreshold && Number(amountCents) <= Number(previousThreshold.amountCents)) {
              isValid = false
              return false
            }

            return true
          })

          const hasRecurringThreshold = thresholds?.find(({ recurring }) => !!recurring)

          if (hasRecurringThreshold && hasRecurringThreshold.amountCents === undefined) {
            isValid = false
          }

          return isValid
        },
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    // In subscription form, the form should be valid by default whereas in create/edit plan form, it should not
    isInitialValid: !!isUsedInSubscriptionForm,
    onSubmit: onSave,
  })

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
        addToast({
          severity: 'success',
          translateKey: 'text_625fd165963a7b00c8f598a0',
        })
        navigate(
          generatePath(PLAN_DETAILS_ROUTE, {
            planId: updatePlan.id,
            tab: PlanDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

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
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  useEffect(() => {
    if (
      (!formikProps.values.charges ||
        !formikProps.values.charges.length ||
        formikProps.values.interval !== PlanInterval.Yearly) &&
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
      errorCode,
      formikProps,
      isEdition,
      loading,
      type,
      plan,
    }),
    [errorCode, formikProps, isEdition, loading, type, plan],
  )
}
