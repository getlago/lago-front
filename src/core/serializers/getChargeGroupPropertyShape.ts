import { ChargeGroupPropertiesInput } from '~/generated/graphql'

const getChargeGroupPropertyShape = (properties: ChargeGroupPropertiesInput | undefined) => {
  return {
    amount: properties?.amount || undefined,
    freeUnits: properties?.freeUnits || 0,
  }
}

export default getChargeGroupPropertyShape
