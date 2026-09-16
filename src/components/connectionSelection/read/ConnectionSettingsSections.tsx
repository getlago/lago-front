import { ReactNode } from 'react'

import { ConnectionCategory } from '~/components/customerConnections/types'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PaymentMethodValue } from './PaymentMethodValue'
import {
  ConnectionRoutingGridItem,
  ConnectionRoutingRow,
  useConnectionRoutingGridItems,
} from './useConnectionRoutingGridItems'

export const CONNECTION_SETTINGS_PAYMENT_SECTION_TEST_ID = 'connection-settings-payment-section'
export const CONNECTION_SETTINGS_ADDITIONAL_SECTION_TEST_ID =
  'connection-settings-additional-section'

const ADDITIONAL_CATEGORIES = [
  ConnectionCategory.Tax,
  ConnectionCategory.Accounting,
  ConnectionCategory.Crm,
]

type SectionHeaderProps = {
  title: string
  description: string
  action?: ReactNode
}

const SectionHeader = ({ title, description, action }: SectionHeaderProps): JSX.Element => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex flex-col">
      <Typography variant="bodyHl" color="grey700">
        {title}
      </Typography>

      <Typography variant="caption" color="grey600">
        {description}
      </Typography>
    </div>

    {!!action && action}
  </div>
)

type ConnectionSettingsSectionsProps = {
  connections?: ConnectionRoutingRow[] | null
  customerId?: string
  externalCustomerId?: string
  selectedPaymentMethod?: SelectedPaymentMethod
  paymentDescription: string
  additionalDescription: string
  paymentAction?: ReactNode
  additionalAction?: ReactNode
  extraPaymentItems?: ConnectionRoutingGridItem[]
}

export const ConnectionSettingsSections = ({
  connections,
  customerId,
  externalCustomerId,
  selectedPaymentMethod,
  paymentDescription,
  additionalDescription,
  paymentAction,
  additionalAction,
  extraPaymentItems = [],
}: ConnectionSettingsSectionsProps): JSX.Element => {
  const { translate } = useInternationalization()

  const paymentConnectionItems = useConnectionRoutingGridItems({
    categories: [ConnectionCategory.Payment],
    connections,
    customerId,
  })

  const additionalConnectionItems = useConnectionRoutingGridItems({
    categories: ADDITIONAL_CATEGORIES,
    connections,
    customerId,
  })

  return (
    <>
      <section
        data-test={CONNECTION_SETTINGS_PAYMENT_SECTION_TEST_ID}
        className="flex flex-col gap-6 pb-12 shadow-b"
      >
        <SectionHeader
          title={translate('text_1782825858647rr5zp42t63m')}
          description={paymentDescription}
          action={paymentAction}
        />

        <DetailsPage.InfoGrid
          grid={[
            ...paymentConnectionItems,
            {
              label: translate('text_1773043324341qj7t72i7qnk'),
              value: (
                <PaymentMethodValue
                  selectedPaymentMethod={selectedPaymentMethod}
                  externalCustomerId={externalCustomerId}
                />
              ),
            },
            ...extraPaymentItems,
          ]}
        />
      </section>

      <section
        data-test={CONNECTION_SETTINGS_ADDITIONAL_SECTION_TEST_ID}
        className="flex flex-col gap-6 pb-12"
      >
        <SectionHeader
          title={translate('text_178955797239251hkkoh9sbb')}
          description={additionalDescription}
          action={additionalAction}
        />

        <div className="flex flex-col gap-4">
          {additionalConnectionItems.map((item) => (
            <DetailsPage.InfoGridItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </section>
    </>
  )
}
