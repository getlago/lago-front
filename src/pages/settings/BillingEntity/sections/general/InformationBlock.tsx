import { Avatar } from 'lago-design-system'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
} from '~/components/layouts/Settings'
import { CountryCodes } from '~/core/constants/countryCodes'
import { BILLING_ENTITY_UPDATE_ROUTE } from '~/core/router'
import { BillingEntity } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

type LogoProps = {
  name: string
  logoUrl?: string | null
}

const Logo = ({ name, logoUrl }: LogoProps) => {
  if (logoUrl) {
    return (
      <Avatar className="col-span-2 mb-1" size="big" variant="connector">
        <img src={logoUrl} alt={`${name}'s logo`} />
      </Avatar>
    )
  }

  return (
    <Avatar
      className="col-span-2 mb-1"
      size="big"
      variant="company"
      identifier={name || ''}
      initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
    />
  )
}

type SettingsField = {
  label: string
  value?: string | boolean | null
  fieldKey: string
  emptyPlaceholder?: string
  labelTrue?: string
  labelFalse?: string
}

const InformationBlock = ({ billingEntity }: { billingEntity: BillingEntity }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()

  const {
    logoUrl,
    code,
    name,
    legalName,
    legalNumber,
    taxIdentificationNumber,
    email,
    addressLine1,
    addressLine2,
    zipcode,
    city,
    state,
    country,
    isDefault,
  } = billingEntity

  const loading = false

  const emptyPlaceholder = translate('text_1744030459568c0h1b5p25u6')

  const fields: SettingsField[] = [
    {
      label: translate('text_17440321235444hcxi31f8j6'),
      value: isDefault,
      fieldKey: 'isDefault',
      labelTrue: translate('text_17440181167432q7jzt9znuh'),
      labelFalse: translate('text_1744018116743ntlygtcnq95'),
    },
    {
      label: translate('text_17430772961896bgqutmnx7g'),
      value: name,
      fieldKey: 'name',
      emptyPlaceholder,
    },
    {
      label: translate('text_1744018116743dttk8bbrqan'),
      value: code,
      fieldKey: 'code',
      emptyPlaceholder,
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d6c'),
      value: legalName,
      emptyPlaceholder,
      fieldKey: 'legalName',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d7c'),
      value: legalNumber,
      emptyPlaceholder,
      fieldKey: 'legalNumber',
    },
    {
      label: translate('text_648053ee819b60364c675cf1'),
      value: taxIdentificationNumber,
      emptyPlaceholder,
      fieldKey: 'taxIdentificationNumber',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d8c'),
      value: email,
      emptyPlaceholder,
      fieldKey: 'email',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d9c'),
      value: addressLine1,
      emptyPlaceholder,
      fieldKey: 'addressLine1',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dac'),
      value: addressLine2,
      emptyPlaceholder,
      fieldKey: 'addressLine2',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dc8'),
      value: zipcode,
      emptyPlaceholder,
      fieldKey: 'zipcode',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dd6'),
      value: city,
      emptyPlaceholder,
      fieldKey: 'city',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614db6'),
      value: state,
      emptyPlaceholder,
      fieldKey: 'state',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614de3'),
      value: country ? CountryCodes[country] : null,
      emptyPlaceholder,
      fieldKey: 'country',
    },
  ]

  const onEdit = () => {
    navigate(
      generatePath(BILLING_ENTITY_UPDATE_ROUTE, {
        billingEntityCode: billingEntity.code,
      }),
    )
  }

  if (!!loading) {
    return <SettingsListItemLoadingSkeleton count={2} />
  }

  return (
    <SettingsListWrapper>
      <SettingsListItem>
        <SettingsListItemHeader
          label={translate('text_62ab2d0396dd6b0361614d44')}
          sublabel={translate('text_17279603619058io9kicfxan')}
          action={
            <>
              {hasPermissions(['organizationUpdate']) && (
                <Button variant="inline" onClick={onEdit}>
                  {translate('text_6389099378112a8d8e2b73be')}
                </Button>
              )}
            </>
          }
        />

        <div className="flex flex-col gap-3">
          <Logo logoUrl={logoUrl} name={name} />

          {fields.map((field) => (
            <div
              className="flex items-center gap-3"
              key={`billing-entity-information-${field.fieldKey}`}
            >
              <Typography className="flex h-7 basis-35 items-center" variant="body" color="grey600">
                {field.label}
              </Typography>

              <Typography
                className="flex h-7 items-center"
                variant="body"
                color={!!field.labelTrue || field.value ? 'grey700' : 'grey500'}
              >
                {!!field.labelTrue && field.value === true ? field.labelTrue : field.labelFalse}

                {!field.labelTrue && (field.value || field.emptyPlaceholder || '')}
              </Typography>
            </div>
          ))}
        </div>
      </SettingsListItem>
    </SettingsListWrapper>
  )
}

export default InformationBlock
