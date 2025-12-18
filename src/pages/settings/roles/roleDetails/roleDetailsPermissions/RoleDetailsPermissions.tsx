import { useMemo } from 'react'

import { type RowConfig, TableWithGroups, Typography } from '~/components/designSystem'
import { Align } from '~/components/designSystem/Table'
import { Checkbox } from '~/components/form'
import { SettingsListItemLoadingSkeleton } from '~/components/layouts/Settings'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { PermissionGroupingItem } from '~/pages/settings/roles/common/permissionsTypes'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'
import { useGetPermissionGrouping } from '~/pages/settings/roles/common/useGetPermissionGrouping'

import { allPermissions } from '../mock/allPermissions'

export type RoleDetailsPermissionsProps = {
  isLoading: boolean
  role: RoleItem | undefined
}

const RoleDetailsPermissions = ({ isLoading, role }: RoleDetailsPermissionsProps) => {
  const { translate } = useInternationalization()

  const { permissionGrouping } = useGetPermissionGrouping(allPermissions)

  const rolesCheckboxState = useMemo(() => {
    if (!role) {
      return {}
    }
    return allPermissions.reduce<Record<string, boolean>>((acc, permissionName) => {
      acc[permissionName] = role.permissions.includes(permissionName) || role.admin

      return acc
    }, {})
  }, [role])

  const form = useAppForm({
    defaultValues: rolesCheckboxState,
  })

  const getRoleDetailsDataRows = (): Array<RowConfig<PermissionGroupingItem>> => {
    if (!role) {
      return []
    }
    return Object.values(permissionGrouping).reduce<Array<RowConfig<PermissionGroupingItem>>>(
      (acc, group) => {
        acc.push({
          label: group.displayName,
          key: group.name,
          type: 'group',
          content: (_item, column) => {
            if (column.key === 'description') {
              const numberOfEnabledReadPermissions = group.permissions.filter((permission) =>
                role.admin
                  ? permission.isReadPermission
                  : role.permissions.includes(permission.name) && permission.isReadPermission,
              ).length

              const numberOfEnabledWritePermissions = group.permissions.filter((permission) =>
                role.admin
                  ? !permission.isReadPermission
                  : role.permissions.includes(permission.name) && !permission.isReadPermission,
              ).length

              const readText = numberOfEnabledReadPermissions
                ? translate(
                    'text_1766047923247xra8qoblx2t',
                    {
                      number: numberOfEnabledReadPermissions,
                    },
                    numberOfEnabledReadPermissions,
                  )
                : ''

              const writeText = numberOfEnabledWritePermissions
                ? translate(
                    'text_17660479232474fvrxfn0xh3',
                    {
                      number: numberOfEnabledWritePermissions,
                    },
                    numberOfEnabledWritePermissions,
                  )
                : ''

              const descriptionText = [readText, writeText].filter(Boolean).join(' - ')

              return <Typography color="grey500">{descriptionText}</Typography>
            }

            const totalNumberOfPermissions = group.permissions.length
            const numberOfEnabledPermissions = group.permissions.filter((permission) =>
              role.admin ? true : role.permissions.includes(permission.name),
            ).length

            let checkboxValue: boolean | undefined = false

            if (numberOfEnabledPermissions === 0) {
              checkboxValue = false
            } else if (numberOfEnabledPermissions === totalNumberOfPermissions) {
              checkboxValue = true
            } else {
              checkboxValue = undefined
            }

            return (
              <div className="flex gap-2">
                <Typography color="grey500">
                  {numberOfEnabledPermissions} / {totalNumberOfPermissions}
                </Typography>
                <Checkbox value={checkboxValue} canBeIndeterminate disabled label={null} />
              </div>
            )
          },
        })

        group.permissions.forEach((permission) => {
          acc.push({
            label: permission.displayName,
            key: permission.name,
            type: 'line',
            groupKey: group.name,
            content: (_item, column) => {
              if (column.key === 'description') {
                return <Typography color="grey700">{permission.description}</Typography>
              }

              return (
                <form.AppField name={permission.name}>
                  {(field) => <field.CheckboxField label={null} disabled />}
                </form.AppField>
              )
            },
          })
        })

        return acc
      },
      [],
    )
  }

  const rows = getRoleDetailsDataRows()

  const columns = [
    { label: translate('text_6388b923e514213fed58331c'), key: 'description', isFullWidth: true },
    {
      label: translate('text_1766047828725ykfgqmtfczr'),
      key: 'permissions',
      align: 'right' as Align,
    },
  ]

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
        <TableWithGroups
          rows={rows}
          columns={columns}
          data={Object.values(permissionGrouping)}
          isLoading={isLoading}
          firstColumnLabel={translate('text_1766047828726zeybs9mgzhl')}
        />
      </div>
    </form>
  )
}

export default RoleDetailsPermissions
