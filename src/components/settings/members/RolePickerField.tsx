import { gql } from '@apollo/client'
import { Stack } from '@mui/material'

import { Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { ROLE_ACCESS_LEVEL_DOC_URL } from '~/core/constants/externalUrls'
import { getRoleTranslationKey } from '~/core/constants/form'
import { MembershipRole } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment InviteForRolePickerField on Invite {
    id
    role
  }
`

type RolePickerFieldProps = {
  title: string
  onChange: (value: MembershipRole) => void
  selectedValue?: MembershipRole
}

export const RolePickerField = ({ title, onChange, selectedValue }: RolePickerFieldProps) => {
  const { translate } = useInternationalization()

  return (
    <Stack gap={4}>
      <div>
        <Typography variant="bodyHl" color="grey700">
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={translate('text_664f03016a8d2500787bb4ac', { link: ROLE_ACCESS_LEVEL_DOC_URL })}
        />
      </div>

      <Radio
        name="role"
        value={MembershipRole.Admin}
        label={translate(getRoleTranslationKey[MembershipRole.Admin])}
        sublabel={translate('text_664f03016a8d2500787bb4ae')}
        onChange={(value) => onChange(value as MembershipRole)}
        checked={selectedValue === MembershipRole.Admin}
      />

      <Radio
        name="role"
        value={MembershipRole.Manager}
        label={translate(getRoleTranslationKey[MembershipRole.Manager])}
        sublabel={translate('text_664f03016a8d2500787bb4b2')}
        onChange={(value) => onChange(value as MembershipRole)}
        checked={selectedValue === MembershipRole.Manager}
      />

      <Radio
        name="role"
        value={MembershipRole.Finance}
        label={translate(getRoleTranslationKey[MembershipRole.Finance])}
        sublabel={translate('text_664f03016a8d2500787bb4b0')}
        onChange={(value) => onChange(value as MembershipRole)}
        checked={selectedValue === MembershipRole.Finance}
      />
    </Stack>
  )
}
