import { useMemo, useRef } from 'react'
import { gql } from '@apollo/client'
import { useParams, generatePath, Outlet, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  Typography,
  Button,
  Skeleton,
  Popper,
  NavigationTab,
  Avatar,
  Icon,
  Status,
  StatusEnum,
  Chip,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
} from '~/core/router'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  CurrencyEnum,
  Invoice,
  InvoiceDetailsForInvoiceOverviewFragmentDoc,
  InvoiceForCreditNotesTableFragmentDoc,
  InvoiceForDetailsTableFragmentDoc,
  InvoiceForFinalizeInvoiceFragment,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForInvoiceInfosFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoiceMetadatasForInvoiceOverviewFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
  useDownloadInvoiceMutation,
  useGetInvoiceDetailsQuery,
  useRefreshInvoiceMutation,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme, PageHeader, MenuPopper } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import InvoiceOverview from '~/pages/InvoiceOverview'
import InvoiceCreditNoteList from '~/pages/InvoiceCreditNoteList'
import { CustomerDetailsTabsOptions } from '~/pages/CustomerDetails'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'

gql`
  fragment AllInvoiceDetailsForCustomerInvoiceDetails on Invoice {
    invoiceType
    number
    paymentStatus
    status
    totalAmountCents
    totalAmountCurrency
    refundableAmountCents
    creditableAmountCents
    ...InvoiceDetailsForInvoiceOverview
    ...InvoiceForCreditNotesTable
    ...InvoiceForDetailsTable
    ...InvoiceForInvoiceInfos
    ...InvoiceForFinalizeInvoice
    ...InvoiceForUpdateInvoicePaymentStatus
    ...InvoiceMetadatasForInvoiceOverview
  }

  query getInvoiceDetails($id: ID!) {
    invoice(id: $id) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  mutation refreshInvoice($input: RefreshInvoiceInput!) {
    refreshInvoice(input: $input) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  ${InvoiceForCreditNotesTableFragmentDoc}
  ${InvoiceForDetailsTableFragmentDoc}
  ${InvoiceForInvoiceInfosFragmentDoc}
  ${InvoiceDetailsForInvoiceOverviewFragmentDoc}
  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
  ${InvoiceMetadatasForInvoiceOverviewFragmentDoc}
`

export enum CustomerInvoiceDetailsTabsOptionsEnum {
  overview = 'overview',
  creditNotes = 'credit-notes',
}

const mapStatus = (type?: InvoicePaymentStatusTypeEnum | undefined) => {
  switch (type) {
    case InvoicePaymentStatusTypeEnum.Succeeded:
      return {
        type: StatusEnum.running,
        label: 'text_634687079be251fdb43833a7',
      }
    case InvoicePaymentStatusTypeEnum.Failed:
      return {
        type: StatusEnum.failed,
        label: 'text_634687079be251fdb438339d',
      }
    default:
      return {
        type: StatusEnum.paused,
        label: 'text_634687079be251fdb438339f',
      }
  }
}

