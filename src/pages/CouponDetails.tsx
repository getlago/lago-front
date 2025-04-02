import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import {
  TerminateCouponDialog,
  TerminateCouponDialogRef,
} from '~/components/coupons/TerminateCouponDialog'
import {
  Button,
  Card,
  Icon,
  Popper,
  Skeleton,
  Status,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  getCouponFrequencyTranslationKey,
  getCouponTypeTranslationKey,
} from '~/core/constants/form'
import { couponStatusMapping } from '~/core/constants/statusCouponMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { COUPONS_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CouponFrequency,
  CouponStatusEnum,
  CouponTypeEnum,
  CurrencyEnum,
  DeleteCouponFragmentDoc,
  TerminateCouponFragmentDoc,
  useGetCouponForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  fragment CouponDetails on Coupon {
    amountCents
    amountCurrency
    percentageRate
    code
    expirationAt
    name
    frequency
    reusable
    couponType
    status
    billableMetrics {
      id
      name
    }
    plans {
      id
      name
    }
  }

  query getCouponForDetails($id: ID!) {
    coupon(id: $id) {
      id
      ...CouponDetails
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
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { couponId } = useParams()

  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)
  const terminateDialogRef = useRef<TerminateCouponDialogRef>(null)

  const { data: couponResult, loading: isCouponLoading } = useGetCouponForDetailsQuery({
    variables: {
      id: couponId as string,
    },
    skip: !couponId,
  })

  const coupon = couponResult?.coupon

  const percentageRate = intlFormatNumber(Number(coupon?.percentageRate) / 100 || 0, {
    style: 'percent',
  })

  const amountWithCurrency = intlFormatNumber(
    deserializeAmount(coupon?.amountCents, coupon?.amountCurrency || CurrencyEnum.Usd) || 0,
    {
      currencyDisplay: 'symbol',
      currency: coupon?.amountCurrency || CurrencyEnum.Usd,
      minimumFractionDigits: 2,
      maximumFractionDigits: 15,
    },
  )

  const couponValue =
    coupon?.couponType === CouponTypeEnum.Percentage ? percentageRate : amountWithCurrency

  let limitationElement: Array<{ id: string; name: string }> = []

  if (!!coupon?.billableMetrics?.length) {
    limitationElement = coupon.billableMetrics
  } else if (!!coupon?.plans?.length) {
    limitationElement = coupon?.plans
  }

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
          {isCouponLoading && !coupon ? (
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
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
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
        isLoading={isCouponLoading}
        icon="coupon"
        title={coupon?.name || ''}
        description={`${couponValue} ${coupon?.frequency}`}
      />

      <DetailsPage.Container>
        {!coupon && isCouponLoading ? (
          <DetailsPage.Skeleton />
        ) : (
          <>
            <section>
              <DetailsPage.SectionTitle variant="subhead" noWrap>
                {translate('text_664cb90097bfa800e6efa3e4')}
              </DetailsPage.SectionTitle>
              <DetailsPage.InfoGrid
                grid={[
                  {
                    label: translate('text_62865498824cc10126ab2960'),
                    value: coupon?.name,
                  },
                  {
                    label: translate('text_664cb90097bfa800e6efa3e7'),
                    value: coupon?.code,
                  },
                  coupon?.couponType === CouponTypeEnum.FixedAmount && {
                    label: translate('text_632b4acf0c41206cbcb8c324'),
                    value: coupon?.amountCurrency,
                  },
                  {
                    label: translate('text_62865498824cc10126ab296f'),
                    value: <Status {...couponStatusMapping(coupon?.status)} />,
                  },
                ]}
              />
            </section>

            <section>
              <DetailsPage.SectionTitle variant="subhead" noWrap>
                {translate('text_62876e85e32e0300e1803137')}
              </DetailsPage.SectionTitle>
              <Card className="gap-0 p-0">
                <div className="flex flex-col gap-4 p-4 shadow-b">
                  <DetailsPage.TableDisplay
                    name="coupon-value"
                    header={[
                      coupon?.couponType === CouponTypeEnum.Percentage &&
                        translate('text_64de472463e2da6b31737de0'),
                      coupon?.couponType === CouponTypeEnum.FixedAmount &&
                        translate('text_624453d52e945301380e49b6'),
                    ]}
                    body={[[couponValue]]}
                  />
                </div>

                <div className="flex flex-col gap-4 p-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_6560809c38fb9de88d8a52fb'),
                        value: translate(
                          getCouponTypeTranslationKey[coupon?.couponType as CouponTypeEnum],
                        ),
                      },
                      {
                        label: translate('text_632d68358f1fedc68eed3e9d'),
                        value: translate(
                          getCouponFrequencyTranslationKey[coupon?.frequency as CouponFrequency],
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            </section>

            {(!!coupon?.reusable ||
              !!coupon?.expirationAt ||
              !!coupon?.billableMetrics?.length ||
              !!coupon?.plans?.length) && (
              <section>
                <DetailsPage.SectionTitle variant="subhead" noWrap>
                  {translate('text_63c83d58e697e8e9236da806')}
                </DetailsPage.SectionTitle>
                <Card className="p-4">
                  {!!coupon?.reusable && (
                    <DetailsPage.TableDisplay
                      name="coupon-reusable"
                      header={[
                        <div
                          key="coupon-reusable-header"
                          className="flex flex-row items-center gap-2"
                        >
                          <Icon name="validate-filled" size="small" />
                          <Typography variant="captionHl">
                            {translate('text_638f48274d41e3f1d01fc16a')}
                          </Typography>
                        </div>,
                      ]}
                    />
                  )}
                  {!!coupon?.expirationAt && (
                    <DetailsPage.TableDisplay
                      name="coupon-expiration"
                      header={[
                        <div
                          key="expiration-date-header"
                          className="flex flex-row items-center gap-2"
                        >
                          <Icon name="validate-filled" size="small" />
                          <Typography variant="captionHl">
                            {translate('text_632d68358f1fedc68eed3eb7')}
                          </Typography>
                        </div>,
                      ]}
                      body={[
                        [
                          <DetailsPage.InfoGridItem
                            key="expiration-date-body"
                            className="py-4"
                            label={translate('text_664cb90097bfa800e6efa3f5')}
                            value={formatTimeOrgaTZ(coupon.expirationAt)}
                          />,
                        ],
                      ]}
                    />
                  )}
                  {(!!coupon?.billableMetrics?.length || !!coupon?.plans?.length) && (
                    <DetailsPage.TableDisplay
                      name="limitation-plan-or-bm"
                      header={[
                        <div
                          key="limitation-plan-or-bm-header"
                          className="flex flex-row items-center gap-2"
                        >
                          <Icon name="validate-filled" size="small" />
                          <Typography variant="captionHl">
                            {translate('text_64352657267c3d916f9627a4')}
                          </Typography>
                        </div>,
                      ]}
                      body={[
                        [
                          <div key="limitation-plan-or-bm-body" className="py-4">
                            {limitationElement?.map((element, elementIndex) => (
                              <div
                                className="flex flex-row items-center gap-2"
                                key={`limitation-plan-or-bm-body-${elementIndex}`}
                              >
                                <Icon
                                  name={coupon?.plans?.length ? 'board' : 'pulse'}
                                  color="dark"
                                />
                                <Typography variant="body" color="grey700">
                                  {element.name}
                                </Typography>
                              </div>
                            ))}
                          </div>,
                        ],
                      ]}
                    />
                  )}
                </Card>
              </section>
            )}
          </>
        )}
      </DetailsPage.Container>

      <DeleteCouponDialog ref={deleteDialogRef} />
      <TerminateCouponDialog ref={terminateDialogRef} />
    </>
  )
}

export default CouponDetails
