import { IconName } from 'lago-design-system'

export type IntegrationItem = {
  icon: IconName
  label: string
  description: string
  onMappingClick: () => void
  mappingInfos?: {
    id?: string
    name: string
  }
}

export type IntegrationItemsSection = {
  sectionName: string
  children: Array<IntegrationItem>
}
