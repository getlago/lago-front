import { Stack } from '@mui/material'
import { Avatar, Icon, Typography } from 'lago-design-system'

import { Status, StatusType, Table, TableColumn } from '~/components/designSystem'
import { MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { getMappingInfos, ItemMapping } from '~/pages/settings/integrations/common'

import { IntegrationItemData, IntegrationItemsTableProps } from './types'

const IntegrationItemsTable = ({
  integrationId,
  integrationMapItemDialogRef,
  defaultItems,
  items,
  provider,
  firstColumnName,
}: IntegrationItemsTableProps) => {
  const { translate } = useInternationalization()

  const findItemMapping = (mappingType: MappingTypeEnum): ItemMapping | undefined => {
    return defaultItems?.find((item) => item.mappingType === mappingType)
  }

  const columns: Array<TableColumn<IntegrationItemData>> = [
    {
      key: 'label',
      title: firstColumnName ?? translate('text_661ff6e56ef7e1b7c542b200'),
      content: (item: IntegrationItemData) => {
        return (
          <Stack direction="row" alignItems="center" gap={3} className="py-3">
            <Avatar size="big" variant="connector">
              <Icon name={item.icon} color="dark" />
            </Avatar>

            <Stack>
              <Typography variant="bodyHl" color="grey700">
                {item.label}
              </Typography>
              <Typography variant="caption" color="grey600">
                {item.description}
              </Typography>
            </Stack>
          </Stack>
        )
      },
      minWidth: 200,
      maxSpace: true,
    },
    {
      key: 'id',
      title: translate('text_6630e3210c13c500cd398e97'),
      content: (item: IntegrationItemData) => {
        const itemMapping = findItemMapping(item.mappingType)
        const mappingInfos = getMappingInfos(itemMapping, provider)
        const statusType = !!mappingInfos ? StatusType.success : StatusType.warning

        const getStatusLabel = () => {
          if (!mappingInfos) {
            return translate('text_6630e3210c13c500cd398e9a')
          }

          if (!!mappingInfos && !mappingInfos.name) {
            return translate('text_17272714562192y06u5okvo4')
          }

          return `${mappingInfos.name}${!!mappingInfos.id ? ` (${mappingInfos.id})` : ''} `
        }

        return <Status type={statusType} label={getStatusLabel()} />
      },
      minWidth: 200,
    },
  ]

  const getOnMappingClick = (itemMapping: ItemMapping | undefined, item: IntegrationItemData) => {
    const sharedProps = {
      integrationId,
      type: item.mappingType,
      itemId: itemMapping?.id,
    }

    if (item.mappingType === MappingTypeEnum.Tax && itemMapping && 'taxCode' in itemMapping) {
      return () =>
        integrationMapItemDialogRef.current?.openDialog({
          ...sharedProps,
          taxCode: itemMapping?.taxCode,
          taxNexus: itemMapping?.taxNexus,
          taxType: itemMapping?.taxType,
        })
    }

    return () =>
      integrationMapItemDialogRef.current?.openDialog({
        ...sharedProps,
        itemExternalId: itemMapping?.externalId,
        itemExternalCode: itemMapping?.externalAccountCode || undefined,
        itemExternalName: itemMapping?.externalName || undefined,
      })
  }

  const handleRowActionClick = (item: IntegrationItemData) => {
    const itemMapping = findItemMapping(item.mappingType)
    const onMappingClick = getOnMappingClick(itemMapping, item)

    onMappingClick()
  }

  return (
    <Table
      name="integration-items"
      columns={columns}
      data={items}
      onRowActionClick={handleRowActionClick}
    />
  )
}

export default IntegrationItemsTable
