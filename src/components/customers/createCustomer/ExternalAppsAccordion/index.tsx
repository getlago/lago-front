import { FormikProps } from 'formik'
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
import {
  CreateCustomerInput,
  IntegrationTypeEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import { AccountingProvidersAccordion } from './AccountingProvidersAccordion'
import { CRMProvidersAccordion } from './CRMProvidersAccordion'
import { PaymentProvidersAccordion } from './PaymentProvidersAccordion'
import { TaxProvidersAccordion } from './TaxProvidersAccordion'

type TExternalAppsAccordionProps = {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  isEdition: boolean
}

export const ExternalAppsAccordion = ({ formikProps, isEdition }: TExternalAppsAccordionProps) => {
  const { translate } = useInternationalization()

  const hadInitialAccountingProvider = !!formikProps.values.integrationCustomers?.find((i) =>
    [IntegrationTypeEnum.Netsuite, IntegrationTypeEnum.Xero].includes(
      i.integrationType as IntegrationTypeEnum,
    ),
  )
  const hadInitialTaxProvider = !!formikProps.values.integrationCustomers?.find((i) =>
    [IntegrationTypeEnum.Anrok, IntegrationTypeEnum.Avalara].includes(
      i.integrationType as IntegrationTypeEnum,
    ),
  )
  const hadInitialCRMProvider = !!formikProps.values.integrationCustomers?.find((i) =>
    [IntegrationTypeEnum.Hubspot, IntegrationTypeEnum.Salesforce].includes(
      i.integrationType as IntegrationTypeEnum,
    ),
  )

  const [showPaymentSection, setShowPaymentSection] = useState(!!formikProps.values.paymentProvider)
  const [showAccountingSection, setShowAccountingSection] = useState(hadInitialAccountingProvider)
  const [showTaxSection, setShowTaxSection] = useState(hadInitialTaxProvider)
  const [showCRMSection, setShowCRMSection] = useState(hadInitialCRMProvider)

  useEffect(() => {
    setShowPaymentSection(!!formikProps.values.paymentProvider)
  }, [formikProps.values.paymentProvider])

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
          <PaymentProvidersAccordion
            formikProps={formikProps}
            setShowPaymentSection={setShowPaymentSection}
          />
        )}
        {showAccountingSection && (
          <AccountingProvidersAccordion
            formikProps={formikProps}
            setShowAccountingSection={setShowAccountingSection}
            isEdition={isEdition}
          />
        )}
        {showTaxSection && (
          <TaxProvidersAccordion
            formikProps={formikProps}
            setShowTaxSection={setShowTaxSection}
            isEdition={isEdition}
          />
        )}
        {showCRMSection && (
          <CRMProvidersAccordion
            formikProps={formikProps}
            setShowCRMSection={setShowCRMSection}
            isEdition={isEdition}
          />
        )}

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

        {!!formikProps.values.providerCustomer?.syncWithProvider &&
          (formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless ||
            formikProps.values.paymentProvider === ProviderTypeEnum.Adyen) && (
            <Alert type="info">
              {formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                ? translate('text_635bdbda84c98758f9bba8ae')
                : translate('text_645d0728ea0a5a7bbf76d5c9')}
            </Alert>
          )}
      </div>
    </Accordion>
  )
}

ExternalAppsAccordion.displayName = 'ExternalAppsAccordion'
