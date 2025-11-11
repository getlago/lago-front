import { Icon } from 'lago-design-system'

import { Chip, Typography } from '~/components/designSystem'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

const OBFUSCATED_LAST4_PREFIX = '••••'

export const DEFAULT_BADGE_TEST_ID = 'default-badge'

interface PaymentMethodDetailsCellProps {
  item: PaymentMethodItem
}

export const PaymentMethodDetailsCell = ({ item }: PaymentMethodDetailsCellProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center gap-3">
      {/* ICON */}
      <div className="flex size-10 items-center justify-center rounded-xl bg-grey-100">
        <Icon name="coin-dollar" color="dark" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-1">
          {/* PAYMENT METHOD DETAILS */}
          {item.details?.type && (
            <Typography variant="body" className="capitalize text-grey-700">
              {item.details.type}
            </Typography>
          )}
          {item.details?.type && item.details?.brand && (
            <Typography variant="body" className="text-grey-700">
              {' - '}
            </Typography>
          )}
          {item.details?.brand && (
            <Typography variant="body" className="capitalize text-grey-700">
              {item.details.brand}
            </Typography>
          )}
          {item.details?.last4 && (
            <Typography variant="body" className="text-grey-700">
              {OBFUSCATED_LAST4_PREFIX} {item.details.last4}
            </Typography>
          )}

          {/* EXPIRATION DATE */}
          {item.details?.expirationMonth && item.details?.expirationYear && (
            <Chip
              label={`${translate('text_1762437511802zhw5mx0iamd')} ${item.details.expirationMonth}/${item.details.expirationYear}`}
              type="primary"
              color="grey700"
              variant="caption"
              size="small"
              className="ml-2"
            />
          )}

          {/* DEFAULT BADGE */}
          {item.isDefault && (
            <Chip
              data-test={DEFAULT_BADGE_TEST_ID}
              label={translate('text_17440321235444hcxi31f8j6')}
              type="secondary"
              variant="caption"
              color="info600"
              size="small"
              className="ml-2 bg-purple-100"
            />
          )}
        </div>

        {/* PSP INFO */}
        <div className="flex items-center gap-1">
          {item.paymentProviderType && (
            <PaymentProviderChip
              paymentProvider={item.paymentProviderType}
              className="text-xs"
              textVariant="caption"
              textColor="grey500"
            />
          )}
          {item.paymentProviderType && item.paymentProviderCode && (
            <Typography variant="caption" className="text-grey-500">
              {' • '}
            </Typography>
          )}
          {item.paymentProviderCode && (
            <Typography variant="caption" className="text-grey-500">
              {item.paymentProviderCode}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}
