import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import { Button, Icon, Popper, Skeleton, Typography } from '~/components/designSystem'
import { DetailsHeader, DetailsHeaderSkeleton } from '~/components/details/DetailsHeader'
import DetailsTableDisplay from '~/components/details/DetailsTableDisplay'
import {
  getCouponFrequencyTranslationKey,
  getCouponTypeTranslationKey,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { COUPONS_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CouponFrequency,
  CouponTypeEnum,
  CurrencyEnum,
  useGetCouponForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader, theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem, DetailsSectionTitle } from '~/styles/detailsPage'

gql`
  query getCouponForDetails($id: ID!) {
    coupon(id: $id) {
      id
      amountCents
      amountCurrency
      percentageRate
      code
      expirationAt
      name
      frequency
      reusable
      couponType
      billableMetrics {
        id
        name
      }
      plans {
        id
        name
      }
    }
  }
`

const CouponDetails = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { couponId } = useParams()

  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)

  const { data: couponResult, loading: isCouponLoading } = useGetCouponForDetailsQuery({
    variables: {
      id: couponId as string,
    },
    skip: !couponId,
  })

  const coupon = couponResult?.coupon

  const percentageRate = intlFormatNumber(Number(coupon?.percentageRate) / 100 || 0, {
    minimumFractionDigits: 2,
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

  const shouldShowActions = hasPermissions(['couponsCreate', 'couponsUpdate', 'couponsDelete'])

  return (
    <>
      <PageHeader $withSide>
        <HeaderInlineBreadcrumbBlock>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              navigate(COUPONS_ROUTE)
            }}
          />
          {isCouponLoading && !coupon ? (
            <CouponTitleLoadingWrapper>
              <Skeleton variant="text" width={200} height={12} />
            </CouponTitleLoadingWrapper>
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {coupon?.name}
            </Typography>
          )}
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
        </HeaderInlineBreadcrumbBlock>

        {shouldShowActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(generatePath(UPDATE_COUPON_ROUTE, { couponId: couponId as string }))
                    closePopper()
                  }}
                >
                  {translate('text_625fd39a15394c0117e7d792')}
                </Button>
                {coupon && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        coupon,
                        callback: () => {
                          navigate(COUPONS_ROUTE)
                        },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_629728388c4d2300e2d38182')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader>

      {isCouponLoading ? (
        <DetailsHeaderSkeleton />
      ) : (
        <DetailsHeader
          icon="coupon"
          title={coupon?.name || ''}
          description={`${couponValue} ${coupon?.frequency}`}
        />
      )}

      <Container>
        <section>
          <DetailsSectionTitle variant="subhead" noWrap>
            {translate('text_664cb90097bfa800e6efa3e4')}
          </DetailsSectionTitle>
          <DetailsInfoGrid
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
            ]}
          />
        </section>

        <section>
          <DetailsSectionTitle variant="subhead" noWrap>
            {translate('text_62876e85e32e0300e1803137')}
          </DetailsSectionTitle>
          <DetailsCard>
            <DetailsSectionWrapperWithBorder>
              <DetailsTableDisplay
                header={[
                  coupon?.couponType === CouponTypeEnum.Percentage
                    ? translate('text_64de472463e2da6b31737de0')
                    : coupon?.couponType === CouponTypeEnum.FixedAmount
                      ? translate('text_624453d52e945301380e49b6')
                      : '',
                ]}
                body={[[couponValue]]}
              />
            </DetailsSectionWrapperWithBorder>

            <DetailsSectionWrapper>
              <DetailsInfoGrid
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
            </DetailsSectionWrapper>
          </DetailsCard>
        </section>

        {(!!coupon?.reusable ||
          !!coupon?.expirationAt ||
          !!coupon?.billableMetrics?.length ||
          !!coupon?.plans?.length) && (
          <section>
            <DetailsSectionTitle variant="subhead" noWrap>
              {translate('text_63c83d58e697e8e9236da806')}
            </DetailsSectionTitle>
            <DetailsCard>
              <DetailsSectionWrapper>
                {!!coupon?.reusable && (
                  <DetailsTableDisplay
                    header={[
                      <Stack key="" direction="row" gap={2} alignItems="center">
                        <Icon name="validate-filled" size="small" />
                        <Typography variant="captionHl">
                          {translate('text_638f48274d41e3f1d01fc16a')}
                        </Typography>
                      </Stack>,
                    ]}
                  />
                )}
                {!!coupon?.expirationAt && (
                  <DetailsTableDisplay
                    header={[
                      <Stack
                        key="limitation-date-header-1"
                        direction="row"
                        gap={2}
                        alignItems="center"
                      >
                        <Icon name="validate-filled" size="small" />
                        <Typography variant="captionHl">
                          {translate('text_632d68358f1fedc68eed3eb7')}
                        </Typography>
                      </Stack>,
                    ]}
                    body={[
                      [
                        <Stack key="limitation-date-body-1" padding="16px 0">
                          <DetailsInfoItem
                            label={translate('text_664cb90097bfa800e6efa3f5')}
                            value={formatTimeOrgaTZ(coupon.expirationAt)}
                          />
                        </Stack>,
                      ],
                    ]}
                  />
                )}
                {(!!coupon?.billableMetrics?.length || !!coupon?.plans?.length) && (
                  <DetailsTableDisplay
                    header={[
                      <Stack
                        key="limitation-plan-or-bm-header-1"
                        direction="row"
                        gap={2}
                        alignItems="center"
                      >
                        <Icon name="validate-filled" size="small" />
                        <Typography variant="captionHl">
                          {translate('text_64352657267c3d916f9627a4')}
                        </Typography>
                      </Stack>,
                    ]}
                    body={[
                      [
                        <Stack key="limitation-plan-or-bm-body-1" padding="16px 0">
                          {(!!coupon.billableMetrics?.length
                            ? coupon.billableMetrics
                            : !!coupon?.plans?.length
                              ? coupon?.plans
                              : []
                          )?.map((element, elementIndex) => (
                            <Stack
                              key={`limitation-plan-or-bm-item-${elementIndex}`}
                              direction="row"
                              alignItems="center"
                              gap={2}
                            >
                              <Icon name={coupon?.plans?.length ? 'board' : 'pulse'} color="dark" />
                              <Typography variant="body" color="grey700">
                                {element.name}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>,
                      ],
                    ]}
                  />
                )}
              </DetailsSectionWrapper>
            </DetailsCard>
          </section>
        )}
      </Container>

      <DeleteCouponDialog ref={deleteDialogRef} />
    </>
  )
}

export default CouponDetails

const HeaderInlineBreadcrumbBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Prevent long name to not overflow in header */
  overflow: hidden;
`

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};

  padding: 0 ${theme.spacing(12)} ${theme.spacing(12)};
  max-width: 672px;
`

const CouponTitleLoadingWrapper = styled.div`
  width: 200px;
`

const DetailsCard = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const DetailsSectionWrapper = styled.div`
  padding: ${theme.spacing(4)};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const DetailsSectionWrapperWithBorder = styled(DetailsSectionWrapper)`
  box-shadow: ${theme.shadows[7]};
`
