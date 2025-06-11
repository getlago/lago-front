import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Skeleton, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { useDeleteCouponMutation, useGetCouponToDeleteLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCoupon on Coupon {
    id
    name
    appliedCouponsCount
  }

  query getCouponToDelete($id: ID!) {
    coupon(id: $id) {
      ...DeleteCoupon
    }
  }

  mutation deleteCoupon($input: DestroyCouponInput!) {
    destroyCoupon(input: $input) {
      id
    }
  }
`

type DeleteCouponDialogProps = {
  couponId: string
  callback?: () => void
}

export interface DeleteCouponDialogRef {
  openDialog: ({ couponId, callback }: DeleteCouponDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteCouponDialog = forwardRef<DeleteCouponDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<DeleteCouponDialogProps | undefined>(undefined)
  const [getCouponToDelete, { data: couponData, loading: couponLoading }] =
    useGetCouponToDeleteLazyQuery({
      nextFetchPolicy: 'cache-only',
    })
  const coupon = couponData?.coupon

  const [deleteCoupon] = useDeleteCouponMutation({
    onCompleted(data) {
      if (data && data.destroyCoupon) {
        addToast({
          message: translate('text_628b432fd8f2bc0105b9746f'),
          severity: 'success',
        })

        localData?.callback && localData.callback()
      }
    },
    refetchQueries: ['coupons'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      getCouponToDelete({ variables: { id: data.couponId } })
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={
        couponLoading ? (
          <Skeleton className="mb-5 h-4 w-full" variant="text" />
        ) : (
          translate('text_628b432fd8f2bc0105b973ee', {
            couponName: coupon?.name,
          })
        )
      }
      description={(() => {
        if (couponLoading) {
          return (
            <>
              <Skeleton className="mb-4 w-full" variant="text" />
              <Skeleton className="w-full" variant="text" />
            </>
          )
        }
        if (!!coupon?.appliedCouponsCount) {
          return (
            <Typography
              html={translate(
                'text_17364422965884zgujkr1l7j',
                { appliedCouponsCount: coupon.appliedCouponsCount },
                coupon.appliedCouponsCount,
              )}
            />
          )
        }
        return <Typography html={translate('text_628b432fd8f2bc0105b973f6')} />
      })()}
      disableOnContinue={couponLoading}
      onContinue={async () =>
        await deleteCoupon({
          variables: { input: { id: coupon?.id || '' } },
        })
      }
      continueText={translate('text_628b432fd8f2bc0105b97406')}
    />
  )
})

DeleteCouponDialog.displayName = 'DeleteCouponDialog'
