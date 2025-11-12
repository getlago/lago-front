import { useState } from 'react'

import { Button, Card, Tooltip, Typography } from '~/components/designSystem'
import { InvoiceCustomerFooterSelection } from '~/components/invoiceCustomerFooterSelection'
import { PaymentMethodComboBox } from '~/components/paymentMethodComboBox'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
}

export const PaymentMethodsInvoiceSettings = ({ customer }: PaymentMethodsInvoiceSettingsProps) => {
  const { translate } = useInternationalization()
  const [shouldDisplayInvoiceCustomerFooterInput, setShouldDisplayInvoiceCustomerFooterInput] =
    useState(false)

  if (!customer || !customer?.externalId) return null

  return (
    <div className="not-last-child:mb-8">
      <Typography variant="headline">{translate('text_1762862388271au34vz50g8i')}</Typography>
      <Card>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17440371192353kif37ol194')}
          </Typography>
          <Typography variant="caption" className="mb-3">
            {translate('text_1762862363071z59xqjpg844')}
          </Typography>
          <PaymentMethodComboBox
            externalCustomerId={customer.externalId}
            label={translate('text_17440371192353kif37ol194')}
            placeholder={translate('text_1762173848714al2j36a59ce')}
            emptyText={translate('text_1762173891817jhfenej7eho')}
          />
        </div>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17628623882713knw0jtohiw')}
          </Typography>
          <Typography variant="caption" className="mb-4">
            {translate('text_1762862855282gldrtploh46')}
          </Typography>
          <div className="flex flex-col gap-4">
            {!shouldDisplayInvoiceCustomerFooterInput ? (
              <Button
                fitContent
                startIcon="plus"
                variant="inline"
                onClick={() => {
                  setShouldDisplayInvoiceCustomerFooterInput(true)
                }}
              >
                {translate('text_1762862908777d78m2z5d29a')}
              </Button>
            ) : (
              <div className="flex items-center">
                <div className="flex-1">
                  <InvoiceCustomerFooterSelection
                    externalCustomerId={customer.externalId}
                    placeholder={translate('text_1762947620814hsqq7d88d7c')}
                    emptyText={translate('text_1762952250941g1m9u5hpclb')}
                  />
                </div>

                <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                  <Button
                    icon="trash"
                    variant="quaternary"
                    onClick={() => {
                      setShouldDisplayInvoiceCustomerFooterInput(false)
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
