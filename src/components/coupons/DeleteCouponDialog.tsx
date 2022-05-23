import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { DeleteCouponFragment, useDeleteCouponMutation } from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'

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

export interface DeleteCouponDialogRef extends WarningDialogRef {}

interface DeleteCouponDialogProps {
  coupon: DeleteCouponFragment
}

export const DeleteCouponDialog = forwardRef<DialogRef, DeleteCouponDialogProps>(
  ({ coupon }: DeleteCouponDialogProps, ref) => {
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
    const { translate } = useI18nContext()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_628b432fd8f2bc0105b973ee', {
          couponName: coupon.name,
        })}
        description={<Typography html={translate('text_628b432fd8f2bc0105b973f6')} />}
        onContinue={async () =>
          await deleteCoupon({
            variables: { input: { id: coupon.id } },
          })
        }
        continueText={translate('text_628b432fd8f2bc0105b97406')}
      />
    )
  }
)

DeleteCouponDialog.displayName = 'DeleteCouponDialog'
