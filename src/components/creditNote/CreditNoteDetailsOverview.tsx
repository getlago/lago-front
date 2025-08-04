import { gql, MutationFunction } from '@apollo/client'
import { Button, ConditionalWrapper, Typography } from 'lago-design-system'
import { FC } from 'react'
import { generatePath, Link, useParams } from 'react-router-dom'

import { CreditNoteDetailsOverviewTable } from '~/components/creditNote/CreditNoteDetailsOverviewTable'
import { Status } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { envGlobalVar } from '~/core/apolloClient'
import {
  creditNoteCreditStatusMapping,
  creditNoteRefundStatusMapping,
} from '~/core/constants/statusCreditNoteMapping'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CreditNoteDetailsForOverviewTableFragmentDoc,
  CurrencyEnum,
  DownloadCreditNoteMutation,
  DownloadCreditNoteMutationVariables,
  useGetCreditNoteForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { SectionHeader } from '~/styles/customer'

const { disablePdfGeneration } = envGlobalVar()

gql`
  query getCreditNoteForDetailsOverview($id: ID!) {
    creditNote(id: $id) {
      id
      createdAt
      balanceAmountCents
      currency
      creditStatus
      refundStatus
      refundedAt
      refundAmountCents
      billingEntity {
        name
        code
      }
      customer {
        id
        name
        displayName
        deletedAt
        applicableTimezone
      }
      ...CreditNoteDetailsForOverviewTable
    }
  }

  ${CreditNoteDetailsForOverviewTableFragmentDoc}
`

interface CreditNoteDetailsOverviewProps {
  loadingCreditNoteDownload: boolean
  downloadCreditNote: MutationFunction<
    DownloadCreditNoteMutation,
    DownloadCreditNoteMutationVariables
  >
}

export const CreditNoteDetailsOverview: FC<CreditNoteDetailsOverviewProps> = ({
  loadingCreditNoteDownload,
  downloadCreditNote,
}) => {
  const { customerId, creditNoteId } = useParams()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  const { data, loading, error } = useGetCreditNoteForDetailsOverviewQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId || !customerId,
  })

  const creditNote = data?.creditNote
  const isRefunded = creditNote?.refundAmountCents > 0

  const hasError = (!!error || !creditNote) && !loading

  const status = isRefunded
    ? creditNoteRefundStatusMapping(creditNote?.refundStatus)
    : creditNoteCreditStatusMapping(creditNote?.creditStatus)

  return (
    <div>
      <SectionHeader variant="subhead1">
        {translate('text_637655cb50f04bf1c8379cfa')}
        {!hasError && !loading && hasPermissions(['creditNotesView']) && !disablePdfGeneration && (
          <Button
            variant="quaternary"
            disabled={loadingCreditNoteDownload}
            onClick={async () => {
              await downloadCreditNote({
                variables: { input: { id: creditNoteId || '' } },
              })
            }}
          >
            {translate('text_637655cb50f04bf1c8379cf8')}
          </Button>
        )}
      </SectionHeader>

      {creditNote?.billingEntity && (
        <div className="box-border flex items-center gap-2 py-6 shadow-b">
          <div className="min-w-[140px]">
            <Typography variant="body" color="grey600">
              {translate('text_1743611497157teaa1zu8l24')}
            </Typography>
          </div>

          <Typography variant="body" color="grey700">
            {creditNote?.billingEntity.name || creditNote?.billingEntity.code}
          </Typography>
        </div>
      )}

      <DetailsPage.Overview
        isLoading={loading}
        leftColumn={
          <>
            {creditNote?.customer?.name && (
              <>
                <DetailsPage.OverviewLine
                  title={translate('text_637655cb50f04bf1c8379cfe')}
                  value={
                    <ConditionalWrapper
                      condition={
                        !!creditNote?.customer.deletedAt && hasPermissions(['customersView'])
                      }
                      validWrapper={(children) => <>{children}</>}
                      invalidWrapper={(children) => (
                        <Link
                          className="visited:text-blue"
                          to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                            customerId: creditNote?.customer?.id,
                          })}
                        >
                          {children}
                        </Link>
                      )}
                    >
                      {creditNote?.customer?.displayName}
                    </ConditionalWrapper>
                  }
                />
                {creditNote?.invoice?.number && (
                  <DetailsPage.OverviewLine
                    title={translate('text_637655cb50f04bf1c8379d02')}
                    value={
                      <Link
                        className="visited:text-blue"
                        to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                          customerId: creditNote?.customer?.id,
                          invoiceId: creditNote?.invoice.id,
                          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                        })}
                      >
                        {creditNote?.invoice?.number}
                      </Link>
                    }
                  />
                )}
              </>
            )}
            {creditNote?.createdAt && (
              <DetailsPage.OverviewLine
                title={translate('text_637655cb50f04bf1c8379d06')}
                value={
                  intlFormatDateTime(creditNote?.createdAt, {
                    timezone: creditNote?.customer.applicableTimezone,
                  }).date
                }
              />
            )}
          </>
        }
        rightColumn={
          <>
            {!isRefunded && (
              <DetailsPage.OverviewLine
                title={translate('text_637655cb50f04bf1c8379d0a')}
                value={intlFormatNumber(
                  deserializeAmount(
                    creditNote?.balanceAmountCents || 0,
                    creditNote?.currency || CurrencyEnum.Usd,
                  ),
                  {
                    currencyDisplay: 'symbol',
                    currency: creditNote?.currency || CurrencyEnum.Usd,
                  },
                )}
              />
            )}
            <DetailsPage.OverviewLine
              title={
                isRefunded
                  ? translate('text_637656ef3d876b0269edc79f')
                  : translate('text_637655cb50f04bf1c8379d0e')
              }
              value={
                <Status
                  {...status}
                  labelVariables={{
                    date: intlFormatDateTime(creditNote?.refundedAt, {
                      timezone: creditNote?.customer.applicableTimezone,
                    }).date,
                  }}
                />
              }
            />
          </>
        }
      />

      <CreditNoteDetailsOverviewTable loading={loading} creditNote={creditNote} />
    </div>
  )
}
