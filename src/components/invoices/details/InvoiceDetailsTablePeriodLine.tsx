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
}: InvoiceDetailsTablePeriodLineProps): JSX.Element => {
  let colSpan = 4

  if (isDraftInvoice) {
    colSpan = 6
  } else if (canHaveUnitPrice) {
    colSpan = 5
  }

  return (
    <tr>
      <td colSpan={colSpan}>
        <Typography variant="captionHl" color="grey600">
          {period}
        </Typography>
      </td>
    </tr>
  )
}
