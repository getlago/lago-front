import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  GetCouponForDetailsOverviewDocument,
  TerminateCouponFragment,
  useTerminateCouponMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

export interface TerminateCouponDialogRef {
  openDialog: (coupon: TerminateCouponFragment) => unknown
  closeDialog: () => unknown
}

export const TerminateCouponDialog = forwardRef<TerminateCouponDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [coupon, setCoupon] = useState<TerminateCouponFragment | undefined>(undefined)

  const [deleteCoupon] = useTerminateCouponMutation({
    variables: {
      input: {
        id: coupon?.id || '',
      },
    },
    onCompleted(data) {
      if (data && data.terminateCoupon) {
        addToast({
          message: translate('text_628b432fd8f2bc0105b9746a'),
          severity: 'success',
        })
      }
    },
    refetchQueries: [
      'coupons',
      { query: GetCouponForDetailsOverviewDocument, variables: { id: coupon?.id } },
    ],
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
      title={translate('text_628b432fd8f2bc0105b973ec', { couponName: coupon?.name })}
      description={<Typography html={translate('text_628b432fd8f2bc0105b973f4')} />}
      onContinue={async () => await deleteCoupon()}
      continueText={translate('text_628b432fd8f2bc0105b97404')}
    />
  )
})

TerminateCouponDialog.displayName = 'TerminateCouponDialog'
