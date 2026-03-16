import { gql } from '@apollo/client'
import { Icon, tw } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { CouponCaption } from '~/components/coupons/CouponCaption'
import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import {
  TerminateCouponDialog,
  TerminateCouponDialogRef,
} from '~/components/coupons/TerminateCouponDialog'
import { Avatar } from '~/components/designSystem/Avatar'
import { GenericPlaceholderProps } from '~/components/designSystem/GenericPlaceholder'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Status } from '~/components/designSystem/Status'
import { Table } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { couponStatusMapping } from '~/core/constants/statusCouponMapping'
import { CouponDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { COUPON_DETAILS_ROUTE, CREATE_COUPON_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import {
  CouponCaptionFragmentDoc,
  CouponStatusEnum,
  DeleteCouponFragmentDoc,
  useCouponsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment CouponItem on Coupon {
    id
    name
    customersCount
    status
    amountCurrency
    amountCents
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
        ...DeleteCoupon
      }
    }
  }

  ${CouponCaptionFragmentDoc}
  ${DeleteCouponFragmentDoc}
`

const CouponsList = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
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
  const getEmptyState = (): Partial<GenericPlaceholderProps> => {
    if (variables?.searchTerm) {
      return {
        title: translate('text_63beebbf4f60e2f553232773'),
        subtitle: translate('text_63beebbf4f60e2f553232775'),
      }
    }
    if (hasPermissions(['couponsCreate'])) {
      return {
        title: translate('text_62865498824cc10126ab296c'),
        subtitle: translate('text_62865498824cc10126ab2971'),
        buttonTitle: translate('text_62865498824cc10126ab2975'),
        buttonVariant: 'primary',
        buttonAction: () => navigate(CREATE_COUPON_ROUTE),
      }
    }
    return {
      title: translate('text_664dec926bfdb6007a036b78'),
      subtitle: translate('text_62865498824cc10126ab2971'),
    }
  }

  return (
    <>
      <MainHeader.Configure
        entity={{ viewName: translate('text_62865498824cc10126ab2956') }}
        actions={[
          ...(hasPermissions(['couponsCreate'])
            ? [
                {
                  type: 'action' as const,
                  label: translate('text_62865498824cc10126ab2954'),
                  variant: 'primary' as const,
                  onClick: () => navigate(CREATE_COUPON_ROUTE),
                  dataTest: 'add-coupon',
                },
              ]
            : []),
        ]}
        filtersSection={
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63beebbf4f60e2f553232782')}
          />
        }
      />

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
          containerClassName={tw('h-[calc(100%-theme(space.nav))] border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          onRowActionLink={({ id }) =>
            generatePath(COUPON_DETAILS_ROUTE, {
              couponId: id,
              tab: CouponDetailsTabsOptionsEnum.overview,
            })
          }
          rowDataTestId={(addOn) => `${addOn.name}`}
          columns={[
            {
              key: 'name',
              title: translate('text_62865498824cc10126ab2960'),
              minWidth: 200,
              maxSpace: true,
              content: (coupon) => (
                <div className="flex items-center gap-3">
                  <Avatar size="big" variant="connector">
                    <Icon name="coupon" color="dark" />
                  </Avatar>
                  <div>
                    <Typography color="textSecondary" variant="bodyHl" noWrap>
                      {coupon.name}
                    </Typography>
                    <CouponCaption coupon={coupon} variant="caption" />
                  </div>
                </div>
              ),
            },
            {
              key: 'customersCount',
              title: translate('text_62865498824cc10126ab2964'),
              textAlign: 'right',
              minWidth: 112,
              content: ({ customersCount }) => (
                <Typography color="grey600">{customersCount}</Typography>
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
                    : intlFormatDateTimeOrgaTZ(expirationAt).date}
                </Typography>
              ),
            },
            {
              key: 'status',
              title: translate('text_62865498824cc10126ab296f'),
              minWidth: 80,
              content: ({ status }) => <Status {...couponStatusMapping(status)} />,
            },
          ]}
          actionColumnTooltip={() => translate('text_62876a50ea3bba00b56d2c76')}
          actionColumn={(coupon) => {
            const { id, status } = coupon
            const actions: ActionItem<typeof coupon>[] = []

            if (hasPermissions(['couponsUpdate'])) {
              actions.push({
                startIcon: 'pen',
                title: translate('text_625fd39a15394c0117e7d792'),
                onAction: () => navigate(generatePath(UPDATE_COUPON_ROUTE, { couponId: id })),
                disabled: status === CouponStatusEnum.Terminated,
                tooltip: translate('text_62878d88ea3bba00b56d3412'),
                tooltipListener: status !== CouponStatusEnum.Terminated,
              })

              actions.push({
                startIcon: 'switch',
                title: translate('text_62876a50ea3bba00b56d2cbc'),
                onAction: () => {
                  terminateDialogRef.current?.openDialog(coupon)
                },
                disabled: status === CouponStatusEnum.Terminated,
                tooltip: translate('text_62878d88ea3bba00b56d33cf'),
                tooltipListener: status !== CouponStatusEnum.Terminated,
              })
            }

            if (hasPermissions(['couponsDelete'])) {
              actions.push({
                startIcon: 'trash',
                title: translate('text_629728388c4d2300e2d38182'),
                onAction: () => {
                  deleteDialogRef.current?.openDialog({ couponId: id })
                },
              })
            }

            return actions
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

            emptyState: getEmptyState(),
          }}
        />
      </InfiniteScroll>

      <DeleteCouponDialog ref={deleteDialogRef} />
      <TerminateCouponDialog ref={terminateDialogRef} />
    </>
  )
}

export default CouponsList
