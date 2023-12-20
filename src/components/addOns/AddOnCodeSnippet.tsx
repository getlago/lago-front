import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { CreateAddOnInput } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

const getSnippets = (addOn?: CreateAddOnInput, isEdition?: boolean) => {
  if (!addOn || !addOn.code) return '# Fill the form to generate the code snippet'

  return `# Assign an add on to a customer
curl --location --request ${isEdition ? 'PUT' : 'POST'} "${apiUrl}/api/v1/add_ons${
    !!isEdition ? '/' + addOn.code : ''
  }" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "add_on": {
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "add_on_code": "${addOn.code}",
      "amount_cents": ${serializeAmount(addOn.amountCents || 0, addOn.amountCurrency)},
      "amount_currency": "${addOn.amountCurrency}"
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ and  __EXTERNAL_CUSTOMER_ID__`
}

interface AddOnCodeSnippetProps {
  addOn?: CreateAddOnInput
  isEdition?: boolean
  loading?: boolean
}

export const AddOnCodeSnippet = ({ addOn, isEdition, loading }: AddOnCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(addOn, isEdition)} />
}
