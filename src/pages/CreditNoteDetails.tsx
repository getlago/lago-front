import { gql } from '@apollo/client'
import { useMemo, useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import CreditNoteBadge from '~/components/creditNote/CreditNoteBadge'
import { CreditNoteDetailsActivityLogs } from '~/components/creditNote/CreditNoteDetailsActivityLogs'
import { CreditNoteDetailsExternalSync } from '~/components/creditNote/CreditNoteDetailsExternalSync'
import { CreditNoteDetailsOverview } from '~/components/creditNote/CreditNoteDetailsOverview'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import { Button, NavigationTab, Popper, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import {
  CreditNoteDetailsTabsOptionsEnum,
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import {
  CreditNote,
  CurrencyEnum,
  CustomerForCreditNoteDetailsExternalSyncFragmentDoc,
  useDownloadCreditNoteMutation,
  useGetCreditNoteForDetailsQuery,
  useRetryTaxReportingMutation,
  useSyncIntegrationCreditNoteMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PageHeader } from '~/styles'

const { disablePdfGeneration } = envGlobalVar()

gql`
  query getCreditNoteForDetails($id: ID!) {
    creditNote(id: $id) {
      id
      number
      canBeVoided
      totalAmountCents
      currency
      integrationSyncable
      taxProviderSyncable
      externalIntegrationId
      taxProviderId
      customer {
        ...CustomerForCreditNoteDetailsExternalSync
      }
    }
  }

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }

  mutation syncIntegrationCreditNote($input: SyncIntegrationCreditNoteInput!) {
    syncIntegrationCreditNote(input: $input) {
      creditNoteId
    }
  }

  mutation retryTaxReporting($input: RetryTaxReportingInput!) {
    retryTaxReporting(input: $input) {
      id
    }
  }

  ${CustomerForCreditNoteDetailsExternalSyncFragmentDoc}
`

const CreditNoteDetails = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const { customerId, invoiceId, creditNoteId } = useParams()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { isPremium } = useCurrentUser()

  const { data, loading, error } = useGetCreditNoteForDetailsQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId || !customerId,
  })

  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
        handleDownloadFile(downloadCreditNoteData?.fileUrl)
      },
    })

  const [syncIntegrationCreditNote, { loading: loadingSyncIntegrationCreditNote }] =
    useSyncIntegrationCreditNoteMutation({
      variables: { input: { creditNoteId: creditNoteId || '' } },
      onCompleted({ syncIntegrationCreditNote: syncIntegrationCreditNoteResult }) {
        if (syncIntegrationCreditNoteResult?.creditNoteId) {
          addToast({
            severity: 'success',
            translateKey: !!data?.creditNote?.customer.netsuiteCustomer
              ? 'text_6655a88569eed300ee8c4d44'
              : 'text_17268445285571pwim3q27vl',
          })
        }
      },
    })

  const [retryTaxReporting] = useRetryTaxReportingMutation({
    onCompleted() {
      addToast({
        severity: 'success',
        translateKey: 'text_1727068261852148l97frl5q',
      })
    },
    variables: {
      input: {
        id: data?.creditNote?.id as string,
      },
    },
    refetchQueries: ['getCreditNote'],
  })

  const creditNote = data?.creditNote
  const hasError = (!!error || !creditNote) && !loading

  const retryTaxSync = async () => {
    if (!data?.creditNote?.id) return
    await retryTaxReporting()
  }

  const onGoBack = () => {
    goBack(
      !!invoiceId
        ? generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          })
        : generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
            customerId: customerId as string,
            tab: CustomerDetailsTabsOptions.creditNotes,
          }),
      { exclude: [CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE] },
    )
  }

  const hasIntegration = {
    netsuite:
      !!creditNote?.customer.netsuiteCustomer?.integrationId && creditNote?.externalIntegrationId,
    xero: !!creditNote?.customer.xeroCustomer?.integrationId && creditNote?.externalIntegrationId,
    anrok:
      !!creditNote?.customer.anrokCustomer?.integrationId &&
      (!!creditNote?.taxProviderId || !!creditNote?.taxProviderSyncable),
    avalara:
      !!creditNote?.customer.avalaraCustomer?.id &&
      (!!creditNote?.taxProviderId || !!creditNote?.taxProviderSyncable),
  }

  const canShowExternalSyncTab = Object.values(hasIntegration).some((value) => value)

  const actions = useMemo(() => {
    return {
      canDownload: hasPermissions(['creditNotesView']) && !disablePdfGeneration,
      canVoid: hasPermissions(['creditNotesVoid']) && creditNote?.canBeVoided,
      canCopy: true,
      canSync: !!creditNote?.integrationSyncable,
      canRetryTaxSync: !!creditNote?.taxProviderSyncable,
    }
  }, [creditNote, hasPermissions])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button icon="arrow-left" variant="quaternary" onClick={onGoBack} />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {creditNote?.number}
            </Typography>
          )}
        </PageHeader.Group>

        {!hasError && !loading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_637655cb50f04bf1c8379ce8')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                {actions.canDownload && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={!!loadingCreditNoteDownload}
                    onClick={async () => {
                      await downloadCreditNote({
                        variables: { input: { id: creditNote?.id || '' } },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_637655cb50f04bf1c8379cea')}
                  </Button>
                )}
                {actions.canVoid && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={async () => {
                      if (!creditNote?.id) return

                      voidCreditNoteDialogRef.current?.openDialog({
                        id: creditNote?.id,
                        totalAmountCents: creditNote?.totalAmountCents,
                        currency: creditNote?.currency,
                      })

                      closePopper()
                    }}
                  >
                    {translate('text_637655cb50f04bf1c8379cec')}
                  </Button>
                )}
                {actions.canCopy && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      copyToClipboard(creditNote?.id || '')
                      addToast({
                        severity: 'info',
                        translateKey: 'text_63766b1c4eeb35667c48f26d',
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_637655cb50f04bf1c8379cee')}
                  </Button>
                )}
                {actions.canSync && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={loadingSyncIntegrationCreditNote}
                    onClick={async () => {
                      await syncIntegrationCreditNote()

                      closePopper()
                    }}
                  >
                    {translate(
                      !!creditNote?.customer.netsuiteCustomer
                        ? 'text_665d742ee9853200e3a6be7f'
                        : 'text_66911d4b4b3c3e005c62ab49',
                    )}
                  </Button>
                )}
                {actions.canRetryTaxSync && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={loadingSyncIntegrationCreditNote}
                    onClick={async () => {
                      await retryTaxSync()

                      closePopper()
                    }}
                  >
                    {translate('text_17270681462632d46dh3r1vu')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      {hasError && (
        <GenericPlaceholder
          title={translate('text_634812d6f16b31ce5cbf4111')}
          subtitle={translate('text_634812d6f16b31ce5cbf411f')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      )}

      {!hasError && (
        <>
          <DetailsPage.Header
            className="shadow-none shadow-inherit"
            isLoading={loading}
            icon="document"
            title={
              <div className="flex flex-row gap-2">
                <Typography variant="headline" color="grey700">
                  {creditNote?.number}
                </Typography>
                <CreditNoteBadge creditNote={creditNote as CreditNote} />
              </div>
            }
            description={`${translate('text_637655cb50f04bf1c8379cf2', {
              amount: intlFormatNumber(
                deserializeAmount(
                  creditNote?.totalAmountCents || 0,
                  creditNote?.currency || CurrencyEnum.Usd,
                ),
                {
                  currencyDisplay: 'symbol',
                  currency: creditNote?.currency || CurrencyEnum.Usd,
                },
              ),
            })} • ${creditNote?.id}`}
          />

          <NavigationTab
            className="mx-12"
            tabs={[
              {
                title: translate('text_637655cb50f04bf1c8379cfa'),
                link: generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                  customerId: customerId as string,
                  invoiceId: invoiceId as string,
                  creditNoteId: creditNoteId as string,
                  tab: CreditNoteDetailsTabsOptionsEnum.overview,
                }),
                match: [
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                    tab: CreditNoteDetailsTabsOptionsEnum.overview,
                  }),
                ],
                component: (
                  <DetailsPage.Container className="max-w-none">
                    <CreditNoteDetailsOverview
                      loadingCreditNoteDownload={loadingCreditNoteDownload}
                      downloadCreditNote={downloadCreditNote}
                    />
                  </DetailsPage.Container>
                ),
              },
              {
                title: translate('text_17489570558986035g3zp16t'),
                link: generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                  customerId: customerId as string,
                  invoiceId: invoiceId as string,
                  creditNoteId: creditNoteId as string,
                  tab: CreditNoteDetailsTabsOptionsEnum.externalSync,
                }),
                match: [
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                    tab: CreditNoteDetailsTabsOptionsEnum.externalSync,
                  }),
                ],
                component: (
                  <DetailsPage.Container className="max-w-none">
                    <CreditNoteDetailsExternalSync retryTaxSync={retryTaxSync} />
                  </DetailsPage.Container>
                ),
                hidden: !canShowExternalSyncTab,
              },
              {
                title: translate('text_1747314141347qq6rasuxisl'),
                link: generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                  customerId: customerId as string,
                  invoiceId: invoiceId as string,
                  creditNoteId: creditNoteId as string,
                  tab: CreditNoteDetailsTabsOptionsEnum.activityLogs,
                }),
                match: [
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    creditNoteId: creditNoteId as string,
                  }),
                  generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_TAB_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    creditNoteId: creditNoteId as string,
                    tab: CreditNoteDetailsTabsOptionsEnum.activityLogs,
                  }),
                ],
                component: (
                  <DetailsPage.Container className="max-w-none">
                    <CreditNoteDetailsActivityLogs creditNoteId={creditNoteId as string} />
                  </DetailsPage.Container>
                ),
                hidden: !creditNoteId || !isPremium || !hasPermissions(['auditLogsView']),
              },
            ]}
          />
        </>
      )}

      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </>
  )
}

export default CreditNoteDetails
