import { CheckboxGroup } from '~/components/form/GroupedCheckboxList'
import { isUsageGovernanceEnabled } from '~/core/utils/usageGovernance'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useGetPermissionGrouping } from './useGetPermissionGrouping'

import { allPermissions, usageGovernancePermissions } from '../common/permissionsConst'

export const useRolePermissionsGroups = (): { groups: CheckboxGroup[] } => {
  const { organization, hasFeatureFlag } = useOrganizationInfos()
  const isUsageGovernanceAvailable = isUsageGovernanceEnabled({ organization, hasFeatureFlag })

  const availablePermissions = allPermissions.filter(
    (permission) => isUsageGovernanceAvailable || !usageGovernancePermissions.includes(permission),
  )

  const { permissionGrouping } = useGetPermissionGrouping(availablePermissions)

  // permissionGrouping already has translated displayName and descriptions
  const groups: CheckboxGroup[] = Object.values(permissionGrouping).map((permGroup) => ({
    id: permGroup.name,
    label: permGroup.displayName,
    items: permGroup.permissions.map((permission) => ({
      id: permission.name,
      label: permission.description, // Already translated by useGetPermissionGrouping
    })),
  }))

  return { groups }
}
