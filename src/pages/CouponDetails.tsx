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
import {
  Button,
  NavigationTab,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { CouponDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { COUPON_DETAILS_ROUTE, COUPONS_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import {
  CouponStatusEnum,
  DeleteCouponFragmentDoc,
  TerminateCouponFragmentDoc,
  useGetCouponForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

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
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const { couponId } = useParams()
  const { isPremium } = useCurrentUser()

  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)
  const terminateDialogRef = useRef<TerminateCouponDialogRef>(null)

  const { data, loading } = useGetCouponForDetailsQuery({
    variables: {
      id: couponId as string,
    },
    skip: !couponId,
  })

  const coupon = data?.coupon

  const shouldShowActions = hasPermissions(['couponsCreate', 'couponsUpdate', 'couponsDelete'])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              navigate(COUPONS_ROUTE)
            }}
          />
          {loading && !coupon ? (
            <Skeleton variant="text" className="w-50" />
          ) : (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="coupon-details-name"
            >
              {coupon?.name}
            </Typography>
          )}
        </PageHeader.Group>

        {shouldShowActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down" data-test="coupon-details-actions">
                {translate('text_626162c62f790600f850b6fe')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Tooltip
                  title={translate('text_62878d88ea3bba00b56d3412')}
                  disableHoverListener={coupon?.status !== CouponStatusEnum.Terminated}
                >
                  <Button
                    fullWidth
                    data-test="coupon-details-edit"
                    variant="quaternary"
                    align="left"
                    disabled={coupon?.status === CouponStatusEnum.Terminated}
                    onClick={() => {
                      navigate(generatePath(UPDATE_COUPON_ROUTE, { couponId: couponId as string }))
                      closePopper()
                    }}
                  >
                    {translate('text_625fd39a15394c0117e7d792')}
                  </Button>
                </Tooltip>
                {coupon && (
                  <>
                    <Tooltip
                      title={translate('text_62878d88ea3bba00b56d33cf')}
                      disableHoverListener={coupon?.status !== CouponStatusEnum.Terminated}
                    >
                      <Button
                        fullWidth
                        variant="quaternary"
                        align="left"
                        disabled={coupon?.status === CouponStatusEnum.Terminated}
                        onClick={() => {
                          terminateDialogRef.current?.openDialog(coupon)
                          closePopper()
                        }}
                      >
                        {translate('text_62876a50ea3bba00b56d2cbc')}
                      </Button>
                    </Tooltip>
                    <Button
                      fullWidth
                      data-test="coupon-details-delete"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        deleteDialogRef.current?.openDialog({
                          couponId: coupon.id,
                          callback: () => {
                            navigate(COUPONS_ROUTE)
                          },
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_629728388c4d2300e2d38182')}
                    </Button>
                  </>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={loading}
        icon="coupon"
        title={coupon?.name || ''}
        description={`${formatCouponValue({
          couponType: coupon?.couponType,
          percentageRate: coupon?.percentageRate,
          amountCents: coupon?.amountCents,
          amountCurrency: coupon?.amountCurrency,
        })} ${coupon?.frequency}`}
      />

      <NavigationTab
        className="px-4 md:px-12"
        loading={loading}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(COUPON_DETAILS_ROUTE, {
              couponId: couponId as string,
              tab: CouponDetailsTabsOptionsEnum.overview,
            }),
            component: (
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
            component: (
              <DetailsPage.Container className="max-w-none">
                <CouponDetailsActivityLogs couponId={couponId as string} />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      <DeleteCouponDialog ref={deleteDialogRef} />
      <TerminateCouponDialog ref={terminateDialogRef} />
    </>
  )
}

export default CouponDetails
