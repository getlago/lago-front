import { Properties, PropertiesInput } from '~/generated/graphql'

// Retype because displayInInvoice needs to be string for Combobox but API sends boolean or undefined
type PropertiesMappedToForm = Omit<PropertiesInput, 'presentationGroupKeys'> & {
  presentationGroupKeys: Array<
    Omit<NonNullable<PropertiesInput['presentationGroupKeys']>[number], 'options'> & {
      options: {
        displayInInvoice?: 'true' | 'false'
      }
    }
  >
}

const getPropertyShape = (properties: Properties | undefined): PropertiesMappedToForm => {
  return {
    amount: properties?.amount || undefined,
    pricingGroupKeys: !!properties?.pricingGroupKeys?.length ? properties?.pricingGroupKeys : [],
    presentationGroupKeys: (properties?.presentationGroupKeys || []).map((key) => ({
      ...key,
      options: {
        ...key.options,
        // ComboBoxField stores strings; cast to satisfy GraphQL types
        displayInInvoice: key.options?.displayInInvoice ? 'true' : 'false',
      },
    })),
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
