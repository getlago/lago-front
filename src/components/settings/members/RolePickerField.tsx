import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { Icon } from 'lago-design-system'
import { useRef } from 'react'

import { Button, Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ROLE_ACCESS_LEVEL_DOC_URL } from '~/core/constants/externalUrls'
import { getRoleTranslationKey } from '~/core/constants/form'
import { MembershipRole } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

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
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
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

        {!isPremium && (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-grey-100 px-6 py-4">
            <Stack>
              <Stack direction="row" gap={2} alignItems="center">
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_665edfd17997c0006f09cdb2')}
                </Typography>
                <Icon name="sparkles" />
              </Stack>
              <Typography variant="caption" color="grey600">
                {translate('text_665edfd17997c0006f09cdb3')}
              </Typography>
            </Stack>
            <Button
              variant="tertiary"
              endIcon="sparkles"
              onClick={() => premiumWarningDialogRef.current?.openDialog()}
            >
              {translate('text_65ae73ebe3a66bec2b91d72d')}
            </Button>
          </div>
        )}

        <Radio
          name="role"
          disabled={!isPremium}
          value={MembershipRole.Manager}
          label={translate(getRoleTranslationKey[MembershipRole.Manager])}
          sublabel={translate('text_664f03016a8d2500787bb4b2')}
          onChange={(value) => onChange(value as MembershipRole)}
          checked={selectedValue === MembershipRole.Manager}
        />

        <Radio
          name="role"
          disabled={!isPremium}
          value={MembershipRole.Finance}
          label={translate(getRoleTranslationKey[MembershipRole.Finance])}
          sublabel={translate('text_664f03016a8d2500787bb4b0')}
          onChange={(value) => onChange(value as MembershipRole)}
          checked={selectedValue === MembershipRole.Finance}
        />
      </Stack>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}
