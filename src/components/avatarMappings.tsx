import { ReactNode } from 'react'

import { IntegrationTypeEnum, ProviderTypeEnum } from '~/generated/graphql'
import Adyen from '~/public/images/adyen.svg'
import Anrok from '~/public/images/anrok.svg'
import Avalara from '~/public/images/avalara.svg'
import Cashfree from '~/public/images/cashfree.svg'
import Flutterwave from '~/public/images/flutterwave.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Hubspot from '~/public/images/hubspot.svg'
import Moneyhash from '~/public/images/moneyhash.svg'
import Netsuite from '~/public/images/netsuite.svg'
import Salesforce from '~/public/images/salesforce.svg'
import Stripe from '~/public/images/stripe.svg'
import Xero from '~/public/images/xero.svg'

export const paymentAvatarMapping: Record<ProviderTypeEnum, ReactNode> = {
  [ProviderTypeEnum.Adyen]: <Adyen />,
  [ProviderTypeEnum.Cashfree]: <Cashfree />,
  [ProviderTypeEnum.Flutterwave]: <Flutterwave />,
  [ProviderTypeEnum.Gocardless]: <GoCardless />,
  [ProviderTypeEnum.Stripe]: <Stripe />,
  [ProviderTypeEnum.Moneyhash]: <Moneyhash />,
}

export const integrationAvatarMapping: Partial<Record<IntegrationTypeEnum, ReactNode>> = {
  [IntegrationTypeEnum.Netsuite]: <Netsuite />,
  [IntegrationTypeEnum.Xero]: <Xero />,
  [IntegrationTypeEnum.Anrok]: <Anrok />,
  [IntegrationTypeEnum.Avalara]: <Avalara />,
  [IntegrationTypeEnum.Hubspot]: <Hubspot />,
  [IntegrationTypeEnum.Salesforce]: <Salesforce />,
}
