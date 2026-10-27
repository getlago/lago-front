import {
  getX402Environment,
  getX402Network,
  parseAllowedOrigins,
} from '~/components/settings/integrations/x402Connection'
import { AddX402ConnectionDialogFragment, CreateX402ConnectionInput } from '~/generated/graphql'

import { X402FormValues } from './validationSchema'

type X402ConnectionInput = Omit<CreateX402ConnectionInput, 'cdpApiKeyId' | 'cdpApiKeySecret'> &
  Partial<Pick<CreateX402ConnectionInput, 'cdpApiKeyId' | 'cdpApiKeySecret'>>

export const mapFromApiToForm = (connection: AddX402ConnectionDialogFragment): X402FormValues => ({
  isEdition: true,
  name: connection.name,
  code: connection.code,
  cdpApiKeyId: '',
  cdpApiKeySecret: '',
  environment: getX402Environment(connection.networks) || '',
  networks: connection.networks.map((network) => ({
    value: network,
    label: getX402Network(network)?.name || network,
  })),
  evmPayoutAddress: connection.payoutAddresses.evm || '',
  svmPayoutAddress: connection.payoutAddresses.svm || '',
  allowedOrigins: connection.allowedOrigins.join('\n'),
  autoCreateCustomers: connection.autoCreateCustomers,
})

export const mapFromFormToApi = (values: X402FormValues): X402ConnectionInput => ({
  name: values.name,
  code: values.code,
  networks: values.networks.map(({ value }) => value),
  payoutAddresses: {
    evm: values.evmPayoutAddress || null,
    svm: values.svmPayoutAddress || null,
  },
  allowedOrigins: parseAllowedOrigins(values.allowedOrigins),
  autoCreateCustomers: values.autoCreateCustomers,
  ...(values.cdpApiKeyId && { cdpApiKeyId: values.cdpApiKeyId }),
  ...(values.cdpApiKeySecret && { cdpApiKeySecret: values.cdpApiKeySecret }),
})
