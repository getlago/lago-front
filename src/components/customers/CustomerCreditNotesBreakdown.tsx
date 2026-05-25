import { useMemo } from 'react'

import { BillingEntityLabel } from '~/components/billingEntity/BillingEntityLabel'
import { Chip } from '~/components/designSystem/Chip'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CustomerCreditNotesBalance } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type CreditNotesBalanceRow = Pick<
  CustomerCreditNotesBalance,
  'currency' | 'billingEntityId' | 'amountCents' | 'creditsAvailableCount'
>

type CreditNotesBalanceTableRow = CreditNotesBalanceRow & { id: string }

interface CustomerCreditNotesBreakdownProps {
  creditNotesBalances?: CreditNotesBalanceRow[]
  customerBillingEntity?: { id: string; code: string; name?: string | null } | null
}

/**
 * Per (currency × billing_entity) breakdown of a customer's credit notes
 * balance. One row per bucket with non-zero remaining balance.
 *
 * Rendered when at least one of `multi_currency` / `multi_entity_billing`
 * is enabled. The parent (`CustomerCreditNotesList`) owns the flag gating
 * and falls back to a single legacy card when both flags are off.
 */
export const CustomerCreditNotesBreakdown = ({
  creditNotesBalances,
  customerBillingEntity,
}: CustomerCreditNotesBreakdownProps) => {
  const { translate } = useInternationalization()

  // Hide buckets with zero remaining balance — operator only cares about
  // credits they can still spend.
  const rows = useMemo<CreditNotesBalanceTableRow[]>(() => {
    return (creditNotesBalances ?? [])
      .filter((b) => Number(b.amountCents) > 0)
      .map((b) => ({ ...b, id: `${b.currency}|${b.billingEntityId}` }))
  }, [creditNotesBalances])

  const columns: TableColumn<CreditNotesBalanceTableRow>[] = [
    {
      key: 'currency',
      minWidth: 80,
      title: translate('text_632b4acf0c41206cbcb8c324'),
      content: ({ currency }) => <Chip size="medium" label={currency} />,
    },
    {
      key: 'billingEntityId',
      maxSpace: true,
      title: translate('text_17436114971570doqrwuwhf0'),
      content: ({ billingEntityId, creditsAvailableCount }) => (
        <div className="flex flex-col">
          <Typography variant="bodyHl" color="grey700">
            <BillingEntityLabel ownId={billingEntityId} customerEntity={customerBillingEntity} />
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate(
              'text_63725b30957fd5b26b308ddb',
              { count: creditsAvailableCount },
              creditsAvailableCount,
            )}
          </Typography>
        </div>
      ),
    },
    {
      key: 'amountCents',
      textAlign: 'right',
      title: translate('text_1779711754281pbvb802zcqp'),
      content: ({ amountCents, currency }) => (
        <Typography variant="body" color="grey700">
          {intlFormatNumber(deserializeAmount(amountCents, currency) || 0, {
            currencyDisplay: 'symbol',
            currency,
          })}
        </Typography>
      ),
    },
  ]

  return (
    <Table
      name="customer-credit-notes-breakdown"
      data={rows}
      containerSize={{ default: 0 }}
      rowSize={72}
      columns={columns}
      isLoading={false}
    />
  )
}
