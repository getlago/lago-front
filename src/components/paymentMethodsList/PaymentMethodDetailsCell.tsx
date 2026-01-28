import { Icon } from 'lago-design-system'

import { Typography } from '~/components/designSystem'
import { PaymentMethodDetails } from '~/components/paymentMethodSelection/PaymentMethodDetails'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

export const DEFAULT_BADGE_TEST_ID = 'default-badge'

interface PaymentMethodDetailsCellProps {
  item: PaymentMethodItem
}

export const PaymentMethodDetailsCell = ({ item }: PaymentMethodDetailsCellProps): JSX.Element => {
  return (
    <div className="flex items-center gap-3">
      {/* ICON */}
      <div className="flex size-10 items-center justify-center rounded-xl bg-grey-100">
        <Icon name="coin-dollar" color="dark" />
      </div>

      <div className="flex flex-1 flex-col">
        <PaymentMethodDetails
          details={item.details}
          isDefault={item.isDefault}
          className="gap-1"
          data-test={DEFAULT_BADGE_TEST_ID}
        />

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
              {item.id}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}
