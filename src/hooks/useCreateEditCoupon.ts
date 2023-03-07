import { useMemo, useEffect, useState } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'

import {
  CreateCouponInput,
  useCreateCouponMutation,
  useGetSingleCouponQuery,
  EditCouponFragment,
  CouponItemFragmentDoc,
  useUpdateCouponMutation,
  UpdateCouponInput,
  CouponExpiration,
  CouponTypeEnum,
  CouponFrequency,
  LagoApiError,
  CurrencyEnum,
  PlansForCouponsFragmentDoc,
  PlansForCouponsFragment,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, COUPONS_ROUTE } from '~/core/router'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { serializeAmount } from '~/core/serializers/serializeAmount'

export enum FORM_ERRORS_ENUM {
  existingCode = 'existingCode',
}

gql`
  fragment EditCoupon on Coupon {
    id
    amountCents
    name
    amountCurrency
    code
    reusable
    expiration
    expirationAt
    couponType
    percentageRate
    frequency
    frequencyDuration
    appliedCouponsCount
    limitedPlans
    plans {
      ...PlansForCoupons
    }
  }

  query getSingleCoupon($id: ID!) {
    coupon(id: $id) {
      ...EditCoupon
    }
  }

  mutation createCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id
    }
  }

  mutation updateCoupon($input: UpdateCouponInput!) {
    updateCoupon(input: $input) {
      ...CouponItem
    }
  }

  ${CouponItemFragmentDoc}
  ${PlansForCouponsFragmentDoc}
`

type UseCreateEditCouponReturn = {
  loading: boolean
  isEdition: boolean
  coupon?: EditCouponFragment
  errorCode?: string
  hasPlanLimit: boolean
  setHasPlanLimit: Function
  limitPlansList: PlansForCouponsFragment[]
  setLimitPlansList: Function
  onSave: (value: CreateCouponInput | UpdateCouponInput) => Promise<void>
}

const formatCouponInput = (
  values: CreateCouponInput | UpdateCouponInput,
  hasPlanLimit: boolean,
  limitPlansList: PlansForCouponsFragment[]
) => {
  const {
    amountCents,
    amountCurrency,
    expirationAt,
    percentageRate,
    frequencyDuration,
    ...others
  } = values

  return {
    amountCents:
      values.couponType === CouponTypeEnum.FixedAmount
        ? serializeAmount(Number(amountCents), amountCurrency || CurrencyEnum.Usd)
        : undefined,
    amountCurrency: values.couponType === CouponTypeEnum.FixedAmount ? amountCurrency : undefined,
    percentageRate:
      values.couponType === CouponTypeEnum.Percentage ? Number(percentageRate) : undefined,
    expirationAt:
      values.expiration === CouponExpiration.NoExpiration && expirationAt
        ? undefined
        : expirationAt,
    frequencyDuration:
      values.frequency === CouponFrequency.Recurring ? frequencyDuration : undefined,
    appliesTo:
      hasPlanLimit && limitPlansList.length
        ? { planIds: limitPlansList.map((p: PlansForCouponsFragment) => p.id) || [] }
        : { planIds: [] },
    ...others,
  }
}

export const useCreateEditCoupon: () => UseCreateEditCouponReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useGetSingleCouponQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: id as string },
    skip: !id,
  })
  const [hasPlanLimit, setHasPlanLimit] = useState<boolean>(!!data?.coupon?.limitedPlans)
  const [limitPlansList, setLimitPlansList] = useState<PlansForCouponsFragment[]>(
    data?.coupon?.plans || []
  )
  const [create, { error: createError }] = useCreateCouponMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createCoupon }) {
      if (!!createCoupon) {
        addToast({
          severity: 'success',
          translateKey: 'text_633336532bdf72cb62dc0690',
        })
        navigate(COUPONS_ROUTE)
      }
    },
  })
  const [update, { error: updateError }] = useUpdateCouponMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateCoupon }) {
      if (!!updateCoupon) {
        addToast({
          severity: 'success',
          translateKey: 'text_6287a9bdac160c00b2e0fc81',
        })
        navigate(COUPONS_ROUTE)
      }
    },
  })

  useEffect(() => {
    if (!loading) {
      setHasPlanLimit(!!data?.coupon?.limitedPlans)
      setLimitPlansList(data?.coupon?.plans || [])
    }
  }, [loading, data?.coupon?.limitedPlans, data?.coupon?.plans])

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'coupon')) {
      navigate(ERROR_404_ROUTE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

  return useMemo(
    () => ({
      loading,
      hasPlanLimit,
      setHasPlanLimit,
      limitPlansList,
      setLimitPlansList,
      isEdition: !!id,
      errorCode,
      coupon: !data?.coupon ? undefined : data?.coupon,
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id,
                  ...formatCouponInput(values, hasPlanLimit, limitPlansList),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: formatCouponInput(values, hasPlanLimit, limitPlansList),
              },
            })
          },
    }),
    [id, data, loading, errorCode, create, update, hasPlanLimit, limitPlansList]
  )
}
