import { LocalPropertiesInput } from '~/components/plans/types'
import { Properties } from '~/generated/graphql'

const getPropertyShape = (properties: Properties | undefined): LocalPropertiesInput => {
  return {
    amount: properties?.amount || undefined,
    groupedBy: !!properties?.groupedBy ? properties?.groupedBy.join(',') : '',
    packageSize:
      properties?.packageSize === null || properties?.packageSize === undefined
        ? 10
        : properties?.packageSize,
    fixedAmount: properties?.fixedAmount || undefined,
    freeUnitsPerEvents: properties?.freeUnitsPerEvents || undefined,
    freeUnitsPerTotalAggregation: properties?.freeUnitsPerTotalAggregation || undefined,
    perTransactionMinAmount: properties?.perTransactionMinAmount || undefined,
    perTransactionMaxAmount: properties?.perTransactionMaxAmount || undefined,
    freeUnits: properties?.freeUnits || 0,
    graduatedRanges: properties?.graduatedRanges || undefined,
    graduatedPercentageRanges: properties?.graduatedPercentageRanges || undefined,
    volumeRanges: properties?.volumeRanges || undefined,
    rate: properties?.rate || undefined,
    customProperties: properties?.customProperties || undefined,
  }
}

export default getPropertyShape
