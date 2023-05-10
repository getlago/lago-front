import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'

import { TaxRateFormInput } from './types'

const { apiUrl } = envGlobalVar()

const getSnippets = (taxRate?: TaxRateFormInput, isEdition?: boolean) => {
  if (!taxRate) return '# Fill the form to generate the code snippet'

  return `# ${isEdition ? 'Edit a tax rate' : 'Create a tax rate'}
curl --location --request ${isEdition ? 'PUT' : 'POST'} "${apiUrl}/api/v1/tax_rates${
    isEdition ? (taxRate.code ? `/${taxRate.code}` : '/__CODE_OF_TAX_RATE__') : ''
  }" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "tax_rate": {
      "name": "${taxRate.name || '__NAME_OF_TAX_RATE__'}",
      "code": "${taxRate.code || '__CODE_OF_TAX_RATE__'}",${
    !!taxRate.description
      ? `
      "description": "${taxRate.description}",`
      : ''
  }
      "value": "${taxRate.value || '_VALUE_OF_TAX_RATE'}",
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ ${
    isEdition && !taxRate.code ? 'and __CODE_OF_TAX_RATE__' : ''
  }`
}

interface TaxRateCodeSnippetProps {
  isEdition?: boolean
  loading?: boolean
  taxRate?: TaxRateFormInput
}

export const TaxRateCodeSnippet = ({ isEdition, loading, taxRate }: TaxRateCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(taxRate, isEdition)} />
}