const CustomerInvoiceDetails = () => {
  const { translate } = useInternationalization()
  const { id, invoiceId } = useParams()
  let navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const { isPremium } = useCurrentUser()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const [refreshInvoice, { loading: loadingRefreshInvoice }] = useRefreshInvoiceMutation({
    variables: { input: { id: invoiceId || '' } },
  })
  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      const fileUrl = downloadInvoiceData?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

  const { data, loading, error } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const {
    invoiceType,
    number,
    paymentStatus,
    totalAmountCents,
    totalAmountCurrency,
    status,
    creditableAmountCents,
    refundableAmountCents,
  } = (data?.invoice as AllInvoiceDetailsForCustomerInvoiceDetailsFragment) || {}

  const formattedStatus = mapStatus(paymentStatus)
  const hasError = (!!error || !data?.invoice) && !loading

  const tabsOptions = useMemo(() => {
    const tabs = [
      {
        title: translate('text_634687079be251fdb43833b7'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          id,
          invoiceId,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
        routerState: { disableScrollTop: true },
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            id,
            invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          }),
        ],
        component: (
          <InvoiceOverview
            downloadInvoice={downloadInvoice}
            hasError={hasError}
            invoice={data?.invoice as Invoice}
            loading={loading}
            loadingInvoiceDownload={loadingInvoiceDownload}
            loadingRefreshInvoice={loadingRefreshInvoice}
            refreshInvoice={refreshInvoice}
          />
        ),
      },
    ]

    if (invoiceType !== InvoiceTypeEnum.Credit && status !== InvoiceStatusTypeEnum.Draft) {
      tabs.push({
        title: translate('text_636bdef6565341dcb9cfb125'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          id,
          invoiceId,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.creditNotes,
        }),
        routerState: { disableScrollTop: true },
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            id,
            invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.creditNotes,
          }),
        ],
        component: <InvoiceCreditNoteList />,
      })
    }

    return tabs
  }, [
    downloadInvoice,
    id,
    invoiceId,
    invoiceType,
    loadingInvoiceDownload,
    translate,
    refreshInvoice,
    loadingRefreshInvoice,
    hasError,
    loading,
    data,
    status,
  ])

  return (
    <>
      <PageHeader $withSide>
        <HeaderLeft>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(
                generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                  id,
                  tab: CustomerDetailsTabsOptions.invoices,
                }),
                {
                  exclude: [
                    CUSTOMER_INVOICE_DETAILS_ROUTE,
                    CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
                    CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
                    CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
                  ],
                }
              )
            }
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {number}
            </Typography>
          )}
        </HeaderLeft>
        {!hasError && !loading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_634687079be251fdb438338f')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                {status === InvoiceStatusTypeEnum.Draft ? (
                  <>
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={async () => {
                        finalizeInvoiceRef.current?.openDialog(
                          data?.invoice as InvoiceForFinalizeInvoiceFragment
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_63a41a8eabb9ae67047c1c08')}
                    </Button>
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={!!loadingRefreshInvoice}
                      onClick={async () => {
                        refreshInvoice()
                        closePopper()
                      }}
                    >
                      {translate('text_63a41a8eabb9ae67047c1c06')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={!!loadingInvoiceDownload}
                      onClick={async () => {
                        await downloadInvoice({
                          variables: { input: { id: invoiceId || '' } },
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_634687079be251fdb4383395')}
                    </Button>
                    {isPremium ? (
                      <Button
                        variant="quaternary"
                        align="left"
                        disabled={creditableAmountCents === '0' && refundableAmountCents === '0'}
                        onClick={async () => {
                          navigate(
                            generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, {
                              id,
                              invoiceId,
                            })
                          )
                        }}
                      >
                        {translate('text_6386589e4e82fa85eadcaa7a')}
                      </Button>
                    ) : (
                      <Button
                        variant="quaternary"
                        onClick={premiumWarningDialogRef.current?.openDialog}
                        endIcon="sparkles"
                      >
                        {translate('text_6386589e4e82fa85eadcaa7a')}
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    copyToClipboard(invoiceId || '')

                    addToast({
                      severity: 'info',
                      translateKey: 'text_6253f11816f710014600ba1f',
                    })
                    closePopper()
                  }}
                >
                  {translate('text_634687079be251fdb438339b')}
                </Button>
                {status !== InvoiceStatusTypeEnum.Draft && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      !!data?.invoice &&
                        updateInvoicePaymentStatusDialog?.current?.openDialog(data.invoice)
                      closePopper()
                    }}
                  >
                    {translate('text_63eba8c65a6c8043feee2a01')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader>
      {hasError ? (
        <GenericPlaceholder
          title={translate('text_634812d6f16b31ce5cbf4111')}
          subtitle={translate('text_634812d6f16b31ce5cbf411f')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <Content>
          {loading ? (
            <MainInfos>
              <Skeleton variant="connectorAvatar" size="large" />
              <div>
                <Skeleton variant="text" height={12} width={200} marginBottom={theme.spacing(5)} />
                <Skeleton variant="text" height={12} width={128} />
              </div>
            </MainInfos>
          ) : (
            <MainInfos>
              <ConnectorAvatar variant="connector">
                <Icon name="document" color="dark" size="large" />
              </ConnectorAvatar>
              <div>
                <MainInfoLine>
                  <Typography variant="headline" color="grey700">
                    {number}
                  </Typography>
                  {status === InvoiceStatusTypeEnum.Draft ? (
                    <Chip label={translate('text_63a41a8eabb9ae67047c1bfe')} />
                  ) : (
                    <Status type={formattedStatus.type} label={translate(formattedStatus.label)} />
                  )}
                </MainInfoLine>
                <MainInfoLine>
                  <InlineTripleTypography variant="body" color="grey600">
                    <span>
                      {translate('text_634687079be251fdb43833ad', {
                        totalAmount: intlFormatNumber(
                          deserializeAmount(
                            totalAmountCents || 0,
                            totalAmountCurrency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: totalAmountCurrency,
                          }
                        ),
                      })}
                    </span>
                    <span>•</span>
                    <span>{invoiceId}</span>
                  </InlineTripleTypography>
                </MainInfoLine>
              </div>
            </MainInfos>
          )}
          <NavigationTab tabs={tabsOptions} align="superLeft">
            <Outlet />
          </NavigationTab>
        </Content>
      )}
      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
    </>
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

const ConnectorAvatar = styled(Avatar)`
  padding: ${theme.spacing(3)};
`

const MainInfoLine = styled.div`
  display: flex;
  align-items: center;

  &:first-child {
    margin-bottom: ${theme.spacing(1)};
  }

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const InlineTripleTypography = styled(Typography)`
  > span:nth-child(2) {
    margin: 0 ${theme.spacing(2)};
  }
`

export default CustomerInvoiceDetails
