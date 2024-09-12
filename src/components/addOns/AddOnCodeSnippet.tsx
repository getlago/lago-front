import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { snippetBuilder, SnippetVariables } from '~/core/utils/snippetBuilder'
import { CreateAddOnInput } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

// TODO: This snippet is not correct
const getSnippets = (addOn?: CreateAddOnInput, isEdition?: boolean) => {
  if (!addOn || !addOn.code) return '# Fill the form to generate the code snippet'

  return snippetBuilder({
    title: 'Assign an add on to a customer',
    method: isEdition ? 'PUT' : 'POST',
    url: `${apiUrl}/api/v1/add_ons${!!isEdition ? '/' + addOn.code : ''}`,
    headers: [
      { Authorization: `Bearer $${SnippetVariables.API_KEY}` },
      {
        'Content-Type': 'application/json',
      },
    ],
    data: {
      add_on: {
        external_customer_id: SnippetVariables.EXTERNAL_CUSTOMER_ID,
        add_on_code: addOn.code,
        amount_cents: serializeAmount(addOn.amountCents || 0, addOn.amountCurrency),
        amount_currency: addOn.amountCurrency,
      },
    },
    footerComment: `To use the snippet, don’t forget to edit your ${SnippetVariables.API_KEY} and ${SnippetVariables.EXTERNAL_CUSTOMER_ID}`,
  })
}

interface AddOnCodeSnippetProps {
  addOn?: CreateAddOnInput
  isEdition?: boolean
  loading?: boolean
}

export const AddOnCodeSnippet = ({ addOn, isEdition, loading }: AddOnCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(addOn, isEdition)} />
}
