import { useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'

import { Accordion, Alert, Button, Popper, Typography } from '~/components/designSystem'
import {
  ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION,
  ADD_CUSTOMER_CRM_PROVIDER_ACCORDION,
  ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION,
  ADD_CUSTOMER_TAX_PROVIDER_ACCORDION,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import { IntegrationTypeEnum, ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'
import { MenuPopper } from '~/styles'

// import { AccountingProvidersAccordion } from './AccountingProvidersAccordion'
// import { CRMProvidersAccordion } from './CRMProvidersAccordion'
import { PaymentProvidersAccordion } from './paymentProvidersAccordion/PaymentProvidersAccordion'

// import { TaxProvidersAccordion } from './TaxProvidersAccordion'

type ExternalAppsAccordionProps = {
  isEdition: boolean
}

const defaultProps: ExternalAppsAccordionProps = {
  isEdition: false,
}

const ExternalAppsAccordion = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render: function Render({ form, isEdition }) {
    const { translate } = useInternationalization()

    const integrationCustomers = useStore(form.store, (state) => state.values.integrationCustomers)
    const paymentProvider = useStore(form.store, (state) => state.values.paymentProvider)
    const providerCustomer = useStore(form.store, (state) => state.values.providerCustomer)

    const hadInitialAccountingProvider = !!integrationCustomers?.find((i) =>
      [IntegrationTypeEnum.Netsuite, IntegrationTypeEnum.Xero].includes(
        i.integrationType as IntegrationTypeEnum,
      ),
    )
    const hadInitialTaxProvider = !!integrationCustomers?.find((i) =>
      [IntegrationTypeEnum.Anrok, IntegrationTypeEnum.Avalara].includes(
        i.integrationType as IntegrationTypeEnum,
      ),
    )
    const hadInitialCRMProvider = !!integrationCustomers?.find((i) =>
      [IntegrationTypeEnum.Hubspot, IntegrationTypeEnum.Salesforce].includes(
        i.integrationType as IntegrationTypeEnum,
      ),
    )

    const [showPaymentSection, setShowPaymentSection] = useState(!!paymentProvider)
    const [showAccountingSection, setShowAccountingSection] = useState(hadInitialAccountingProvider)
    const [showTaxSection, setShowTaxSection] = useState(hadInitialTaxProvider)
    const [showCRMSection, setShowCRMSection] = useState(hadInitialCRMProvider)

    useEffect(() => {
      setShowPaymentSection(!!paymentProvider)
    }, [paymentProvider])

    useEffect(
      () => setShowAccountingSection(hadInitialAccountingProvider),
      [hadInitialAccountingProvider],
    )
    useEffect(() => setShowTaxSection(hadInitialTaxProvider), [hadInitialTaxProvider])
    useEffect(() => setShowCRMSection(hadInitialCRMProvider), [hadInitialCRMProvider])

    return (
      <Accordion
        variant="borderless"
        summary={
          <div className="flex flex-col gap-2">
            <Typography variant="subhead1">{translate('text_66423cad72bbad009f2f5689')}</Typography>
            <Typography variant="caption">{translate('text_1735828930375zjo8m3yh5ra')}</Typography>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {showPaymentSection && (
            <PaymentProvidersAccordion form={form} setShowPaymentSection={setShowPaymentSection} />
          )}

          {/* {showAccountingSection && (
            <AccountingProvidersAccordion
              setShowAccountingSection={setShowAccountingSection}
              isEdition={isEdition}
            />
          )} */}

          {/* {showTaxSection && (
            <TaxProvidersAccordion setShowTaxSection={setShowTaxSection} isEdition={isEdition} />
          )} */}

          {/* {showCRMSection && (
            <CRMProvidersAccordion setShowCRMSection={setShowCRMSection} isEdition={isEdition} />
          )} */}

          <Popper
            PopperProps={{ placement: 'bottom-start' }}
            opener={
              <Button
                startIcon="plus"
                variant="inline"
                disabled={
                  showAccountingSection && showPaymentSection && showTaxSection && showCRMSection
                }
              >
                {translate('text_65846763e6140b469140e235')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={showPaymentSection}
                  onClick={() => {
                    setShowPaymentSection(true)

                    scrollToAndClickElement({
                      selector: `.${ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                      callback: closePopper,
                    })
                  }}
                >
                  {translate('text_634ea0ecc6147de10ddb6631')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={showAccountingSection}
                  onClick={() => {
                    setShowAccountingSection(true)

                    scrollToAndClickElement({
                      selector: `.${ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                      callback: closePopper,
                    })
                  }}
                >
                  {translate('text_66423cad72bbad009f2f568f')}
                </Button>

                <Button
                  variant="quaternary"
                  align="left"
                  disabled={showTaxSection}
                  onClick={() => {
                    setShowTaxSection(true)

                    scrollToAndClickElement({
                      selector: `.${ADD_CUSTOMER_TAX_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                      callback: closePopper,
                    })
                  }}
                >
                  {translate('text_6668821d94e4da4dfd8b3840')}
                </Button>

                <Button
                  variant="quaternary"
                  align="left"
                  disabled={showCRMSection}
                  onClick={() => {
                    setShowCRMSection(true)

                    scrollToAndClickElement({
                      selector: `.${ADD_CUSTOMER_CRM_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                      callback: closePopper,
                    })
                  }}
                >
                  {translate('text_1728658962985xpfdvl5ru8a')}
                </Button>
              </MenuPopper>
            )}
          </Popper>

          {!!providerCustomer.syncWithProvider &&
            (paymentProvider === ProviderTypeEnum.Gocardless ||
              paymentProvider === ProviderTypeEnum.Adyen) && (
              <Alert type="info">
                {paymentProvider === ProviderTypeEnum.Gocardless
                  ? translate('text_635bdbda84c98758f9bba8ae')
                  : translate('text_645d0728ea0a5a7bbf76d5c9')}
              </Alert>
            )}
        </div>
      </Accordion>
    )
  },
})

export default ExternalAppsAccordion
