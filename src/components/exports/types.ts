import { DataExportFormatTypeEnum } from '~/generated/graphql'

export type ExportValues<T> = {
  clientMutationId?: string
  format: DataExportFormatTypeEnum
  resourceType: T
}
