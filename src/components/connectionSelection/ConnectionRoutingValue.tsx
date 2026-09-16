import { ReactNode } from 'react'

import { integrationAvatarMapping, paymentAvatarMapping } from '~/components/avatarMappings'
import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { Typography } from '~/components/designSystem/Typography'
import { ConnectionResolvedBehaviorEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerIntegrationConnections } from '~/hooks/customer/useCustomerIntegrationConnections'
import { useCustomerPaymentConnections } from '~/hooks/customer/useCustomerPaymentConnections'

import { ConnectionCodeChip } from './ConnectionCodeChip'

export const CONNECTION_ROUTING_CHIP_TEST_ID = 'connection-routing-chip'
export const CONNECTION_ROUTING_INHERITED_TEST_ID = 'connection-routing-inherited'
export const CONNECTION_ROUTING_SKIPPED_TEST_ID = 'connection-routing-skipped'
export const CONNECTION_ROUTING_UNRESOLVED_TEST_ID = 'connection-routing-unresolved'

export type ConnectionRoutingDisplay = {
  behavior: ConnectionResolvedBehaviorEnum
  code?: string | null
}

type ConnectionRoutingChipProps = {
  routing?: ConnectionRoutingDisplay
  avatar?: ReactNode
}

const ConnectionRoutingChip = ({ routing, avatar }: ConnectionRoutingChipProps): JSX.Element => {
  const { translate } = useInternationalization()

  if (routing?.behavior === ConnectionResolvedBehaviorEnum.Skip) {
    return (
      <Typography
        data-test={CONNECTION_ROUTING_SKIPPED_TEST_ID}
        variant="body"
        color="grey700"
        component="span"
      >
        {translate('text_1789472252793x3dxbqu3x10')}
      </Typography>
    )
  }

  if (!routing?.code) {
    return (
      <Typography
        data-test={CONNECTION_ROUTING_UNRESOLVED_TEST_ID}
        variant="body"
        color="grey700"
        component="span"
      >
        {translate('text_1789382180711vi1jj3immjw')}
      </Typography>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <ConnectionCodeChip
        code={routing.code}
        avatar={avatar}
        data-test={CONNECTION_ROUTING_CHIP_TEST_ID}
      />

      {routing.behavior === ConnectionResolvedBehaviorEnum.Inherit && (
        <Typography
          data-test={CONNECTION_ROUTING_INHERITED_TEST_ID}
          variant="body"
          color="grey600"
          component="span"
        >
          {`(${translate('text_1789558944658bay5bstkcut')})`}
        </Typography>
      )}
    </span>
  )
}

const PaymentConnectionRoutingValue = ({
  customerId,
  routing,
}: {
  customerId?: string
  routing?: ConnectionRoutingDisplay
}): JSX.Element => {
  const { connections } = useCustomerPaymentConnections({ customerId, skip: !routing?.code })

  const provider = connections.find((connection) => connection.code === routing?.code)?.provider

  return (
    <ConnectionRoutingChip
      routing={routing}
      avatar={provider ? paymentAvatarMapping[provider] : undefined}
    />
  )
}

const IntegrationConnectionRoutingValue = ({
  category,
  customerId,
  routing,
}: {
  category: IntegrationConnectionCategory
  customerId?: string
  routing?: ConnectionRoutingDisplay
}): JSX.Element => {
  const { connections } = useCustomerIntegrationConnections({
    customerId,
    category,
    skip: !routing?.code,
  })

  const integrationType = connections.find(
    (connection) => connection.code === routing?.code,
  )?.integrationType

  return (
    <ConnectionRoutingChip
      routing={routing}
      avatar={integrationType ? integrationAvatarMapping[integrationType] : undefined}
    />
  )
}

type ConnectionRoutingValueProps = {
  category: ConnectionCategory
  customerId?: string
  routing?: ConnectionRoutingDisplay
}

export const ConnectionRoutingValue = ({
  category,
  customerId,
  routing,
}: ConnectionRoutingValueProps): JSX.Element => {
  if (category === ConnectionCategory.Payment) {
    return <PaymentConnectionRoutingValue customerId={customerId} routing={routing} />
  }

  return (
    <IntegrationConnectionRoutingValue
      category={category}
      customerId={customerId}
      routing={routing}
    />
  )
}
