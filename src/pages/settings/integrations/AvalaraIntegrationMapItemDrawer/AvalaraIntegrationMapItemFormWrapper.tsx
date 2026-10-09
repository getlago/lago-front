import { Typography } from '~/components/designSystem/Typography'
import { AVALARA_TAX_CODE_DOCUMENTATION_URL } from '~/core/constants/externalUrls'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { avalaraMappingDefaultValues } from './validationSchema'

export const AvalaraIntegrationMapItemFormWrapper = withForm({
  defaultValues: avalaraMappingDefaultValues,
  props: {
    billingEntityKey: '',
  },
  render: function AvalaraIntegrationMapItemFormWrapperRender({ form, billingEntityKey }) {
    const { translate } = useInternationalization()

    return (
      <div className="mb-8 flex flex-col gap-6">
        <form.AppField name={`${billingEntityKey}.externalName`}>
          {(field) => (
            <field.TextInputField
              label={translate('text_1745416010613eidnh95dbs2')}
              placeholder={translate('text_17454159844152n3rimhvk4b')}
            />
          )}
        </form.AppField>

        <div className="flex flex-col gap-1">
          <form.AppField name={`${billingEntityKey}.externalId`}>
            {(field) => (
              <field.TextInputField
                label={translate('text_17454160106136tkffv4p4c3')}
                placeholder={translate('text_1745415984416mjvvaj4ahgp')}
              />
            )}
          </form.AppField>

          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_1748266296790rrag2rqt68c', {
              href: AVALARA_TAX_CODE_DOCUMENTATION_URL,
            })}
          />
        </div>
      </div>
    )
  },
})
