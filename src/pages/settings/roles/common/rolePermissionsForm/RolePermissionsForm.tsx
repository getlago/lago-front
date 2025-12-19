import { useStore } from '@tanstack/react-form'

import { Align, Typography } from '~/components/designSystem'
import { RowConfig, TableWithGroups } from '~/components/designSystem/Table/TableWithGroups'
import { Checkbox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

import { rolePermissionsEmptyValues } from './const'

import { allPermissions } from '../permissionsConst'
import { PermissionGroupingItem, PermissionItem } from '../permissionsTypes'
import { useGetPermissionGrouping } from '../useGetPermissionGrouping'

type RolePermissionsFormProps = {
  isEditable?: boolean
  isLoading?: boolean
}

const defaultProps: RolePermissionsFormProps = {
  isEditable: true,
  isLoading: false,
}

const RolePermissionsForm = withFieldGroup({
  defaultValues: rolePermissionsEmptyValues,
  props: defaultProps,
  render: function Render({ group, isEditable, isLoading }) {
    const { translate } = useInternationalization()

    const { permissionGrouping } = useGetPermissionGrouping(allPermissions)

    const permissionsValues = useStore(group.store, (state) => state.values)

    const handleGroupCheckboxClick = (
      checked: boolean,
      groupPermissions: Array<PermissionItem>,
    ) => {
      const permissionsToUpdate = groupPermissions.map((permission) => permission.name)

      permissionsToUpdate.forEach((permissionName) => {
        group.setFieldValue(permissionName, checked)
      })
    }

    const getRoleDetailsDataRows = (): Array<RowConfig<PermissionGroupingItem>> => {
      return Object.values(permissionGrouping).reduce<Array<RowConfig<PermissionGroupingItem>>>(
        (acc, permissionGroup) => {
          acc.push({
            label: permissionGroup.displayName,
            key: permissionGroup.name,
            type: 'group',
            content: (_item, column) => {
              if (column.key === 'description') {
                const numberOfEnabledReadPermissions = permissionGroup.permissions.filter(
                  (permission) => permissionsValues[permission.name] && permission.isReadPermission,
                ).length

                const numberOfEnabledWritePermissions = permissionGroup.permissions.filter(
                  (permission) =>
                    permissionsValues[permission.name] && !permission.isReadPermission,
                ).length

                if (numberOfEnabledReadPermissions === 0 && numberOfEnabledWritePermissions === 0) {
                  return (
                    <Typography color="grey500">
                      {translate('text_1766153788882ynf8snr3mjq')}
                    </Typography>
                  )
                }

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

              const totalNumberOfPermissions = permissionGroup.permissions.length
              const numberOfEnabledPermissions = permissionGroup.permissions.filter(
                (permission) => permissionsValues[permission.name],
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
                  <Checkbox
                    value={checkboxValue}
                    canBeIndeterminate
                    disabled={!isEditable}
                    onChange={(_e, checked) =>
                      handleGroupCheckboxClick(checked, permissionGroup.permissions)
                    }
                    label={null}
                  />
                </div>
              )
            },
          })

          permissionGroup.permissions.forEach((permission) => {
            acc.push({
              label: permission.displayName,
              key: permission.name,
              type: 'line',
              groupKey: permissionGroup.name,
              content: (_item, column) => {
                if (column.key === 'description') {
                  return <Typography color="grey700">{permission.description}</Typography>
                }

                return (
                  <group.AppField name={permission.name}>
                    {(field) => <field.CheckboxField label={null} disabled={!isEditable} />}
                  </group.AppField>
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

    return (
      <TableWithGroups
        rows={rows}
        columns={columns}
        data={Object.values(permissionGrouping)}
        isLoading={isLoading}
        firstColumnLabel={translate('text_1766047828726zeybs9mgzhl')}
      />
    )
  },
})

export default RolePermissionsForm
