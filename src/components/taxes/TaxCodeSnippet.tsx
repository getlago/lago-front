import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { snippetBuilder, SnippetVariables } from '~/core/utils/snippetBuilder'

import { TaxFormInput } from './types'

const { apiUrl } = envGlobalVar()

const getSnippets = ({ tax, isEdition, initialTaxCode }: Omit<TaxCodeSnippetProps, 'loading'>) => {
  if (!tax) return '# Fill the form to generate the code snippet'

  return snippetBuilder({
    title: isEdition ? 'Edit a tax rate' : 'Create a tax rate',
    method: isEdition ? 'PUT' : 'POST',
    url: `${apiUrl}/api/v1/taxes${isEdition ? (initialTaxCode ? `/${initialTaxCode}` : '/__CODE_OF_TAX__') : ''}`,
    headers: [
      { Authorization: `Bearer $${SnippetVariables.API_KEY}` },
      { 'Content-Type': 'application/json' },
    ],
    data: {
      taxes: {
        name: tax.name || '__NAME_OF_TAX__',
        code: tax.code || '__CODE_OF_TAX__',
        ...(!!tax.description && { description: tax.description }),
        rate: tax.rate || '_VALUE_OF_TAX__',
      },
    },
    footerComment: `To use the snippet, don’t forget to edit your ${SnippetVariables.API_KEY}`,
  })
}

interface TaxCodeSnippetProps {
  isEdition?: boolean
  loading?: boolean
  tax?: TaxFormInput
  initialTaxCode?: string
}

export const TaxCodeSnippet = ({
  isEdition,
  loading,
  tax,
  initialTaxCode,
}: TaxCodeSnippetProps) => {
  return (
    <CodeSnippet
      loading={loading}
      language="bash"
      code={getSnippets({ tax, isEdition, initialTaxCode })}
    />
  )
}
