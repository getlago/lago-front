import { gql } from '@apollo/client'
import { memo, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { CouponCaption, CouponMixedType } from '~/components/coupons/CouponCaption'
import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import { Button, Icon, Table, Tooltip, Typography } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  AppliedCouponCaptionFragmentDoc,
  useGetCustomerCouponsQuery,
  useRemoveCouponMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment CustomerCoupon on AppliedCoupon {
    id
    ...AppliedCouponCaption
    coupon {
      id
      name
    }
  }

  fragment CustomerAppliedCoupons on Customer {
    id
    appliedCoupons {
      ...CustomerCoupon
    }
  }

  query getCustomerCoupons($id: ID!) {
    customer(id: $id) {
      id
      name
      displayName
      ...CustomerAppliedCoupons
    }
  }

  mutation removeCoupon($input: TerminateAppliedCouponInput!) {
    terminateAppliedCoupon(input: $input) {
      id
    }
  }

  ${AppliedCouponCaptionFragmentDoc}
`

export const CustomerCoupons = memo(() => {
  const { customerId } = useParams()
  const { hasPermissions } = usePermissions()
  const removeDialogRef = useRef<WarningDialogRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const deleteCouponId = useRef<string | null>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetCustomerCouponsQuery({
    variables: { id: customerId as string },
    skip: !customerId,
  })
  const coupons = data?.customer?.appliedCoupons
  const [removeCoupon] = useRemoveCouponMutation({
    onCompleted({ terminateAppliedCoupon }) {
      if (!!terminateAppliedCoupon) {
        addToast({
          severity: 'success',
          message: translate('text_628b8c693e464200e00e49d1'),
        })
      }
    },
    refetchQueries: ['getCustomerCoupons'],
  })

  return (
    <>
      {!!(coupons || [])?.length && (
        <div className="flex flex-col" data-test="customer-coupon-container">
          <PageSectionTitle
            title={translate('text_62865498824cc10126ab2956')}
            subtitle={translate('text_1736950586920yq3xq4gols8')}
            action={{
              title: translate('text_628b8dc14c71840130f8d8a1'),
              onClick: () => {
                addCouponDialogRef.current?.openDialog()
              },
            }}
          />

          <Table
            name="customer-coupons"
            data={coupons || []}
            containerSize={4}
            isLoading={loading}
            rowDataTestId={(coupon) => coupon.coupon?.name}
            columns={[
              {
                key: 'coupon.name',
                title: translate('text_62865498824cc10126ab2960'),
                content: ({ coupon: { name } }) => (
                  <div className="flex items-center gap-3">
                    <Icon name="coupon" color="dark" />

                    <Typography className="text-nowrap text-base font-medium text-grey-700">
                      {name}
                    </Typography>
                  </div>
                ),
              },
              {
                key: 'amountCurrency',
                maxSpace: true,
                title: translate('text_632d68358f1fedc68eed3e9d'),
                content: (coupon) => (
                  <CouponCaption
                    className="text-nowrap text-base font-normal text-grey-600"
                    coupon={coupon as unknown as CouponMixedType}
                  />
                ),
              },
            ]}
            actionColumn={(coupon) =>
              hasPermissions(['couponsDetach']) && (
                <Tooltip
                  className="ml-auto"
                  placement="top-end"
                  title={translate('text_628b8c693e464200e00e4a10')}
                >
                  <Button
                    variant="quaternary"
                    icon="trash"
                    onClick={() => {
                      deleteCouponId.current = coupon.id
                      removeDialogRef?.current?.openDialog()
                    }}
                  />
                </Tooltip>
              )
            }
          />
        </div>
      )}

      <WarningDialog
        ref={removeDialogRef}
        title={translate('text_628b8c693e464200e00e465f')}
        description={translate('text_628b8c693e464200e00e466d')}
        onContinue={async () => {
          if (deleteCouponId.current) {
            await removeCoupon({
              variables: { input: { id: deleteCouponId.current } },
            })
          }
        }}
        continueText={translate('text_628b8c693e464200e00e4689')}
      />

      <AddCouponToCustomerDialog ref={addCouponDialogRef} customer={data?.customer} />
    </>
  )
})

CustomerCoupons.displayName = 'CustomerCoupons'
