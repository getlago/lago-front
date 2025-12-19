import { Typography } from '~/components/designSystem'
import { SettingsListItemLoadingSkeleton } from '~/components/layouts/Settings'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { mapPermissionsFromRole } from '~/pages/settings/roles/common/rolePermissionsForm/mappers/mapPermissionsFromRole'
import RolePermissionsForm from '~/pages/settings/roles/common/rolePermissionsForm/RolePermissionsForm'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

export type RoleDetailsPermissionsProps = {
  isLoading: boolean
  role: RoleItem | undefined
}

const RoleDetailsPermissions = ({ isLoading, role }: RoleDetailsPermissionsProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: {
      permissions: mapPermissionsFromRole(role),
    },
  })

  if (isLoading) {
    return (
      <div className="pt-8">
        <SettingsListItemLoadingSkeleton />
      </div>
    )
  }

  return (
    <form className="pt-8">
      <div className="flex flex-col gap-2">
        <Typography variant="headline">{translate('text_1765809421198bliknx7z31x')}</Typography>
        <Typography color="grey600">{translate('text_17658096048119hpdp8kwcqd')}</Typography>
      </div>
      <div className="mt-6">
        <RolePermissionsForm
          form={form}
          fields="permissions"
          isEditable={false}
          isLoading={isLoading}
        />
      </div>
    </form>
  )
}

export default RoleDetailsPermissions
