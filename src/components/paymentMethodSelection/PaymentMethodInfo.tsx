import { Typography } from '~/components/designSystem'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { ProviderTypeEnum } from '~/generated/graphql'

import { PaymentMethodDetails } from './PaymentMethodDetails'

export const DEFAULT_BADGE_TEST_ID = 'default-badge'

interface PaymentMethodInfoProps {
  id: string
  details?: {
    type?: string | null
    brand?: string | null
    last4?: string | null
    expirationMonth?: string | null
    expirationYear?: string | null
  } | null
  isDefault: boolean
  paymentProviderType?: ProviderTypeEnum | null
  showExpiration: boolean
  showProviderAvatar: boolean
}

export const PaymentMethodInfo = ({
  id,
  details,
  isDefault,
  paymentProviderType,
  showExpiration,
  showProviderAvatar,
}: PaymentMethodInfoProps): JSX.Element => {
  return (
    <div className="flex flex-1 flex-col">
      <PaymentMethodDetails
        details={details}
        isDefault={isDefault}
        showExpiration={showExpiration}
        className="gap-1"
        data-test={DEFAULT_BADGE_TEST_ID}
      />

      {/* PSP INFO */}
      <div className="flex items-center gap-1">
        {paymentProviderType && (
          <PaymentProviderChip
            paymentProvider={paymentProviderType}
            className="text-xs"
            textVariant="caption"
            textColor="grey500"
            showAvatar={showProviderAvatar}
          />
        )}
        {paymentProviderType && id && (
          <Typography variant="caption" className="text-grey-500">
            {' • '}
          </Typography>
        )}
        {id && (
          <Typography variant="caption" className="text-grey-500">
            {id}
          </Typography>
        )}
      </div>
    </div>
  )
}
