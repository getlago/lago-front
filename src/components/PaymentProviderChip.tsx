import { FC } from 'react'

import { Avatar, Icon, Typography } from '~/components/designSystem'
import { ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Cashfree from '~/public/images/cashfree.svg'
import Gocardless from '~/public/images/gocardless.svg'
import Moneyhash from '~/public/images/moneyhash.svg'
import Stripe from '~/public/images/stripe.svg'
import { tw } from '~/styles/utils'

interface PaymentProviderChipProps {
  paymentProvider?: ProviderTypeEnum | 'manual' | 'manual_long'
  label?: string
  className?: string
}

const providers: Record<ProviderTypeEnum, { icon: JSX.Element; label: string }> = {
  [ProviderTypeEnum.Stripe]: {
    icon: <Stripe />,
    label: 'text_62b1edddbf5f461ab971277d',
  },
  [ProviderTypeEnum.Adyen]: {
    icon: <Adyen />,
    label: 'text_645d071272418a14c1c76a6d',
  },
  [ProviderTypeEnum.Gocardless]: {
    icon: <Gocardless />,
    label: 'text_634ea0ecc6147de10ddb6625',
  },
  [ProviderTypeEnum.Cashfree]: {
    icon: <Cashfree />,
    label: 'text_17367626793434wkg1rk0114',
  },
  [ProviderTypeEnum.Moneyhash]: {
    icon: <Moneyhash />,
    label: 'text_1733427981129n3wxjui0bex',
  },
}

export const PaymentProviderChip: FC<PaymentProviderChipProps> = ({
  paymentProvider,
  label,
  className,
}) => {
  const { translate } = useInternationalization()

  if (paymentProvider === undefined) {
    return null
  }

  const isManual = paymentProvider === 'manual' || paymentProvider === 'manual_long'
  const manualLabel =
    paymentProvider === 'manual' ? 'text_1737110192586abtitcui0xt' : 'text_173799550683709p2rqkoqd5'

  return (
    <div className={tw('flex flex-nowrap items-center gap-2', className)}>
      <Avatar variant="connector" size="small">
        {paymentProvider === 'manual' || paymentProvider === 'manual_long' ? (
          <Icon name="receipt" color="dark" size="small" />
        ) : (
          providers[paymentProvider].icon
        )}
      </Avatar>
      <Typography variant="body" color="textSecondary" noWrap>
        {isManual ? translate(manualLabel) : (label ?? translate(providers[paymentProvider].label))}
      </Typography>
    </div>
  )
}
