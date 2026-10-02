import { useStore } from '@tanstack/react-form'

import { Button } from '~/components/designSystem/Button'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { netsuiteAdditionalMappingDefaultValues } from './validationSchema'

export const ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID = 'add-netsuite-currency-mapping'

export const netsuiteCurrencyMappingRowTestId = (index: number): string =>
  `netsuite-currency-mapping-row-${index}`

export const netsuiteCurrencyCodeTestId = (index: number): string =>
  `netsuite-currency-code-${index}`

export const removeNetsuiteCurrencyMappingTestId = (index: number): string =>
  `remove-netsuite-currency-mapping-${index}`

const MAXIMUM_NUMBER_OF_MAPPINGS = Object.keys(CurrencyEnum).length

const NetsuiteAdditionalMappingForm = withForm({
  defaultValues: netsuiteAdditionalMappingDefaultValues,
  render: function NetsuiteAdditionalMappingFormRender({ form }) {
    const { translate } = useInternationalization()

    const mappings = useStore(form.store, (state) => state.values.default)
    const alreadyExistingCurrencies = new Set(mappings.map((mapping) => mapping.currencyCode))
    const possibleCurrencies = Object.values(CurrencyEnum).map((currency) => ({
      label: currency,
      value: currency,
      disabled: alreadyExistingCurrencies.has(currency),
    }))

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name="default" mode="array">
          {(field) => (
            <div className="flex flex-col gap-4">
              {field.state.value.map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[120px_1fr_40px] gap-4"
                  data-test={netsuiteCurrencyMappingRowTestId(index)}
                >
                  <form.AppField name={`default[${index}].currencyCode`}>
                    {(currencyCodeField) => (
                      <currencyCodeField.ComboBoxField
                        data={possibleCurrencies}
                        placeholder={translate('text_64352657267c3d916f96275d')}
                        displayErrorText={false}
                        dataTest={netsuiteCurrencyCodeTestId(index)}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`default[${index}].currencyExternalCode`}>
                    {(currencyExternalCodeField) => (
                      <currencyExternalCodeField.TextInputField
                        autoComplete="off"
                        placeholder={translate('text_1762497490412zk5srhy8fqp')}
                        displayErrorText={false}
                      />
                    )}
                  </form.AppField>
                  <Button
                    icon="trash"
                    variant="quaternary"
                    size="large"
                    onClick={() => form.removeFieldValue('default', index)}
                    data-test={removeNetsuiteCurrencyMappingTestId(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </form.AppField>
        <Button
          startIcon="plus"
          disabled={mappings.length >= MAXIMUM_NUMBER_OF_MAPPINGS}
          onClick={() =>
            form.pushFieldValue('default', { currencyCode: undefined, currencyExternalCode: '' })
          }
          variant="inline"
          align="left"
          data-test={ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID}
        >
          {translate('text_1762447693332s34s28y76vs')}
        </Button>
      </div>
    )
  },
})

export default NetsuiteAdditionalMappingForm
