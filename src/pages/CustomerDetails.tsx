import { useRef, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, useParams, generatePath } from 'react-router-dom'
import styled from 'styled-components'

import {
  Typography,
  Button,
  Skeleton,
  Avatar,
  Popper,
  Tooltip,
  BasicTabs,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMERS_LIST_ROUTE, CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  useGetCustomerQuery,
  CustomerSubscriptionListFragmentDoc,
  CustomerInvoiceListFragmentDoc,
  AddCustomerDialogDetailFragmentDoc,
  CustomerVatRateFragmentDoc,
  CustomerVatRateFragment,
  CustomerCouponFragmentDoc,
  CustomerMainInfosFragmentDoc,
  CustomerAddOnsFragmentDoc,
  StatusTypeEnum,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CustomerSubscriptionsList } from '~/components/customers/CustomerSubscriptionsList'
import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'
import { CustomerVatRate } from '~/components/customers/CustomerVatRate'
import { theme, PageHeader, MenuPopper } from '~/styles'
import { SectionHeader } from '~/styles/customer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { AddCustomerDialog, AddCustomerDialogRef } from '~/components/customers/AddCustomerDialog'
import { CustomerCoupons } from '~/components/customers/CustomerCoupons'
import { CustomerAddOns } from '~/components/customers/CustomerAddOns'
import { CustomerMainInfos } from '~/components/customers/CustomerMainInfos'
import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import {
  AddAddOnToCustomerDialog,
  AddAddOnToCustomerDialogRef,
} from '~/components/customers/AddAddOnToCustomerDialog'
import {
  AddPlanToCustomerDialog,
  AddPlanToCustomerDialogRef,
} from '~/components/customers/AddPlanToCustomerDialog'

gql`
  fragment CustomerDetails on CustomerDetails {
    id
    name
    customerId
    canBeDeleted
    subscriptions(status: [active, pending]) {
      ...CustomerSubscriptionList
    }
    invoices {
      ...CustomerInvoiceList
    }
    appliedCoupons {
      ...CustomerCoupon
    }
    appliedAddOns {
      ...CustomerAddOns
    }
    ...CustomerVatRate
    ...AddCustomerDialogDetail
    ...CustomerMainInfos
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
  ${CustomerInvoiceListFragmentDoc}
  ${AddCustomerDialogDetailFragmentDoc}
  ${CustomerVatRateFragmentDoc}
  ${CustomerCouponFragmentDoc}
  ${CustomerAddOnsFragmentDoc}
  ${CustomerMainInfosFragmentDoc}
`

