import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'

import { PlanFormInput } from './types'

const { apiUrl } = envGlobalVar()

const getSnippets = (plan?: PlanFormInput) => {
  if (!plan) return '# Fill the form to generate the code snippet'

  return `# Assign a plan to a customer
curl --location --request POST "${apiUrl}/api/v1/subscriptions" \\
  --header "Authorization: Bearer $YOUR_API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "subscription": {
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "external_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "plan_code": "${plan.code}"
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __EXTERNAL_SUBSCRIPTION_ID__ and  __EXTERNAL_CUSTOMER_ID__`
}

interface PlanCodeSnippetProps {
  loading?: boolean
  plan?: PlanFormInput
}

export const PlanCodeSnippet = ({ plan, loading }: PlanCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(plan)} />
}
