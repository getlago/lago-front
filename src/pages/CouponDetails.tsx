import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { CouponDetailsActivityLogs } from '~/components/coupons/CouponDetailsActivityLogs'
import { CouponDetailsOverview } from '~/components/coupons/CouponDetailsOverview'
import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import {
  TerminateCouponDialog,
  TerminateCouponDialogRef,
} from '~/components/coupons/TerminateCouponDialog'
import { formatCouponValue } from '~/components/coupons/utils'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { CouponDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { COUPON_DETAILS_ROUTE, COUPONS_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import {
  DeleteCouponFragmentDoc,
  TerminateCouponFragmentDoc,
  useGetCouponForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { usePermissionsCouponActions } from '~/hooks/usePermissionsCouponActions'

gql`
  fragment CouponDetailsForHeader on Coupon {
    name
    status
    couponType
    percentageRate
    amountCents
    amountCurrency
    frequency
  }

  query getCouponForDetails($id: ID!) {
    coupon(id: $id) {
      id
      ...CouponDetailsForHeader
      ...DeleteCoupon
      ...TerminateCoupon
    }
  }

  ${DeleteCouponFragmentDoc}
  ${TerminateCouponFragmentDoc}
`

const CouponDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { couponId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const couponActions = usePermissionsCouponActions()

  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)
  const terminateDialogRef = useRef<TerminateCouponDialogRef>(null)

  const { data, loading } = useGetCouponForDetailsQuery({
    variables: {
      id: couponId as string,
    },
    skip: !couponId,
  })

  const coupon = data?.coupon

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: 'coupon-details-actions',
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: 'coupon-details-edit',
          hidden: !couponActions.canEdit(),
          onClick: (closePopper) => {
            navigate(generatePath(UPDATE_COUPON_ROUTE, { couponId: couponId as string }))
            closePopper()
          },
        },
        {
          label: translate('text_62876a50ea3bba00b56d2cbc'),
          hidden: !coupon || !couponActions.canTerminate(coupon),
          onClick: (closePopper) => {
            if (coupon) terminateDialogRef.current?.openDialog(coupon)
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          hidden: !coupon || !couponActions.canDelete(),
          dataTest: 'coupon-details-delete',
          onClick: (closePopper) => {
            if (!coupon) return

            deleteDialogRef.current?.openDialog({
              couponId: coupon.id,
              callback: () => {
                navigate(COUPONS_ROUTE)
              },
            })
            closePopper()
          },
        },
      ],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[{ label: translate('text_62865498824cc10126ab2956'), path: COUPONS_ROUTE }]}
        entity={{
          viewName: coupon?.name || '',
          viewNameLoading: loading,
          metadata: `${formatCouponValue({
            couponType: coupon?.couponType,
            percentageRate: coupon?.percentageRate,
            amountCents: coupon?.amountCents,
            amountCurrency: coupon?.amountCurrency,
          })} ${coupon?.frequency}`,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(COUPON_DETAILS_ROUTE, {
              couponId: couponId as string,
              tab: CouponDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                <CouponDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(COUPON_DETAILS_ROUTE, {
              couponId: couponId as string,
              tab: CouponDetailsTabsOptionsEnum.activityLogs,
            }),
            content: (
              <DetailsPage.Container>
                <CouponDetailsActivityLogs couponId={couponId as string} />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      <>{activeTabContent}</>

      <DeleteCouponDialog ref={deleteDialogRef} />
      <TerminateCouponDialog ref={terminateDialogRef} />
    </>
  )
}

export default CouponDetails
