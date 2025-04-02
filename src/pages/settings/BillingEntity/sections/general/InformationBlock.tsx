import { generatePath, useNavigate } from 'react-router-dom'

import { Avatar, Button, Typography } from '~/components/designSystem'
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
  value?: string | null
  fieldKey: string
  emptyPlaceholder?: string
}

const InformationBlock = ({ billingEntity }: { billingEntity: BillingEntity }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()

  const {
    logoUrl,
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
  } = billingEntity

  const loading = false

  const fields: SettingsField[] = [
    { label: translate('text_17430772961896bgqutmnx7g'), value: name, fieldKey: 'name' },
    {
      label: translate('text_62ab2d0396dd6b0361614d6c'),
      value: legalName,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614d64'),
      fieldKey: 'legalName',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d7c'),
      value: legalNumber,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614d74'),
      fieldKey: 'legalNumber',
    },
    {
      label: translate('text_648053ee819b60364c675cf1'),
      value: taxIdentificationNumber,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614d74'),
      fieldKey: 'taxIdentificationNumber',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d8c'),
      value: email,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614d84'),
      fieldKey: 'email',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614d9c'),
      value: addressLine1,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614d94'),
      fieldKey: 'addressLine1',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dac'),
      value: addressLine2,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614da4'),
      fieldKey: 'addressLine2',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dc8'),
      value: zipcode,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614dc0'),
      fieldKey: 'zipcode',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614dd6'),
      value: city,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614dd0'),
      fieldKey: 'city',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614db6'),
      value: state,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614db0'),
      fieldKey: 'state',
    },
    {
      label: translate('text_62ab2d0396dd6b0361614de3'),
      value: country ? CountryCodes[country] : null,
      emptyPlaceholder: translate('text_62ab2d0396dd6b0361614ddd'),
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
                <Button variant="quaternary" onClick={onEdit}>
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
              <Typography
                className="flex h-7 basis-35 items-center text-sm text-grey-600"
                variant="caption"
              >
                {field.label}
              </Typography>

              <Typography
                className="flex h-7 items-center text-grey-700"
                variant="body"
                color={field.label ? 'grey700' : 'grey500'}
              >
                {field.value || field.emptyPlaceholder || ''}
              </Typography>
            </div>
          ))}
        </div>
      </SettingsListItem>
    </SettingsListWrapper>
  )
}

export default InformationBlock
