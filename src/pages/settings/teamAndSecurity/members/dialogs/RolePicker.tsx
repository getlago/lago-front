import Stack from '@mui/material/Stack'
import { Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useRoleDisplayInformation } from '~/hooks/useRoleDisplayInformation'
import { useRolesList } from '~/hooks/useRolesList'

import { UpdateInviteSingleRole } from '../common/inviteTypes'

const defaultValues: UpdateInviteSingleRole = {
  role: '',
}

const RolePicker = withFieldGroup({
  defaultValues,
  render: function Render({ group }) {
    const { isPremium } = useCurrentUser()
    const { translate } = useInternationalization()
    const { roles, isLoadingRoles } = useRolesList()

    const { getDisplayName, getDisplayDescription } = useRoleDisplayInformation()

    const rolesDataForCombobox = useMemo<BasicComboBoxData[]>(() => {
      if (isLoadingRoles || !roles.length) {
        return []
      }

      return roles.map((role) => ({
        value: role.code,
        label: getDisplayName(role),
        description: getDisplayDescription(role),
        disabled: role.name !== 'Admin' && !isPremium,
      }))
    }, [roles, isLoadingRoles, getDisplayName, getDisplayDescription, isPremium])

    const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

    const openPremiumDialog = () => premiumWarningDialogRef.current?.openDialog()

    return (
      <>
        <div className="flex flex-col gap-4">
          <group.AppField name="role">
            {(field) => (
              <field.ComboBoxField
                label={translate('text_664f035a68227f00e261b7ec')}
                data={rolesDataForCombobox}
                placeholder={translate('text_1767193385926vevp8z0azr2')}
                PopperProps={{ displayInDialog: true }}
                sortValues={false}
              />
            )}
          </group.AppField>
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
              <Button variant="tertiary" endIcon="sparkles" onClick={openPremiumDialog}>
                {translate('text_65ae73ebe3a66bec2b91d72d')}
              </Button>
            </div>
          )}
        </div>
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </>
    )
  },
})

export default RolePicker
