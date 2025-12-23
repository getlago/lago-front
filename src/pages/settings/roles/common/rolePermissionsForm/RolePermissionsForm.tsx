import { useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem'
import {
  ColumnConfig,
  ColumnHelpers,
  RowConfig,
  TableWithGroups,
} from '~/components/designSystem/Table/TableWithGroups'
import { Checkbox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

import { rolePermissionsEmptyValues } from './const'

import { allPermissions } from '../permissionsConst'
import { PermissionItem, PermissionName } from '../permissionsTypes'
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

    const getOverallCheckboxValue = (): boolean | undefined => {
      const values = Object.values(permissionsValues)
      const allTrue = values.every((value) => value === true)
      const allFalse = values.every((value) => value === false)

      if (allTrue) {
        return true
      }

      if (allFalse) {
        return false
      }

      return undefined
    }

    const overallCheckboxValue = getOverallCheckboxValue()

    const handleOverallCheckboxChange = (_e: unknown, checked: boolean) => {
      const permissionsToUpdate = Object.keys(permissionsValues) as Array<PermissionName>

      permissionsToUpdate.forEach((permissionName) => {
        group.setFieldValue(permissionName, checked)
      })
    }

    const handleGroupCheckboxClick = (
      checked: boolean,
      groupPermissions: Array<PermissionItem>,
    ) => {
      const permissionsToUpdate = groupPermissions.map((permission) => permission.name)

      permissionsToUpdate.forEach((permissionName) => {
        group.setFieldValue(permissionName, checked)
      })
    }

    const getGroupCheckboxValue = (groupName: string): boolean | undefined => {
      const permissionGroup = permissionGrouping[groupName]

      if (!permissionGroup) return false

      const totalNumberOfPermissions = permissionGroup.permissions.length
      const numberOfEnabledPermissions = permissionGroup.permissions.filter(
        (permission) => permissionsValues[permission.name],
      ).length

      if (numberOfEnabledPermissions === 0) {
        return false
      } else if (numberOfEnabledPermissions === totalNumberOfPermissions) {
        return true
      }

      return undefined
    }

    const getRoleDetailsDataRows = (): Array<RowConfig> => {
      return Object.values(permissionGrouping).reduce<Array<RowConfig>>((acc, permissionGroup) => {
        acc.push({
          label: permissionGroup.displayName,
          key: permissionGroup.name,
          type: 'group',
        })

        permissionGroup.permissions.forEach((permission) => {
          acc.push({
            label: permission.description,
            key: permission.name,
            type: 'line',
            groupKey: permissionGroup.name,
          })
        })

        return acc
      }, [])
    }

    const rows = getRoleDetailsDataRows()

    const getCheckboxColumn = (): Array<ColumnConfig> => {
      if (!isEditable) {
        return []
      }

      return [
        {
          key: 'checkbox',
          label: (
            <Checkbox
              label={null}
              value={overallCheckboxValue}
              canBeIndeterminate
              onChange={handleOverallCheckboxChange}
            />
          ),
          minWidth: 50,
          content: (row) => {
            if (row.type === 'group') {
              const checkboxValue = getGroupCheckboxValue(row.key)

              return (
                <Checkbox
                  value={checkboxValue}
                  canBeIndeterminate
                  disabled={!isEditable}
                  onChange={(_e, checked) =>
                    handleGroupCheckboxClick(checked, permissionGrouping[row.key].permissions)
                  }
                  label={null}
                />
              )
            }

            return (
              <group.AppField name={row.key as PermissionName}>
                {(field) => <field.CheckboxField label={null} disabled={!isEditable} />}
              </group.AppField>
            )
          },
        },
      ]
    }

    const createIcon = (permissionName: PermissionName) => {
      const isChecked = permissionsValues[permissionName]

      if (isChecked) {
        return <Icon name="validate-filled" size="medium" color="success" />
      }

      return <Icon name="close-circle-filled" size="medium" color="input" />
    }

    const LabelColumnContent = (row: RowConfig, { ChevronIcon }: ColumnHelpers): ReactNode => {
      const isGroup = row.type === 'group'

      return (
        <div className="flex flex-row items-center gap-2">
          {ChevronIcon}
          {typeof row.label !== 'string' && row.label}
          {typeof row.label === 'string' && isGroup && (
            <Typography variant="bodyHl" color="grey700" noWrap>
              {row.label}
            </Typography>
          )}
          {typeof row.label === 'string' && !isGroup && (
            <div className="flex flex-row items-center gap-2 pl-8">
              {!isEditable && createIcon(row.key as PermissionName)}
              <Typography variant="body" color="grey600" noWrap>
                {row.label}
              </Typography>
            </div>
          )}
        </div>
      )
    }

    const columns: Array<ColumnConfig> = [
      ...getCheckboxColumn(),
      {
        key: 'label',
        label: translate('text_1766047828726zeybs9mgzhl'),
        minWidth: 230,
        content: LabelColumnContent,
        isFullWidth: true,
      },
      {
        key: 'permissions',
        label: translate('text_1766047828725ykfgqmtfczr'),
        align: 'right',
        minWidth: 120,
        content: (row) => {
          if (row.type === 'group') {
            const permissionGroup = permissionGrouping[row.key]
            const totalNumberOfPermissions = permissionGroup.permissions.length
            const numberOfEnabledPermissions = permissionGroup.permissions.filter(
              (permission) => permissionsValues[permission.name],
            ).length

            return (
              <Typography color="grey500">
                {numberOfEnabledPermissions} / {totalNumberOfPermissions}
              </Typography>
            )
          }

          return null
        },
      },
    ]

    return <TableWithGroups rows={rows} columns={columns} isLoading={isLoading} />
  },
})

export default RolePermissionsForm