enum TabsOptions {
  overview = 'overview',
  invoices = 'invoices',
  taxRate = 'taxRate',
}

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const editDialogRef = useRef<AddCustomerDialogRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const addOnDialogRef = useRef<AddAddOnToCustomerDialogRef>(null)
  const subscriptionsDialogRef = useRef<AddPlanToCustomerDialogRef>(null)
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { id, tab } = useParams()
  const { data, loading, error, refetch } = useGetCustomerQuery({
    variables: { id: id as string },
    skip: !id,
  })
  const { name, customerId, invoices, subscriptions, canBeDeleted, appliedCoupons, appliedAddOns } =
    data?.customer || {}

  const tabsOptions = useMemo(() => {
    return [
      {
        title: translate('text_628cf761cbe6820138b8f2e4'),
        key: TabsOptions.overview,
      },
      {
        title: translate('text_628cf761cbe6820138b8f2e6'),
        key: TabsOptions.invoices,
      },
      {
        title: translate('text_628cf761cbe6820138b8f2e8'),
        key: TabsOptions.taxRate,
      },
    ]
  }, [translate])

  const selectedPlansId = useMemo(
    () =>
      (subscriptions || []).reduce<string[]>((acc, s) => {
        if ([StatusTypeEnum.Active, StatusTypeEnum.Pending].includes(s.status as StatusTypeEnum)) {
          acc.push(s.plan?.id)
        }
        return acc
      }, []),
    [subscriptions]
  )

  return (
    <div>
      <PageHeader $withSide>
        <HeaderLeft>
          <Button
            variant="quaternary"
            icon="arrow-left"
            onClick={() => navigate(CUSTOMERS_LIST_ROUTE)}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {name}
            </Typography>
          )}
        </HeaderLeft>
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
                  subscriptionsDialogRef?.current?.openDialog()
                  closePopper()
                }}
              >
                {translate(
                  !subscriptions?.length
                    ? 'text_626162c62f790600f850b70c'
                    : 'text_6262658ead40f401000bc80f'
                )}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  editDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_626162c62f790600f850b718')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                disabled={!subscriptions || !subscriptions?.length}
                onClick={() => {
                  addOnDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_6295e58352f39200d902b02a')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                disabled={
                  !subscriptions || !subscriptions?.length || (appliedCoupons || []).length > 0
                }
                onClick={() => {
                  addCouponDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_628b8dc14c71840130f8d8a1')}
              </Button>
              <Tooltip
                placement="bottom-end"
                disableHoverListener={canBeDeleted}
                title={translate('text_6262658ead40f401000bc825')}
              >
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={!canBeDeleted}
                  fullWidth
                  onClick={() => {
                    deleteDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_626162c62f790600f850b726')}
                </Button>
              </Tooltip>
            </MenuPopper>
          )}
        </Popper>
      </PageHeader>
      {(error || !data?.customer) && !loading ? (
        <GenericPlaceholder
          title={translate('text_6250304370f0f700a8fdc270')}
          subtitle={translate('text_6250304370f0f700a8fdc274')}
          buttonTitle={translate('text_6250304370f0f700a8fdc278')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <>
          <Content>
            {loading ? (
              <MainInfos>
                <Skeleton variant="userAvatar" size="large" />
                <div>
                  <Skeleton
                    variant="text"
                    height={12}
                    width={200}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton variant="text" height={12} width={128} />
                </div>
              </MainInfos>
            ) : (
              <MainInfos>
                <Avatar
                  size="large"
                  variant="user"
                  identifier={name || ''}
                  initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
                />
                <div>
                  <Name color="textSecondary" variant="headline">
                    {name}
                  </Name>
                  <Typography>{customerId}</Typography>
                </div>
              </MainInfos>
            )}

            <Infos>
              <CustomerMainInfos
                loading={loading}
                customer={data?.customer}
                onEdit={editDialogRef.current?.openDialog}
              />
              <div>
                <BasicTabs
                  tabs={tabsOptions}
                  value={tab || 0}
                  align="superLeft"
                  onClick={(_, key) =>
                    navigate(generatePath(CUSTOMER_DETAILS_TAB_ROUTE, { id, tab: key as string }), {
                      state: { disableScrollTop: true },
                    })
                  }
                />
                <SideBlock>
                  {loading && (
                    <>
                      <SideLoadingSection>
                        <SectionHeader variant="subhead">
                          <Skeleton variant="text" height={12} width={200} />
                        </SectionHeader>
                        <Skeleton variant="text" height={12} width={240} />
                      </SideLoadingSection>
                    </>
                  )}
                  {!loading && (!tab || tab === TabsOptions.overview) && (
                    <>
                      <CustomerCoupons coupons={appliedCoupons} />
                      <CustomerAddOns ref={addOnDialogRef} addOns={appliedAddOns} />
                      <CustomerSubscriptionsList
                        ref={subscriptionsDialogRef}
                        subscriptions={subscriptions ?? []}
                      />
                    </>
                  )}
                  {!loading && tab === TabsOptions.invoices && (
                    <CustomerInvoicesList invoices={invoices} />
                  )}
                  {!loading && tab === TabsOptions.taxRate && (
                    <CustomerVatRate customer={data?.customer as CustomerVatRateFragment} />
                  )}
                </SideBlock>
              </div>
            </Infos>
          </Content>
          <AddCustomerDialog ref={editDialogRef} customer={data?.customer} />
          <DeleteCustomerDialog
            ref={deleteDialogRef}
            onDeleted={() => navigate(CUSTOMERS_LIST_ROUTE)}
            // @ts-ignore
            customer={data?.customer}
          />
          <AddCouponToCustomerDialog ref={addCouponDialogRef} customerId={id as string} />
          <AddAddOnToCustomerDialog ref={addOnDialogRef} customerId={id as string} />
          <AddPlanToCustomerDialog
            ref={subscriptionsDialogRef}
            customerName={name as string}
            customerId={id as string}
            existingPlanIds={selectedPlansId}
            refetchCustomer={refetch}
          />
        </>
      )}
    </div>
  )
}

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Content = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)} ${theme.spacing(20)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(8)};

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const Infos = styled.div`
  display: flex;

  > *:first-child {
    display: flex;
    flex-direction: column;
    width: 320px;
    margin-right: ${theme.spacing(8)};

    @media (max-width: 1024px) {
      flex: 1;
      width: inherit;
      margin-right: 0;
    }
  }
  > *:last-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`

const Name = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const SideBlock = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SideLoadingSection = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

export default CustomerDetails
