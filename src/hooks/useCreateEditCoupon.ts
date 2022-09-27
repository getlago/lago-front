import { useMemo } from 'react'
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
} from '~/generated/graphql'
import { ERROR_404_ROUTE, COUPONS_ROUTE } from '~/core/router'
import { addToast } from '~/core/apolloClient'

gql`
  fragment EditCoupon on CouponDetails {
    id
    amountCents
    name
    amountCurrency
    code
    expiration
    expirationDate
    canBeDeleted
    couponType
    percentageRate
    frequency
    frequencyDuration
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
`

type UseCreateEditCouponReturn = {
  loading: boolean
  isEdition: boolean
  coupon?: EditCouponFragment
  onSave: (value: CreateCouponInput | UpdateCouponInput) => Promise<void>
}

const formatCouponInput = (values: CreateCouponInput | UpdateCouponInput) => {
  const {
    amountCents,
    amountCurrency,
    expirationDate,
    percentageRate,
    frequencyDuration,
    ...others
  } = values

  return {
    amountCents:
      values.couponType === CouponTypeEnum.FixedAmount
        ? Math.round(Number(amountCents) * 100)
        : undefined,
    amountCurrency: values.couponType === CouponTypeEnum.FixedAmount ? amountCurrency : undefined,
    percentageRate:
      values.couponType === CouponTypeEnum.Percentage ? Number(percentageRate) : undefined,
    expirationDate:
      values.expiration === CouponExpiration.NoExpiration && expirationDate
        ? undefined
        : expirationDate,
    frequencyDuration:
      values.frequency === CouponFrequency.Recurring ? frequencyDuration : undefined,
    ...others,
  }
}

export const useCreateEditCoupon: () => UseCreateEditCouponReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useGetSingleCouponQuery({
    // @ts-ignore
    variables: { id },
    skip: !id,
  })
  const [create] = useCreateCouponMutation({
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
  const [update] = useUpdateCouponMutation({
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

  if (error) {
    navigate(ERROR_404_ROUTE) // TODO on error "not_found"
  }

  return useMemo(
    () => ({
      loading,
      isEdition: !!id,
      coupon: !data?.coupon ? undefined : data?.coupon,
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id,
                  ...formatCouponInput(values),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: formatCouponInput(values),
              },
            })
          },
    }),
    [id, data, loading, create, update]
  )
}
