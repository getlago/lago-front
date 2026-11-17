import {
  getX402Environment,
  getX402Families,
  getX402NetworkName,
  parseAllowedOrigins,
} from '~/components/settings/integrations/x402Connection'
import {
  AddX402ConnectionDialogFragment,
  CreateX402ConnectionInput,
  X402NetworkFamilyEnum,
  X402NetworkFragment,
} from '~/generated/graphql'

import { X402FormValues } from './validationSchema'

type X402ConnectionInput = Omit<CreateX402ConnectionInput, 'cdpApiKeyId' | 'cdpApiKeySecret'> &
  Partial<Pick<CreateX402ConnectionInput, 'cdpApiKeyId' | 'cdpApiKeySecret'>>

export const mapFromApiToForm = (
  connection: AddX402ConnectionDialogFragment,
  catalog: X402NetworkFragment[],
): X402FormValues => ({
  isEdition: true,
  name: connection.name,
  code: connection.code,
  cdpApiKeyId: '',
  cdpApiKeySecret: '',
  environment: getX402Environment(connection.networks, catalog) || '',
  networks: connection.networks.map((network) => ({
    value: network,
    label: getX402NetworkName(network, catalog),
  })),
  evmPayoutAddress: connection.payoutAddresses.evm || '',
  svmPayoutAddress: connection.payoutAddresses.svm || '',
  allowedOrigins: connection.allowedOrigins.join('\n'),
  autoCreateCustomers: connection.autoCreateCustomers,
})

export const mapFromFormToApi = (values: X402FormValues): X402ConnectionInput => {
  const networks = values.networks.map(({ value }) => value)
  const families = getX402Families(networks)

  return {
    name: values.name,
    code: values.code,
    networks,
    payoutAddresses: {
      evm: (families.includes(X402NetworkFamilyEnum.Evm) && values.evmPayoutAddress) || null,
      svm: (families.includes(X402NetworkFamilyEnum.Svm) && values.svmPayoutAddress) || null,
    },
    allowedOrigins: parseAllowedOrigins(values.allowedOrigins),
    autoCreateCustomers: values.autoCreateCustomers,
    ...(values.cdpApiKeyId && { cdpApiKeyId: values.cdpApiKeyId }),
    ...(values.cdpApiKeySecret && { cdpApiKeySecret: values.cdpApiKeySecret }),
  }
}
