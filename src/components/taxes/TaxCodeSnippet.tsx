import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'

import { TaxFormInput } from './types'

const { apiUrl } = envGlobalVar()

const getSnippets = (tax?: TaxFormInput, isEdition?: boolean) => {
  if (!tax) return '# Fill the form to generate the code snippet'

  return `# ${isEdition ? 'Edit a tax rate' : 'Create a tax rate'}
curl --location --request ${isEdition ? 'PUT' : 'POST'} "${apiUrl}/api/v1/taxes${
    isEdition ? (tax.code ? `/${tax.code}` : '/__CODE_OF_TAX__') : ''
  }" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "taxes": {
      "name": "${tax.name || '__NAME_OF_TAX__'}",
      "code": "${tax.code || '__CODE_OF_TAX__'}",${
    !!tax.description
      ? `
      "description": "${tax.description}",`
      : ''
  }
      "rate": "${tax.rate || '_VALUE_OF_TAX__'}",
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ ${
    isEdition && !tax.code ? 'and __CODE_OF_TAX__' : ''
  }`
}

interface TaxCodeSnippetProps {
  isEdition?: boolean
  loading?: boolean
  tax?: TaxFormInput
}

export const TaxCodeSnippet = ({ isEdition, loading, tax }: TaxCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(tax, isEdition)} />
}
