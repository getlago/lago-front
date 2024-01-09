import { Typography } from '~/components/designSystem'

type InvoiceDetailsTablePeriodLineProps = {
  canHaveUnitPrice: boolean
  period: string
}

export const InvoiceDetailsTablePeriodLine = ({
  canHaveUnitPrice,
  period,
}: InvoiceDetailsTablePeriodLineProps) => {
  return (
    <tr>
      <td colSpan={canHaveUnitPrice ? 5 : 4}>
        <Typography variant="captionHl" color="grey600">
          {period}
        </Typography>
      </td>
    </tr>
  )
}
