import type { TypographyProps as MuiTypographyProps } from '@mui/material/Typography'
import { Icon } from 'lago-design-system'
import { FC, ReactNode } from 'react'

import { paymentAvatarMapping } from '~/components/avatarMappings'
import { Avatar } from '~/components/designSystem/Avatar'
import { Typography, TypographyColor } from '~/components/designSystem/Typography'
import { PaymentTypeEnum, ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Coinbase from '~/public/images/coinbase.svg'
import { tw } from '~/styles/utils'

interface PaymentProviderChipProps {
  paymentProvider?: ProviderTypeEnum | 'manual' | 'manual_long' | 'x402'
  label?: string | null | undefined
  className?: string
  textVariant?: MuiTypographyProps['variant']
  textColor?: TypographyColor
  showAvatar?: boolean
}

export const providerLabels: Record<ProviderTypeEnum, string> = {
  [ProviderTypeEnum.Stripe]: 'text_62b1edddbf5f461ab971277d',
  [ProviderTypeEnum.Adyen]: 'text_645d071272418a14c1c76a6d',
  [ProviderTypeEnum.Gocardless]: 'text_634ea0ecc6147de10ddb6625',
  [ProviderTypeEnum.Cashfree]: 'text_17367626793434wkg1rk0114',
  [ProviderTypeEnum.Flutterwave]: 'text_1749724395108m0swrna0zt4',
  [ProviderTypeEnum.Moneyhash]: 'text_1733427981129n3wxjui0bex',
}

type PaymentProviderChipType = NonNullable<PaymentProviderChipProps['paymentProvider']>

type PaymentMethodInput = {
  paymentType?: PaymentTypeEnum | null
  paymentProviderType?: ProviderTypeEnum | null
  manualVariant?: 'manual' | 'manual_long'
}

const MANUAL_LABEL_KEYS: Record<'manual' | 'manual_long', string> = {
  manual: 'text_1737110192586abtitcui0xt',
  manual_long: 'text_173799550683709p2rqkoqd5',
}

const X402_LABEL_KEY = 'text_1793137178564a1ls2ponepm'

const isManualChip = (
  paymentProvider: PaymentProviderChipType,
): paymentProvider is 'manual' | 'manual_long' =>
  paymentProvider === 'manual' || paymentProvider === 'manual_long'

const chipLabelKey = (paymentProvider: PaymentProviderChipType): string => {
  if (isManualChip(paymentProvider)) return MANUAL_LABEL_KEYS[paymentProvider]
  if (paymentProvider === 'x402') return X402_LABEL_KEY

  return providerLabels[paymentProvider]
}

export const getPaymentProviderChipType = ({
  paymentType,
  paymentProviderType,
  manualVariant = 'manual',
}: PaymentMethodInput): PaymentProviderChipProps['paymentProvider'] => {
  if (paymentType === PaymentTypeEnum.Manual) return manualVariant
  if (paymentType === PaymentTypeEnum.X402) return 'x402'

  return paymentProviderType ?? undefined
}

export const getPaymentMethodLabelKey = (input: PaymentMethodInput): string | undefined => {
  const paymentProvider = getPaymentProviderChipType(input)

  return paymentProvider ? chipLabelKey(paymentProvider) : undefined
}

export const PaymentProviderChip: FC<PaymentProviderChipProps> = ({
  paymentProvider,
  label,
  className,
  textVariant = 'body',
  textColor = 'textSecondary',
  showAvatar = true,
}) => {
  const { translate } = useInternationalization()

  if (paymentProvider === undefined) {
    return null
  }

  const isManual = isManualChip(paymentProvider)

  const getDisplayLabel = (): string => {
    if (!isManual && paymentProvider !== 'x402' && label) return label

    return translate(chipLabelKey(paymentProvider))
  }

  const renderAvatar = (): ReactNode => {
    if (isManual) return <Icon name="receipt" color="dark" size="small" />
    if (paymentProvider === 'x402') return <Coinbase />

    return paymentAvatarMapping[paymentProvider]
  }

  return (
    <div className={tw('flex flex-nowrap items-center gap-2', className)}>
      {showAvatar && (
        <Avatar className="bg-white" variant="connector" size="small">
          {renderAvatar()}
        </Avatar>
      )}
      <Typography variant={textVariant} color={textColor} noWrap>
        {getDisplayLabel()}
      </Typography>
    </div>
  )
}
