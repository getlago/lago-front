import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { CouponCaption } from '~/components/coupons/CouponCaption'
import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import {
  TerminateCouponDialog,
  TerminateCouponDialogRef,
} from '~/components/coupons/TerminateCouponDialog'
import {
  ButtonLink,
  InfiniteScroll,
  Status,
  StatusProps,
  StatusType,
  Table,
  Typography,
} from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { COUPON_DETAILS_ROUTE, CREATE_COUPON_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import {
  CouponCaptionFragmentDoc,
  CouponStatusEnum,
  useCouponsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader, theme } from '~/styles'

gql`
  fragment CouponItem on Coupon {
    id
    name
    customersCount
    status
    amountCurrency
    amountCents
    appliedCouponsCount
    expiration
    expirationAt
    couponType
    percentageRate
    frequency
    frequencyDuration
  }

  query coupons($page: Int, $limit: Int, $searchTerm: String) {
    coupons(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CouponItem
        ...CouponCaption
      }
    }
  }

  ${CouponCaptionFragmentDoc}
`

const mapStatus = (type?: CouponStatusEnum | undefined): StatusProps => {
  switch (type) {
    case CouponStatusEnum.Active:
      return {
        type: StatusType.success,
        label: 'active',
      }
    default:
      return {
        type: StatusType.danger,
        label: 'terminated',
      }
  }
}

const CouponsList = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)
  const terminateDialogRef = useRef<TerminateCouponDialogRef>(null)
  const [getCoupons, { data, error, loading, fetchMore, variables }] = useCouponsLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCoupons, loading)
  const list = data?.coupons?.collection || []
  const shouldShowItemActions = hasPermissions(['couponsCreate', 'couponsUpdate', 'couponsDelete'])

  return (
    <>
      <Header withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62865498824cc10126ab2956')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63beebbf4f60e2f553232782')}
          />
          {hasPermissions(['couponsCreate']) && (
            <ButtonLink type="button" to={CREATE_COUPON_ROUTE} data-test="add-coupon">
              {translate('text_62865498824cc10126ab2954')}
            </ButtonLink>
          )}
        </HeaderRigthBlock>
      </Header>

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = data?.coupons?.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <Table
          name="coupons-list"
          data={list}
          containerSize={{
            default: 16,
            md: 48,
          }}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          onRowAction={({ id }) => navigate(generatePath(COUPON_DETAILS_ROUTE, { couponId: id }))}
          rowDataTestId={(addOn) => `${addOn.name}`}
          columns={[
            {
              key: 'name',
              title: translate('text_62865498824cc10126ab2960'),
              minWidth: 200,
              maxSpace: true,
              content: (coupon) => (
                <>
                  <Typography color="textSecondary" variant="bodyHl" noWrap>
                    {coupon.name}
                  </Typography>
                  <CouponCaption coupon={coupon} variant="caption" />
                </>
              ),
            },
            {
              key: 'customersCount',
              title: translate('text_62865498824cc10126ab2964'),
              minWidth: 112,
              content: ({ customersCount }) => (
                <Typography color="grey600" className="text-right">
                  {customersCount}
                </Typography>
              ),
            },
            {
              key: 'expirationAt',
              title: translate('text_62865498824cc10126ab296a'),
              minWidth: 140,
              content: ({ expirationAt }) => (
                <Typography color="grey600">
                  {!expirationAt
                    ? translate('text_62876a50ea3bba00b56d2c2c')
                    : formatTimeOrgaTZ(expirationAt)}
                </Typography>
              ),
            },
            {
              key: 'status',
              title: translate('text_62865498824cc10126ab296f'),
              minWidth: 80,
              content: ({ status }) => <Status {...mapStatus(status)} />,
            },
          ]}
          actionColumnTooltip={() => translate('text_62876a50ea3bba00b56d2c76')}
          actionColumn={(coupon) => {
            const { id, status } = coupon

            if (!shouldShowItemActions) return

            return [
              {
                startIcon: 'pen',
                title: translate('text_62876a50ea3bba00b56d2cb6'),
                onAction: () => navigate(generatePath(UPDATE_COUPON_ROUTE, { couponId: id })),
                disabled: status === CouponStatusEnum.Terminated,
                tooltip: translate('text_62878d88ea3bba00b56d3412'),
                tooltipListener: status !== CouponStatusEnum.Terminated,
              },
              {
                startIcon: 'switch',
                title: translate('text_62876a50ea3bba00b56d2cbc'),
                onAction: () => terminateDialogRef.current?.openDialog(coupon),
                disabled: status === CouponStatusEnum.Terminated,
                tooltip: translate('text_62878d88ea3bba00b56d33cf'),
                tooltipListener: status !== CouponStatusEnum.Terminated,
              },
              {
                startIcon: 'trash',
                title: translate('text_62876a50ea3bba00b56d2cc2'),
                onAction: () => deleteDialogRef.current?.openDialog({ coupon }),
                disabled: !!coupon.appliedCouponsCount,
                tooltip: translate('text_62876a50ea3bba00b56d2cee'),
                tooltipListener: !coupon.appliedCouponsCount,
              },
            ]
          }}
          placeholder={{
            errorState: !!variables?.searchTerm
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_62865498824cc10126ab2962'),
                  subtitle: translate('text_62865498824cc10126ab2968'),
                  buttonTitle: translate('text_62865498824cc10126ab296e'),
                  buttonVariant: 'primary',
                  buttonAction: () => location.reload(),
                },

            emptyState: !!variables?.searchTerm
              ? {
                  title: translate('text_63beebbf4f60e2f553232773'),
                  subtitle: translate('text_63beebbf4f60e2f553232775'),
                }
              : hasPermissions(['couponsCreate'])
                ? {
                    title: translate('text_62865498824cc10126ab296c'),
                    subtitle: translate('text_62865498824cc10126ab2971'),
                    buttonTitle: translate('text_62865498824cc10126ab2975'),
                    buttonVariant: 'primary',
                    buttonAction: () => navigate(CREATE_COUPON_ROUTE),
                  }
                : {
                    title: translate('text_664dec926bfdb6007a036b78'),
                    subtitle: translate('text_62865498824cc10126ab2971'),
                  },
          }}
        />
      </InfiniteScroll>

      <DeleteCouponDialog ref={deleteDialogRef} />
      <TerminateCouponDialog ref={terminateDialogRef} />
    </>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

export default CouponsList
