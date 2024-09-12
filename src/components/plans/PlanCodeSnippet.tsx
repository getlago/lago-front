import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { snippetBuilder, SnippetVariables } from '~/core/utils/snippetBuilder'

import { PlanFormInput } from './types'

const { apiUrl } = envGlobalVar()

const getSnippets = (plan?: PlanFormInput) => {
  if (!plan || !plan.code) return '# Fill the form to generate the code snippet'

  return snippetBuilder({
    title: 'Assign a plan to a customer',
    url: `${apiUrl}/api/v1/subscriptions`,
    method: 'POST',
    headers: [
      { Authorization: `Bearer $${SnippetVariables.API_KEY}` },
      { 'Content-Type': 'application/json' },
    ],
    data: {
      subscription: {
        external_customer_id: SnippetVariables.EXTERNAL_CUSTOMER_ID,
        external_id: SnippetVariables.EXTERNAL_SUBSCRIPTION_ID,
        plan_code: plan.code,
      },
    },
    footerComment: `To use the snippet, don’t forget to edit your ${SnippetVariables.API_KEY}, ${SnippetVariables.EXTERNAL_CUSTOMER_ID} and ${SnippetVariables.EXTERNAL_SUBSCRIPTION_ID}`,
  })
}

interface PlanCodeSnippetProps {
  loading?: boolean
  plan?: PlanFormInput
}

export const PlanCodeSnippet = ({ plan, loading }: PlanCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(plan)} />
}
