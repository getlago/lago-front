import { gql } from '@apollo/client'
import { FormikProps, useFormik } from 'formik'
import { useEffect, useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { number, object, string } from 'yup'

import { LocalChargeInput, PlanFormInput } from '~/components/plans/types'
import {
  addToast,
  hasDefinedGQLError,
  PLAN_FORM_TYPE_ENUM,
  resetOverwritePlanVar,
  updateOverwritePlanVar,
  useOverwritePlanVar,
} from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { CUSTOMER_DETAILS_ROUTE, ERROR_404_ROUTE, PLANS_ROUTE } from '~/core/router'
import { serializePlanInput } from '~/core/serializers'
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
import { getPropertyShape } from '~/pages/CreatePlan'

import { useInternationalization } from '../core/useInternationalization'

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
    }
  }

  ${PlanItemFragmentDoc}
  ${DeletePlanDialogFragmentDoc}
  ${EditPlanFragmentDoc}
`

export type PLAN_FORM_TYPE = keyof typeof PLAN_FORM_TYPE_ENUM

export interface UsePlanFormReturn {
  errorCode?: string
  formikProps: FormikProps<PlanFormInput>
  isEdition: boolean
  loading: boolean
  parentPlanName?: string
  plan?: (Omit<EditPlanFragment, 'name' | 'code'> & { name?: string; code?: string }) | null
  type: PLAN_FORM_TYPE
  onClose: () => void
}

export const usePlanForm: () => UsePlanFormReturn = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { id } = useParams()
  const { parentId, subscriptionInput, customerId, type: actionType } = useOverwritePlanVar()
  const { data, loading, error } = useGetSinglePlanQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: (id as string) || (parentId as string) },
    skip: !id && !parentId,
  })
  const isOverride = actionType === 'override' && !!parentId
  const isDuplicate = actionType === 'duplicate' && !!parentId
  const type = !!id ? 'edition' : isDuplicate ? 'duplicate' : isOverride ? 'override' : 'creation'
  const isEdition = type === PLAN_FORM_TYPE_ENUM.edition
  const plan = data?.plan
  const shouldOffuscateForDuplicateAndOverride =
    type === PLAN_FORM_TYPE_ENUM.override || type === PLAN_FORM_TYPE_ENUM.duplicate
  const onSave =
    type === PLAN_FORM_TYPE_ENUM.edition
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
                ...(type === PLAN_FORM_TYPE_ENUM.override ? { parentId } : {}),
                ...serializePlanInput(values),
              },
            },
          })
        }

  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
      name: shouldOffuscateForDuplicateAndOverride ? '' : plan?.name || '',
      code: shouldOffuscateForDuplicateAndOverride ? '' : plan?.code || '',
      description: plan?.description || '',
      interval: plan?.interval || PlanInterval.Monthly,
      taxes: plan?.taxes || [],
      payInAdvance: plan?.payInAdvance || false,
      amountCents: isNaN(plan?.amountCents)
        ? ''
        : String(
            deserializeAmount(plan?.amountCents || 0, plan?.amountCurrency || CurrencyEnum.Usd)
          ),
      amountCurrency: plan?.amountCurrency || CurrencyEnum.Usd,
      trialPeriod:
        plan?.trialPeriod === null || plan?.trialPeriod === undefined
          ? isEdition
            ? 0
            : undefined
          : plan?.trialPeriod,
      billChargesMonthly: plan?.billChargesMonthly || undefined,
      charges: plan?.charges
        ? plan?.charges.map(
            ({ taxes, properties, groupProperties, minAmountCents, payInAdvance, ...charge }) => ({
              taxes: taxes || [],
              minAmountCents: isNaN(minAmountCents)
                ? undefined
                : String(
                    deserializeAmount(minAmountCents || 0, plan.amountCurrency || CurrencyEnum.Usd)
                  ),
              payInAdvance: payInAdvance || false,
              properties: properties ? getPropertyShape(properties) : undefined,
              groupProperties: groupProperties?.length
                ? groupProperties?.map((prop) => {
                    return {
                      groupId: prop.groupId,
                      values: getPropertyShape(prop.values),
                    }
                  })
                : [],
              ...charge,
            })
          )
        : ([] as LocalChargeInput[]),
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: string().required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')).nullable(),
      amountCurrency: string().required(''),
      charges: chargeSchema,
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const [create, { error: createError }] = useCreatePlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        if (type === PLAN_FORM_TYPE_ENUM.override) {
          addToast({
            severity: 'success',
            translateKey: 'text_632b3780e409ac86609cbd05',
          })
          updateOverwritePlanVar({
            type: 'override',
            subscriptionInput: { ...subscriptionInput, planId: createPlan?.id },
          })
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
        } else if (type === PLAN_FORM_TYPE_ENUM.duplicate) {
          addToast({
            severity: 'success',
            translateKey: 'text_64fa176933e3b8008e3f15eb',
          })
          navigate(PLANS_ROUTE)
        } else {
          addToast({
            severity: 'success',
            translateKey: 'text_633336532bdf72cb62dc0694',
          })
          navigate(PLANS_ROUTE)
        }
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
        navigate(PLANS_ROUTE)
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
      if (type === PLAN_FORM_TYPE_ENUM.duplicate) {
        resetOverwritePlanVar()
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
      parentPlanName: data?.plan?.name,
      onClose: () => {
        if (type === PLAN_FORM_TYPE_ENUM.override) {
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
        } else {
          navigate(PLANS_ROUTE)
        }
      },
    }),
    [errorCode, formikProps, isEdition, loading, type, plan, data?.plan?.name, navigate, customerId]
  )
}
