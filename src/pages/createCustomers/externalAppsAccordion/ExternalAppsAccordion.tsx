import { useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'

import { AddConnectionMenu } from '~/components/customerConnections/AddConnectionMenu'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { Accordion } from '~/components/designSystem/Accordion'
import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import {
  ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION,
  ADD_CUSTOMER_CRM_PROVIDER_ACCORDION,
  ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION,
  ADD_CUSTOMER_TAX_PROVIDER_ACCORDION,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import { AddCustomerDrawerFragment, ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'

import AccountingProvidersAccordion from './accountingProvidersAccordion/AccountingProvidersAccordion'
import CrmProvidersAccordion from './crmProvidersAccordion/CrmProvidersAccordion'
import PaymentProvidersAccordion from './paymentProvidersAccordion/PaymentProvidersAccordion'
import TaxProvidersAccordion from './taxProvidersAccordion/TaxProvidersAccordion'

import { usePaymentProviders } from '../common/usePaymentProviders'

type ExternalAppsAccordionProps = {
  isEdition: boolean
  customer: AddCustomerDrawerFragment | null | undefined
}

const defaultProps: ExternalAppsAccordionProps = {
  isEdition: false,
  customer: null,
}

const ExternalAppsAccordion = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  render: function Render({ form, customer, isEdition }) {
    const { translate } = useInternationalization()

    const { getPaymentProvider } = usePaymentProviders()

    const accountingProviderCode = useStore(
      form.store,
      (state) => state.values.accountingProviderCode,
    )
    const taxProviderCode = useStore(form.store, (state) => state.values.taxProviderCode)
    const crmProviderCode = useStore(form.store, (state) => state.values.crmProviderCode)
    const paymentProviderCode = useStore(form.store, (state) => state.values.paymentProviderCode)
    const paymentProviderCustomer = useStore(
      form.store,
      (state) => state.values.paymentProviderCustomer,
    )

    const paymentProvider = getPaymentProvider(paymentProviderCode)

    const [showPaymentSection, setShowPaymentSection] = useState(!!paymentProviderCode)
    const [showAccountingSection, setShowAccountingSection] = useState(!!accountingProviderCode)
    const [showTaxSection, setShowTaxSection] = useState(!!taxProviderCode)
    const [showCrmSection, setShowCrmSection] = useState(!!crmProviderCode)

    useEffect(() => {
      setShowPaymentSection(!!paymentProviderCode)
    }, [paymentProviderCode])

    useEffect(() => setShowAccountingSection(!!accountingProviderCode), [accountingProviderCode])
    useEffect(() => setShowTaxSection(!!taxProviderCode), [taxProviderCode])
    useEffect(() => setShowCrmSection(!!crmProviderCode), [crmProviderCode])

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
              form={form}
              setShowPaymentSection={setShowPaymentSection}
              isEdition={isEdition}
              customer={customer}
            />
          )}

          {showAccountingSection && (
            <AccountingProvidersAccordion
              form={form}
              setShowAccountingSection={setShowAccountingSection}
              isEdition={isEdition}
              customer={customer}
            />
          )}

          {showTaxSection && (
            <TaxProvidersAccordion
              form={form}
              setShowTaxSection={setShowTaxSection}
              isEdition={isEdition}
              customer={customer}
            />
          )}

          {showCrmSection && (
            <CrmProvidersAccordion
              form={form}
              setShowCrmSection={setShowCrmSection}
              isEdition={isEdition}
              customer={customer}
            />
          )}

          <AddConnectionMenu
            disabled={
              showAccountingSection && showPaymentSection && showTaxSection && showCrmSection
            }
            disabledCategories={[
              ...(showPaymentSection ? [ConnectionCategory.Payment] : []),
              ...(showAccountingSection ? [ConnectionCategory.Accounting] : []),
              ...(showTaxSection ? [ConnectionCategory.Tax] : []),
              ...(showCrmSection ? [ConnectionCategory.Crm] : []),
            ]}
            onSelect={(category, { closePopper }) => {
              const sectionByCategory: Record<
                ConnectionCategory,
                { show: () => void; accordionClassName: string }
              > = {
                [ConnectionCategory.Payment]: {
                  show: () => setShowPaymentSection(true),
                  accordionClassName: ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION,
                },
                [ConnectionCategory.Accounting]: {
                  show: () => setShowAccountingSection(true),
                  accordionClassName: ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION,
                },
                [ConnectionCategory.Tax]: {
                  show: () => setShowTaxSection(true),
                  accordionClassName: ADD_CUSTOMER_TAX_PROVIDER_ACCORDION,
                },
                [ConnectionCategory.Crm]: {
                  show: () => setShowCrmSection(true),
                  accordionClassName: ADD_CUSTOMER_CRM_PROVIDER_ACCORDION,
                },
              }

              const section = sectionByCategory[category]

              section.show()

              scrollToAndClickElement({
                selector: `.${section.accordionClassName} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                callback: closePopper,
              })
            }}
          />

          {!!paymentProviderCustomer &&
            !!paymentProviderCustomer.syncWithProvider &&
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
