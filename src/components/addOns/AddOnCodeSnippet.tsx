import { CodeSnippet } from '~/components/CodeSnippet'
import { CreateAddOnInput } from '~/generated/graphql'

const getSnippets = (addOn?: CreateAddOnInput) => {
  if (!addOn || !addOn.code) return '# Fill the form to generate the code snippet'

  return `# Assign an add on to a customer
curl --location --request POST "${API_URL}/api/v1/applied_add_ons" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "applied_add_on": {
      "customer_id": "__CUSTOMER_ID__",
      "add_on_code": "${addOn.code}",
      "amount_cents": ${addOn.amountCents},
      "amount_currency": "EUR"
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ and  __CUSTOMER_ID__`
}

interface AddOnCodeSnippetProps {
  loading?: boolean
  addOn?: CreateAddOnInput
}

export const AddOnCodeSnippet = ({ addOn, loading }: AddOnCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(addOn)} />
}
