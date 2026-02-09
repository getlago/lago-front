import { Typography } from '~/components/designSystem/Typography'

interface PaymentMethodLabelNodeProps {
  headerText: string
  footerText?: string
}

export const PaymentMethodLabelNode = ({
  headerText,
  footerText,
}: PaymentMethodLabelNodeProps): React.ReactNode => {
  return (
    <div>
      <Typography variant="body" color="textSecondary">
        {headerText}
      </Typography>
      {footerText && <Typography variant="caption">{footerText}</Typography>}
    </div>
  )
}
