import { FormikProps } from 'formik'
import { FC } from 'react'

import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Typography } from '~/components/designSystem'
import { ComboBoxField, TextInputField } from '~/components/form'
import { ORGANIZATION_INFORMATIONS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  AddCustomerDrawerFragment,
  CreateCustomerInput,
  CustomerTypeEnum,
  TimezoneEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

interface CustomerInformationProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  isEdition?: boolean
  customer?: AddCustomerDrawerFragment | null
}

export const CustomerInformation: FC<CustomerInformationProps> = ({
  formikProps,
  isEdition,
  customer,
}) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { timezoneConfig } = useOrganizationInfos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography variant="subhead">{translate('text_6419c64eace749372fc72b07')}</Typography>
        <Typography variant="caption">{translate('text_1735652987833k0i3l9ill5g')}</Typography>
      </div>

      <TextInputField
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={!isEdition}
        name="externalId"
        disabled={isEdition && !customer?.canEditAttributes}
        label={translate('text_624efab67eb2570101d117ce')}
        placeholder={translate('text_624efab67eb2570101d117d6')}
        formikProps={formikProps}
      />
      <ComboBoxField
        name="customerType"
        label={translate('text_1726128938631ioz4orixel3')}
        placeholder={translate('text_17261289386318j0nhr1ms3t')}
        formikProps={formikProps}
        PopperProps={{ displayInDialog: true }}
        data={Object.values(CustomerTypeEnum).map((customerValue) => ({
          value: customerValue,
          label: translate(TRANSLATIONS_MAP_CUSTOMER_TYPE[customerValue]),
        }))}
      />
      <TextInputField
        name="name"
        label={translate('text_624efab67eb2570101d117be')}
        placeholder={translate('text_624efab67eb2570101d117c6')}
        formikProps={formikProps}
      />
      <div className="flex gap-6">
        <TextInputField
          className="flex-1"
          name="firstname"
          label={translate('text_1726128938631ggtf2ggqs4b')}
          placeholder={translate('text_1726128938631ntcpbzv7x7s')}
          formikProps={formikProps}
        />

        <TextInputField
          className="flex-1"
          name="lastname"
          label={translate('text_1726128938631ymctg83bygm')}
          placeholder={translate('text_1726128938631xmpsba9ssuo')}
          formikProps={formikProps}
        />
      </div>
      <ComboBoxField
        name="timezone"
        label={translate('text_6390a4ffef9227ba45daca90')}
        placeholder={translate('text_6390a4ffef9227ba45daca92')}
        disabled={!isPremium}
        helperText={
          <Typography
            variant="caption"
            html={translate('text_6390a4ffef9227ba45daca94', {
              timezone: translate('text_638f743fa9a2a9545ee6409a', {
                zone: timezoneConfig.name,
                offset: timezoneConfig.offset,
              }),
              link: ORGANIZATION_INFORMATIONS_ROUTE,
            })}
          />
        }
        formikProps={formikProps}
        PopperProps={{ displayInDialog: true }}
        data={Object.values(TimezoneEnum).map((timezoneValue) => ({
          value: timezoneValue,
          label: translate('text_638f743fa9a2a9545ee6409a', {
            zone: translate(timezoneValue),
            offset: getTimezoneConfig(timezoneValue).offset,
          }),
        }))}
      />
      <TextInputField
        name="externalSalesforceId"
        label={translate('text_651fd3f644384c00999fbd81')}
        placeholder={translate('text_651fd408a57493006d00504e')}
        helperText={translate('text_651fd41846f44c0064408b07')}
        formikProps={formikProps}
      />
    </div>
  )
}
