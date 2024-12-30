import { Grid } from '@mui/material'
import { FormikProps } from 'formik'
import { FC } from 'react'

import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Card, Typography } from '~/components/designSystem'
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
    <Card className="items-stretch">
      <Typography variant="subhead">{translate('text_626c0c09812bbc00e4c59df1')}</Typography>
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
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={!isEdition}
        name="name"
        label={translate('text_624efab67eb2570101d117be')}
        placeholder={translate('text_624efab67eb2570101d117c6')}
        formikProps={formikProps}
      />
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <TextInputField
            name="firstname"
            label={translate('text_1726128938631ggtf2ggqs4b')}
            placeholder={translate('text_1726128938631ntcpbzv7x7s')}
            formikProps={formikProps}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextInputField
            name="lastname"
            label={translate('text_1726128938631ymctg83bygm')}
            placeholder={translate('text_1726128938631xmpsba9ssuo')}
            formikProps={formikProps}
          />
        </Grid>
      </Grid>
      <TextInputField
        name="externalId"
        disabled={isEdition && !customer?.canEditAttributes}
        label={translate('text_624efab67eb2570101d117ce')}
        placeholder={translate('text_624efab67eb2570101d117d6')}
        helperText={
          (!isEdition || customer?.canEditAttributes) && translate('text_624efab67eb2570101d117de')
        }
        formikProps={formikProps}
      />
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
    </Card>
  )
}
