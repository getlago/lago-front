import { Chip, Typography } from '~/components/designSystem'
import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface PaymentMethodDetailsProps {
  details?: {
    type?: string | null
    brand?: string | null
    last4?: string | null
    expirationMonth?: string | null
    expirationYear?: string | null
  } | null
  isDefault?: boolean
  showExpiration?: boolean
  className?: string
  'data-test'?: string
}

export const PaymentMethodDetails = ({
  details,
  isDefault = false,
  showExpiration = true,
  className = 'gap-2',
  'data-test': dataTest,
}: PaymentMethodDetailsProps): JSX.Element | null => {
  const { translate } = useInternationalization()
  const formattedDetails = formatPaymentMethodDetails(details)

  if (!formattedDetails) return null

  return (
    <div className={`flex flex-wrap items-center ${className}`}>
      <Typography variant="body" color="grey700">
        {formattedDetails}
      </Typography>
      {showExpiration && details?.expirationMonth && details?.expirationYear && (
        <Chip
          label={`${translate('text_1762437511802zhw5mx0iamd')} ${details.expirationMonth}/${details.expirationYear}`}
          type="primary"
          color="grey700"
          variant="caption"
          size="small"
          className="ml-2"
        />
      )}
      {isDefault && (
        <Chip
          data-test={dataTest}
          label={translate('text_17440321235444hcxi31f8j6')}
          type="secondary"
          variant="caption"
          color="info600"
          size="small"
          className="ml-2 bg-purple-100"
        />
      )}
    </div>
  )
}
