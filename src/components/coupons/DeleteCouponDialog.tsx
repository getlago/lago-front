import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteCouponFragment, useDeleteCouponMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCoupon on Coupon {
    id
    name
  }

  mutation deleteCoupon($input: DestroyCouponInput!) {
    destroyCoupon(input: $input) {
      id
    }
  }
`

export interface DeleteCouponDialogRef {
  openDialog: (coupon: DeleteCouponFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteCouponDialog = forwardRef<DeleteCouponDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [coupon, setCoupon] = useState<DeleteCouponFragment | undefined>(undefined)

  const [deleteCoupon] = useDeleteCouponMutation({
    onCompleted(data) {
      if (data && data.destroyCoupon) {
        addToast({
          message: translate('text_628b432fd8f2bc0105b9746f'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyCoupon) return
      const cacheId = cache.identify({
        id: data?.destroyCoupon.id,
        __typename: 'Coupon',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setCoupon(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_628b432fd8f2bc0105b973ee', {
        couponName: coupon?.name,
      })}
      description={<Typography html={translate('text_628b432fd8f2bc0105b973f6')} />}
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
