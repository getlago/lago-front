import { useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { Alert, Button, Typography } from '~/components/designSystem'
import {
  ColumnConfig,
  ColumnHelpers,
  RowConfig,
  TableWithGroups,
  TableWithGroupsRef,
} from '~/components/designSystem/Table/TableWithGroups'
import { Checkbox, TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

import { rolePermissionsEmptyValues } from './const'

import { useGetPermissionGrouping } from '../../hooks/useGetPermissionGrouping'
import { allPermissions } from '../permissionsConst'
import { PermissionItem, PermissionName } from '../permissionsTypes'

type RolePermissionsFormProps = {
  isEditable?: boolean
  isLoading?: boolean
  errors?: Array<string>
}

const defaultProps: RolePermissionsFormProps = {
  isEditable: true,
  isLoading: false,
  errors: [],
}

const RolePermissionsForm = withFieldGroup({
  defaultValues: rolePermissionsEmptyValues,
  props: defaultProps,
  render: function Render({ group, isEditable, isLoading, errors }) {
    const { translate } = useInternationalization()

    const { permissionGrouping } = useGetPermissionGrouping(allPermissions)

    const permissionsValues = useStore(group.store, (state) => state.values)

    const tableRef = useRef<TableWithGroupsRef>(null)

    const [searchTerm, setSearchTerm] = useState('')

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
        // We use don't validate to avoid triggering validation on each checkbox change thus not freezing the whole page
        group.setFieldValue(permissionName, checked, { dontValidate: !errors?.length })
      })
    }

    const handleGroupCheckboxClick = (
      checked: boolean,
      groupPermissions: Array<PermissionItem>,
    ) => {
      const permissionsToUpdate = groupPermissions.map((permission) => permission.name)

      permissionsToUpdate.forEach((permissionName) => {
        // We use don't validate to avoid triggering validation on each checkbox change thus not freezing the whole page
        group.setFieldValue(permissionName, checked, { dontValidate: !errors?.length })
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

    const filteredRows = useMemo(() => {
      if (!searchTerm.trim()) return rows

      const searchLower = searchTerm.toLowerCase()
      const matchingGroups = new Set<string>()
      const matchingPermissions = new Set<string>()

      // Find all matches
      Object.entries(permissionGrouping).forEach(([groupKey, permGroup]) => {
        const groupMatches = permGroup.displayName.toLowerCase().includes(searchLower)

        if (groupMatches) {
          // Group name matches - include all its permissions
          matchingGroups.add(groupKey)
          permGroup.permissions.forEach((p) => matchingPermissions.add(p.name))
        } else {
          // Check individual permissions
          permGroup.permissions.forEach((permission) => {
            if (permission.description.toLowerCase().includes(searchLower)) {
              matchingPermissions.add(permission.name)
              matchingGroups.add(groupKey) // Include parent group
            }
          })
        }
      })

      return rows.filter((row) => {
        if (row.type === 'group') return matchingGroups.has(row.key)
        if (row.type === 'line') return matchingPermissions.has(row.key)
        return true
      })
    }, [rows, searchTerm, permissionGrouping])

    // Auto-expand groups containing matches when searching
    useEffect(() => {
      if (!searchTerm.trim()) return

      const searchLower = searchTerm.toLowerCase()

      Object.entries(permissionGrouping).forEach(([groupKey, permGroup]) => {
        const groupMatches = permGroup.displayName.toLowerCase().includes(searchLower)
        const hasMatchingPermission = permGroup.permissions.some((p) =>
          p.description.toLowerCase().includes(searchLower),
        )

        if (groupMatches || hasMatchingPermission) {
          if (!tableRef.current?.isGroupExpanded(groupKey)) {
            tableRef.current?.toggleGroup(groupKey)
          }
        }
      })
    }, [searchTerm, permissionGrouping])

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

    const handleExpand = () => {
      tableRef.current?.expandAll()
    }

    const handleCollapse = () => {
      tableRef.current?.collapseAll()
    }

    // Get all permission names for hidden field registration
    const allPermissionNames = Object.keys(permissionsValues) as Array<PermissionName>

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_17670124237009cpv09qihgr')}</Typography>
          <Typography color="grey600">{translate('text_17658096048119hpdp8kwcqd')}</Typography>
        </div>
        <div className="grid grid-cols-[4fr_1fr_1fr] gap-4">
          <TextInput
            cleanable
            placeholder={translate('text_17670163638877x7zsoijho9')}
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value)
            }}
            InputProps={{
              startAdornment: <Icon className="ml-4" name="magnifying-glass" />,
            }}
          />
          <Button variant="tertiary" size="large" startIcon="resize-expand" onClick={handleExpand}>
            {translate('text_624aa79870f60300a3c4d074')}
          </Button>
          <Button
            variant="tertiary"
            size="large"
            startIcon="resize-reduce"
            onClick={handleCollapse}
          >
            {translate('text_624aa732d6af4e0103d40e61')}
          </Button>
        </div>
        {errors && errors.length > 0 && (
          <Alert type="danger" data-scroll-target="role-permissions-form-errors">
            {errors.map((error) => (
              <Typography key={error} variant="body" color="grey700">
                {translate(error)}
              </Typography>
            ))}
          </Alert>
        )}
        <TableWithGroups
          ref={tableRef}
          rows={filteredRows}
          columns={columns}
          isLoading={isLoading}
        />
        {/* Hidden fields to ensure all permissions are registered with the form for validation */}
        <div className="hidden">
          {allPermissionNames.map((permissionName) => (
            <group.AppField key={permissionName} name={permissionName}>
              {(field) => <field.CheckboxField label={null} />}
            </group.AppField>
          ))}
        </div>
      </div>
    )
  },
})

export default RolePermissionsForm
