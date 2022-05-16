import { CodeSnippet } from '~/components/CodeSnippet'

import { PlanFormInput } from './types'

const getSnippets = (plan?: PlanFormInput) => {
  if (!plan) return '# Fill the form to generate the code snippet'

  return `curl --location --request POST "${API_URL}/api/v1/subscriptions" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw ${JSON.stringify(
    `{"subscription": {"customer_id": "__CUSTOMER_ID__", "plan_code": "${plan.code}"} }`
  )}`
}

interface PlanCodeSnippetProps {
  loading?: boolean
  plan?: PlanFormInput
}

export const PlanCodeSnippet = ({ plan, loading }: PlanCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(plan)} />
}
