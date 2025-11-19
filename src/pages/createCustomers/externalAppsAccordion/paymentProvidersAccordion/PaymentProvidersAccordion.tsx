import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { Avatar } from 'lago-design-system'
import { Dispatch, ReactNode, SetStateAction, useMemo } from 'react'

import { Accordion, Alert, Typography } from '~/components/designSystem'
import { ComboboxDataGrouped } from '~/components/form'
import { ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION } from '~/core/constants/form'
import {
  CurrencyEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'
import Adyen from '~/public/images/adyen.svg'
import Cashfree from '~/public/images/cashfree.svg'
import Flutterwave from '~/public/images/flutterwave.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Moneyhash from '~/public/images/moneyhash.svg'
import Stripe from '~/public/images/stripe.svg'

import { ExternalAppsAccordionLayout } from '../common/ExternalAppsAccordionLayout'

gql`
  query paymentProvidersListForCustomerCreateEditExternalAppsAccordion($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on CashfreeProvider {
          __typename
          id
          name
          code
        }

        ... on FlutterwaveProvider {
          __typename
          id
          name
          code
        }

        ... on StripeProvider {
          __typename
          id
          name
          code
        }

        ... on GocardlessProvider {
          __typename
          id
          name
          code
        }

        ... on AdyenProvider {
          __typename
          id
          name
          code
        }

        ... on MoneyhashProvider {
          __typename
          id
          name
          code
        }
      }
    }
  }
`

type PaymentProvidersAccordionProps = {
  setShowPaymentSection: Dispatch<SetStateAction<boolean>>
}

const avatarMapping: Record<ProviderTypeEnum, ReactNode> = {
  [ProviderTypeEnum.Adyen]: <Adyen />,
  [ProviderTypeEnum.Cashfree]: <Cashfree />,
  [ProviderTypeEnum.Flutterwave]: <Flutterwave />,
  [ProviderTypeEnum.Gocardless]: <GoCardless />,
  [ProviderTypeEnum.Stripe]: <Stripe />,
  [ProviderTypeEnum.Moneyhash]: <Moneyhash />,
}

const defaultProps: PaymentProvidersAccordionProps = {
  setShowPaymentSection: () => {},
}

export const PaymentProvidersAccordion = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  render: function Render({ form, setShowPaymentSection }) {
    const { translate } = useInternationalization()
    const { data: { paymentProviders } = {}, loading } =
      usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery({
        variables: { limit: 1000 },
      })

    const paymentProviderCode = useStore(form.store, (state) => state.values.paymentProviderCode)
    const providerCustomer = useStore(form.store, (state) => state.values.providerCustomer)
    const paymentProvider = useStore(form.store, (state) => state.values.paymentProvider)
    const currency = useStore(form.store, (state) => state.values.currency)

    const selectedPaymentProvider = paymentProviders?.collection.find(
      (p) => p.code === paymentProviderCode,
    )

    const isSyncWithProviderDisabled = !!providerCustomer?.syncWithProvider

    const connectedPaymentProvidersData: ComboboxDataGrouped[] | [] = useMemo(() => {
      if (!paymentProviders?.collection.length) return []

      return paymentProviders?.collection.map((provider) => ({
        value: provider.code,
        label: provider.name,
        group: provider.__typename.toLocaleLowerCase().replace('provider', ''),
        labelNode: (
          <ExternalAppsAccordionLayout.ComboboxItem
            label={provider.name}
            subLabel={provider.code}
          />
        ),
      }))
    }, [paymentProviders?.collection])

    const isSyncWithProviderSupported = useMemo(() => {
      if (!paymentProvider) return false
      const unsupportedPaymentProviders: ProviderTypeEnum[] = [
        ProviderTypeEnum.Cashfree,
        ProviderTypeEnum.Flutterwave,
      ]

      return !unsupportedPaymentProviders.includes(paymentProvider)
    }, [paymentProvider])

    // const handleSetPaymentMethod = (method: ProviderPaymentMethodsEnum, checked: boolean) => {
    //   let newValue = [...(providerCustomer?.providerPaymentMethods || [])]

    //   if (checked) {
    //     newValue.push(method)
    //   } else {
    //     newValue = newValue.filter((value) => value !== method)
    //   }

    //   form.setFieldValue('providerCustomer.providerPaymentMethods', newValue)
    // }

    // const paymentMethods = providerCustomer?.providerPaymentMethods || []
    // const isPaymentMethodUnique = paymentMethods.length === 1
    // const isBankTransferEnabled = paymentMethods.includes(
    //   ProviderPaymentMethodsEnum.CustomerBalance,
    // )

    const handleDeletePaymentProvider = () => {
      form.setFieldValue('paymentProvider', null)
      form.setFieldValue('providerCustomer.providerCustomerId', '')
      form.setFieldValue('providerCustomer.syncWithProvider', false)
      form.setFieldValue(
        'providerCustomer.providerPaymentMethods',
        currency !== CurrencyEnum.Eur
          ? [ProviderPaymentMethodsEnum.Card]
          : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
      )
      setShowPaymentSection(false)
    }

    const getSyncWithProviderLabel = () => {
      const suffix = paymentProviderCode
        ? ` • ${
            connectedPaymentProvidersData.find((provider) => provider.value === paymentProviderCode)
              ?.label
          }`
        : ''

      if (paymentProvider === ProviderTypeEnum.Gocardless) {
        return `${translate('text_635bdbda84c98758f9bba8aa')}${suffix}`
      }
      if (paymentProvider === ProviderTypeEnum.Adyen) {
        return `${translate('text_645d0728ea0a5a7bbf76d5c7')}${suffix}`
      }
      if (paymentProvider === ProviderTypeEnum.Moneyhash) {
        return `${translate('text_1733992108437qlovqhjhqj4')}${suffix}`
      }
      return `${translate('text_635bdbda84c98758f9bba89e')}${suffix}`
    }

    return (
      <div>
        <Typography variant="captionHl" color="grey700" className="mb-1">
          {translate('text_634ea0ecc6147de10ddb6631')}
        </Typography>
        <Accordion
          noContentMargin
          className={ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION}
          summary={
            <ExternalAppsAccordionLayout.Summary
              loading={loading}
              avatar={
                paymentProvider && (
                  <Avatar size="big" variant="connector-full" className="bg-white">
                    {avatarMapping[paymentProvider]}
                  </Avatar>
                )
              }
              label={selectedPaymentProvider?.name}
              subLabel={selectedPaymentProvider?.code}
              onDelete={handleDeletePaymentProvider}
            />
          }
        >
          <div>
            <div className="flex flex-col gap-6 p-4">
              <Typography variant="bodyHl" color="grey700">
                {translate('text_65e1f90471bc198c0c934d6c')}
              </Typography>

              {/* Select connected account */}
              <form.AppField
                name="paymentProviderCode"
                listeners={{
                  onChange: ({ value }) => {
                    const selectedProvider = connectedPaymentProvidersData.find(
                      (provider) => provider.value === value,
                    )?.group

                    form.setFieldValue('paymentProvider', selectedProvider as ProviderTypeEnum)
                  },
                }}
              >
                {(field) => (
                  <field.ComboBoxField
                    data={connectedPaymentProvidersData}
                    label={translate('text_65940198687ce7b05cd62b61')}
                    placeholder={translate('text_65940198687ce7b05cd62b62')}
                    emptyText={translate('text_6645daa0468420011304aded')}
                    PopperProps={{ displayInDialog: true }}
                  />
                )}
              </form.AppField>

              {!!paymentProviderCode && isSyncWithProviderSupported && (
                <>
                  <form.AppField name="providerCustomer.providerCustomerId">
                    {(field) => (
                      <field.TextInputField
                        disabled={isSyncWithProviderDisabled}
                        label={translate('text_62b328ead9a4caef81cd9ca0')}
                        placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                      />
                    )}
                  </form.AppField>

                  <form.AppField
                    name="providerCustomer.syncWithProvider"
                    listeners={{
                      onChange: ({ value }) => {
                        if (!value) return

                        const newProviderCustomer = { ...providerCustomer }

                        newProviderCustomer.providerCustomerId = ''
                        newProviderCustomer.syncWithProvider = true
                        form.setFieldValue('providerCustomer', newProviderCustomer)
                      },
                    }}
                  >
                    {(field) => <field.CheckboxField label={getSyncWithProviderLabel()} />}
                  </form.AppField>
                </>
              )}
            </div>

            {paymentProvider === ProviderTypeEnum.Moneyhash && (
              <div className="border-t border-grey-400 p-4">
                <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
              </div>
            )}

            {paymentProvider === ProviderTypeEnum.Stripe && (
              <div className="flex flex-col gap-6 p-4 shadow-t">
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_64aeb7b998c4322918c84204')}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_64aeb7b998c4322918c84210')}
                  </Typography>
                </div>

                <div className="flex flex-col gap-1">
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_65e1f90471bc198c0c934d82')}
                  </Typography>
                  <div className="grid grid-cols-2 gap-4">
                    {/* <form.AppField
                      name="providerCustomer.providerPaymentMethods"
                      listeners={{
                        onChange: ({ value: checked }) => {
                          if (!checked) {
                            const filteredMethods = (
                              providerCustomer?.providerPaymentMethods || []
                            ).filter(
                              (method) =>
                                method !== ProviderPaymentMethodsEnum.Card &&
                                method !== ProviderPaymentMethodsEnum.Link,
                            )

                            form.setFieldValue(
                              'providerCustomer.providerPaymentMethods',
                              filteredMethods,
                            )
                          }
                        },
                      }}
                    >
                      {(field) => (
                        <field.CheckboxField
                          label={translate('text_64aeb7b998c4322918c84208')}
                          sublabel={translate('text_65e1f90471bc198c0c934d86')}
                          disabled={
                            isBankTransferEnabled ||
                            (paymentMethods.length === 1 &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Card)) ||
                            (paymentMethods.length === 2 &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Card) &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Link))
                          }
                        />
                      )}
                    </form.AppField>
                    <form.AppField
                      name="providerCustomer.providerPaymentMethods"
                      listeners={{
                        onChange: ({ value: checked }) => {
                          if (!checked) {
                            const filteredMethods = (
                              providerCustomer?.providerPaymentMethods || []
                            ).filter(
                              (method) =>
                                method !== ProviderPaymentMethodsEnum.Card &&
                                method !== ProviderPaymentMethodsEnum.Link,
                            )

                            form.setFieldValue(
                              'providerCustomer.providerPaymentMethods',
                              filteredMethods,
                            )
                          }
                        },
                      }}
                    >
                      {(field) => (
                        <field.CheckboxField
                          label={translate('text_64aeb7b998c4322918c84208')}
                          sublabel={translate('text_65e1f90471bc198c0c934d86')}
                          disabled={
                            isBankTransferEnabled ||
                            (paymentMethods.length === 1 &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Card)) ||
                            (paymentMethods.length === 2 &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Card) &&
                              paymentMethods.includes(ProviderPaymentMethodsEnum.Link))
                          }
                        />
                      )}
                    </form.AppField> */}
                    {/* <Checkbox
                      name="providerCustomer.providerPaymentMethods.card"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.Card)}
                      label={translate('text_64aeb7b998c4322918c84208')}
                      sublabel={translate('text_65e1f90471bc198c0c934d86')}
                      disabled={
                        isBankTransferEnabled ||
                        (paymentMethods.length === 1 &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.Card)) ||
                        (paymentMethods.length === 2 &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.Card) &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.Link))
                      }
                      onChange={(e, checked) => {
                        let newValue = [...(providerCustomer?.providerPaymentMethods || [])]

                        if (checked) {
                          newValue.push(ProviderPaymentMethodsEnum.Card)
                        } else {
                          // Note: Link option cannot be selected without card
                          newValue = newValue.filter(
                            (method) =>
                              method !== ProviderPaymentMethodsEnum.Card &&
                              method !== ProviderPaymentMethodsEnum.Link,
                          )
                        }

                        form.setFieldValue('providerCustomer.providerPaymentMethods', newValue)
                      }}
                    /> */}
                    {/* Link can be enabled only if Card is enabled */}
                    {/* <Checkbox
                      name="providerCustomer.providerPaymentMethods.link"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.Link)}
                      label={translate('text_6686b316b672a6e75a29eea0')}
                      sublabel={translate('text_6686b316b672a6e75a29eea2')}
                      disabled={
                        isBankTransferEnabled ||
                        !paymentMethods.includes(ProviderPaymentMethodsEnum.Card)
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.Link, checked)
                      }}
                    /> */}

                    {/* <Checkbox
                      name="providerCustomer.providerPaymentMethods.bank_transfers"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.CustomerBalance)}
                      label={translate('text_1739432510045wh80q1wdt4z')}
                      sublabel={translate('text_1739432510045brhda8fxidc')}
                      // disabled={paymentMethods.includes(ProviderPaymentMethodsEnum.CustomerBalance)}
                      onChange={(_e, checked) => {
                        let newValue = [...(providerCustomer?.providerPaymentMethods || [])]

                        if (checked) {
                          newValue = [ProviderPaymentMethodsEnum.CustomerBalance]
                        } else {
                          newValue = newValue.filter(
                            (value) => value !== ProviderPaymentMethodsEnum.CustomerBalance,
                          )
                        }

                        form.setFieldValue('providerCustomer.providerPaymentMethods', newValue)
                      }}
                    /> */}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_65e1f90471bc198c0c934d88')}
                  </Typography>

                  <div className="grid grid-cols-2 gap-4">
                    {/* <Checkbox
                      name="providerCustomer.providerPaymentMethods.sepa_debit"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.SepaDebit)}
                      label={translate('text_64aeb7b998c4322918c8420c')}
                      sublabel={translate('text_65e1f90471bc198c0c934d8c')}
                      disabled={
                        isBankTransferEnabled ||
                        (isPaymentMethodUnique &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.SepaDebit))
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.SepaDebit, checked)
                      }}
                    />

                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.us_bank_account"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.UsBankAccount)}
                      label={translate('text_65e1f90471bc198c0c934d8e')}
                      sublabel={translate('text_65e1f90471bc198c0c934d90')}
                      disabled={
                        isBankTransferEnabled ||
                        (isPaymentMethodUnique &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.UsBankAccount))
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.UsBankAccount, checked)
                      }}
                    />

                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.bacs_debit"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.BacsDebit)}
                      label={translate('text_65e1f90471bc198c0c934d92')}
                      sublabel={translate('text_65e1f90471bc198c0c934d94')}
                      disabled={
                        isBankTransferEnabled ||
                        (isPaymentMethodUnique &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.BacsDebit))
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.BacsDebit, checked)
                      }}
                    />

                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.boleto"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.Boleto)}
                      label={translate('text_1738234109827diqh4eswleu')}
                      sublabel={translate('text_1738234109827hev75h17loy')}
                      disabled={
                        isBankTransferEnabled ||
                        (isPaymentMethodUnique &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.Boleto))
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.Boleto, checked)
                      }}
                    />

                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.crypto"
                      value={!!paymentMethods.includes(ProviderPaymentMethodsEnum.Crypto)}
                      label={translate('text_17394287699017cunbdlhnhf')}
                      sublabel={translate('text_65e1f90471bc198c0c934d90')}
                      disabled={
                        isBankTransferEnabled ||
                        (isPaymentMethodUnique &&
                          paymentMethods.includes(ProviderPaymentMethodsEnum.Crypto))
                      }
                      onChange={(_e, checked) => {
                        handleSetPaymentMethod(ProviderPaymentMethodsEnum.Crypto, checked)
                      }}
                    /> */}
                  </div>
                </div>

                <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
              </div>
            )}
          </div>
        </Accordion>
      </div>
    )
  },
})
