import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { TerminateCouponFragment, useTerminateCouponMutation } from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  fragment TerminateCoupon on Coupon {
    id
    name
  }

  mutation terminateCoupon($input: TerminateCouponInput!) {
    terminateCoupon(input: $input) {
      id
    }
  }
`

export interface TerminateCouponDialogRef extends WarningDialogRef {}

interface TerminateCouponDialogProps {
  coupon: TerminateCouponFragment
}

export const TerminateCouponDialog = forwardRef<DialogRef, TerminateCouponDialogProps>(
  ({ coupon }: TerminateCouponDialogProps, ref) => {
    const [deleteCoupon] = useTerminateCouponMutation({
      onCompleted(data) {
        if (data && data.terminateCoupon) {
          addToast({
            message: translate('text_628b432fd8f2bc0105b9746a'),
            severity: 'success',
          })
        }
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_628b432fd8f2bc0105b973ec', {
          couponName: coupon.name,
        })}
        description={<Typography html={translate('text_628b432fd8f2bc0105b973f4')} />}
        onContinue={async () =>
          await deleteCoupon({
            variables: { input: { id: coupon.id } },
            refetchQueries: ['coupons'],
          })
        }
        continueText={translate('text_628b432fd8f2bc0105b97404')}
      />
    )
  }
)

TerminateCouponDialog.displayName = 'TerminateCouponDialog'
