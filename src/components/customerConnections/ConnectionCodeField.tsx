import { clearExistingCodeError } from '~/core/form/existingCodeError'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import type { CustomerConnectionDrawerFormApi } from './CustomerConnectionDrawer'

export const CONNECTION_CODE_FIELD_TEST_ID = 'connection-code-field'

type ConnectionCodeFieldProps = {
  form: CustomerConnectionDrawerFormApi
}

// Never pre-filled from the selected provider: an empty code is submitted as
// null and `PaymentProviderCustomers/IntegrationCustomers::BaseCustomer#set_code`
// backfills it from the provider, so the value shown always comes from the DB.
export const ConnectionCodeField = ({ form }: ConnectionCodeFieldProps) => {
  const { translate } = useInternationalization()

  return (
    <form.AppField name="code" listeners={{ onChange: () => clearExistingCodeError(form) }}>
      {(field) => (
        <field.TextInputField
          data-test={CONNECTION_CODE_FIELD_TEST_ID}
          label={translate('text_629728388c4d2300e2d380b7')}
          placeholder={translate('text_1788433814031zeagk490c7a')}
          beforeChangeFormatter="code"
        />
      )}
    </form.AppField>
  )
}
