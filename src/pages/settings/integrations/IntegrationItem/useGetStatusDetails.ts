import { StatusType } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useGetStatusDetails = () => {
  const { translate } = useInternationalization()

  const getStatusDetails = (
    mappingInfos: { id: string | undefined; name: string } | undefined,
    columnId: string | null,
  ): { type: StatusType; label: string } => {
    // No mapping info for a billing entity
    if (!mappingInfos) {
      if (columnId !== null) {
        return { type: StatusType.disabled, label: translate('text_65281f686a80b400c8e2f6d1') }
      }

      // No default mapping
      return { type: StatusType.warning, label: translate('text_6630e3210c13c500cd398e9a') }
    }

    if (!!mappingInfos && !mappingInfos.name) {
      return { type: StatusType.success, label: translate('text_17272714562192y06u5okvo4') }
    }

    return {
      type: StatusType.success,
      label: `${mappingInfos.name}${!!mappingInfos.id ? ` (${mappingInfos.id})` : ''}`,
    }
  }

  return { getStatusDetails }
}
