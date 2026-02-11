import { useStore } from '@tanstack/react-form'
import { Icon, IconName } from 'lago-design-system'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import {
  TableWithGroups,
  TableWithGroupsRef,
} from '~/components/designSystem/Table/TableWithGroups'
import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FieldGroupApi, GroupedCheckboxListComponentProps } from './types'
import { useColumns } from './useColumns'
import {
  createGroupingMap,
  filterRowsBySearchTerm,
  getDataRows,
  getGroupsToExpandForSearch,
  getOverallCheckboxValue,
} from './utils'

export type { FieldGroupApi }

function GroupedCheckboxList<TValues extends Record<string, boolean>>({
  group,
  title,
  subtitle,
  searchPlaceholder,
  groups,
  isEditable = true,
  isLoading = false,
  errors = [],
  errorScrollTarget = 'grouped-checkbox-list-errors',
}: GroupedCheckboxListComponentProps<TValues>) {
  const { translate } = useInternationalization()

  const checkboxValues = useStore(
    group.store,
    (state) => (state as { values: TValues }).values,
  ) as TValues

  const tableRef = useRef<TableWithGroupsRef>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [hasCollapsedGroups, setHasCollapsedGroups] = useState(true)

  const groupingMap = useMemo(() => createGroupingMap(groups), [groups])

  const overallCheckboxValue = getOverallCheckboxValue(checkboxValues)

  const handleOverallCheckboxChange = (_e: unknown, checked: boolean) => {
    const itemsToUpdate = Object.keys(checkboxValues) as Array<keyof TValues & string>

    itemsToUpdate.forEach((itemId) => {
      group.setFieldValue(itemId, checked, { dontValidate: !errors?.length })
    })
  }

  const handleGroupCheckboxClick = (
    checked: boolean,
    groupItems: Array<{ id: string; label: string }>,
  ) => {
    const itemsToUpdate = groupItems.map((item) => item.id) as Array<keyof TValues & string>

    itemsToUpdate.forEach((itemId) => {
      group.setFieldValue(itemId, checked, { dontValidate: !errors?.length })
    })
  }

  const rows = useMemo(() => getDataRows(groups), [groups])

  const filteredRows = useMemo(
    () => filterRowsBySearchTerm(rows, groups, searchTerm),
    [rows, searchTerm, groups],
  )

  // Auto-expand groups containing matches when searching
  useEffect(() => {
    if (!searchTerm.trim()) return

    const groupsToExpand = getGroupsToExpandForSearch(groups, searchTerm)
    let hasChanges = false

    groupsToExpand.forEach((groupId) => {
      if (!tableRef.current?.isGroupExpanded(groupId)) {
        tableRef.current?.toggleGroup(groupId)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setHasCollapsedGroups(tableRef.current?.hasCollapsedGroups() ?? true)
    }
  }, [searchTerm, groups])

  const columns = useColumns({
    isEditable,
    checkboxValues,
    groupingMap,
    overallCheckboxValue,
    onOverallCheckboxChange: handleOverallCheckboxChange,
    onGroupCheckboxClick: handleGroupCheckboxClick,
    AppField: group.AppField,
  })

  const handleExpandCollapseAll = () => {
    if (hasCollapsedGroups) {
      tableRef.current?.expandAll()
      setHasCollapsedGroups(false)
    } else {
      tableRef.current?.collapseAll()
      setHasCollapsedGroups(true)
    }
  }

  const getExpandCollapseButtonLabel = (): string => {
    if (hasCollapsedGroups) {
      return translate('text_1768309883114yr34e2jrvn7')
    }
    return translate('text_17683098831144lro3kg6rip')
  }

  const getExpandCollapseButtonIcon = (): IconName => {
    if (hasCollapsedGroups) {
      return 'resize-expand'
    }
    return 'resize-reduce'
  }

  // Get all item ids for hidden field registration
  const allItemIds = Object.keys(checkboxValues) as Array<keyof TValues & string>
  const AppField = group.AppField

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography variant="subhead1">{title}</Typography>
        <Typography color="grey600">{subtitle}</Typography>
      </div>
      <div className="grid grid-cols-[4fr_1fr] gap-4">
        <TextInput
          cleanable
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value)
          }}
          InputProps={{
            startAdornment: <Icon className="ml-4" name="magnifying-glass" />,
          }}
        />
        <Button
          variant="tertiary"
          size="large"
          startIcon={getExpandCollapseButtonIcon()}
          onClick={handleExpandCollapseAll}
        >
          {getExpandCollapseButtonLabel()}
        </Button>
      </div>
      {errors && errors.length > 0 && (
        <Alert type="danger" data-scroll-target={errorScrollTarget}>
          {errors.map((error) => (
            <Typography key={error} variant="body" color="grey700">
              {translate(error)}
            </Typography>
          ))}
        </Alert>
      )}
      <TableWithGroups ref={tableRef} rows={filteredRows} columns={columns} isLoading={isLoading} />
      {/* Hidden fields to ensure all items are registered with the form for validation */}
      <div className="hidden">
        {allItemIds.map((itemId) => (
          <AppField key={itemId} name={itemId}>
            {(field) => <field.CheckboxField label={null} />}
          </AppField>
        ))}
      </div>
    </div>
  )
}

export default GroupedCheckboxList
