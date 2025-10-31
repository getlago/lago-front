import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { NetsuiteIntegrationMapItemFormProps } from './types'

const NetsuiteIntegrationMapItemTaxContextForm = ({
  formikProps,
  billingEntityKey,
}: NetsuiteIntegrationMapItemFormProps) => {
  const { translate } = useInternationalization()

  return (
    <>
      <TextInputField
        name={`${billingEntityKey}.taxNexus`}
        autoComplete="off"
        label={translate('text_172727145621913rzc8t0twl')}
        placeholder={translate('text_17272714562195xp5rofbulp')}
        formikProps={formikProps}
        error={undefined}
      />

      <TextInputField
        name={`${billingEntityKey}.taxType`}
        autoComplete="off"
        label={translate('text_1727271456219atwdpxysccc')}
        placeholder={translate('text_1727271456219tl2bt8qdevm')}
        formikProps={formikProps}
        error={undefined}
      />

      <TextInputField
        name={`${billingEntityKey}.taxCode`}
        autoComplete="off"
        label={translate('text_1727271456220dvb59po0x1g')}
        placeholder={translate('text_1727271456220u56zdq1mfrn')}
        formikProps={formikProps}
        error={undefined}
      />
    </>
  )
}

export default NetsuiteIntegrationMapItemTaxContextForm
