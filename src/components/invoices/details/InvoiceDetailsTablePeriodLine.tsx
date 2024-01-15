import { Typography } from '~/components/designSystem'

type InvoiceDetailsTablePeriodLineProps = {
  canHaveUnitPrice: boolean
  isDraftInvoice: boolean
  period: string
}

export const InvoiceDetailsTablePeriodLine = ({
  canHaveUnitPrice,
  isDraftInvoice,
  period,
}: InvoiceDetailsTablePeriodLineProps) => {
  return (
    <tr>
      <td colSpan={isDraftInvoice ? 6 : canHaveUnitPrice ? 5 : 4}>
        <Typography variant="captionHl" color="grey600">
          {period}
        </Typography>
      </td>
    </tr>
  )
}
