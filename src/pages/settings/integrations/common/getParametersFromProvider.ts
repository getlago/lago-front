import { IntegrationTypeEnum } from '~/generated/graphql'
import { extractOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/extractOptionValue'

import {
  AvalaraAndAnrokParameters,
  MappableIntegrationProvider,
  NetsuiteParameters,
  XeroParameters,
} from './types'

export const getParametersFromProvider = <FormValues>(
  inputValues: FormValues,
  provider: MappableIntegrationProvider,
):
  | { success: false; parameters: undefined }
  | {
      success: true
      parameters: AvalaraAndAnrokParameters
    }
  | {
      success: true
      parameters: NetsuiteParameters
    }
  | {
      success: true
      parameters: XeroParameters
    } => {
  if (!inputValues || typeof inputValues !== 'object') {
    return {
      success: false,
      parameters: undefined,
    }
  }

  switch (provider) {
    case IntegrationTypeEnum.Anrok: {
      if (!('externalId' in inputValues) || !('externalName' in inputValues)) {
        return {
          success: false,
          parameters: undefined,
        }
      }

      return {
        success: true,
        parameters: {
          externalId: inputValues.externalId ? `${inputValues.externalId}` : undefined,
          externalName: inputValues.externalName ? `${inputValues.externalName}` : undefined,
        },
      }
    }

    case IntegrationTypeEnum.Avalara: {
      if (!('externalId' in inputValues) || !('externalName' in inputValues)) {
        return {
          success: false,
          parameters: undefined,
        }
      }

      return {
        success: true,
        parameters: {
          externalId: inputValues.externalId ? `${inputValues.externalId}` : undefined,
          externalName: inputValues.externalName ? `${inputValues.externalName}` : undefined,
        },
      }
    }

    case IntegrationTypeEnum.Netsuite: {
      if (
        (!('taxCode' in inputValues) ||
          !('taxNexus' in inputValues) ||
          !('taxType' in inputValues)) &&
        (!('externalId' in inputValues) ||
          !('externalName' in inputValues) ||
          !('externalAccountCode' in inputValues))
      ) {
        return {
          success: false,
          parameters: undefined,
        }
      }

      return {
        success: true,
        parameters: {
          externalId:
            'externalId' in inputValues && inputValues.externalId
              ? `${inputValues.externalId}`
              : undefined,
          externalName:
            'externalName' in inputValues && inputValues.externalName
              ? `${inputValues.externalName}`
              : undefined,
          externalAccountCode:
            'externalAccountCode' in inputValues && inputValues.externalAccountCode
              ? `${inputValues.externalAccountCode}`
              : undefined,
          taxCode:
            'taxCode' in inputValues && inputValues.taxCode ? `${inputValues.taxCode}` : undefined,
          taxNexus:
            'taxNexus' in inputValues && inputValues.taxNexus
              ? `${inputValues.taxNexus}`
              : undefined,
          taxType:
            'taxType' in inputValues && inputValues.taxType ? `${inputValues.taxType}` : undefined,
        },
      }
    }

    case IntegrationTypeEnum.Xero: {
      if (!('selectedElementValue' in inputValues)) {
        return {
          success: false,
          parameters: undefined,
        }
      }

      // Have to split to let ts know it exist in the object
      if (typeof inputValues.selectedElementValue !== 'string') {
        return {
          success: false,
          parameters: undefined,
        }
      }

      const { externalAccountCode, externalId, externalName } = extractOptionValue(
        inputValues.selectedElementValue,
      )

      return {
        success: true,
        parameters: {
          externalAccountCode,
          externalId,
          externalName,
        },
      }
    }

    // Shouldn't work if it's an unknown provider
    default:
      return {
        success: false,
        parameters: undefined,
      }
  }
}
