import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { serializePlanInput } from '~/core/serializers'

import { PlanFormInput } from './types'

const { apiUrl } = envGlobalVar()

function cleanPlanObject(data: string | { [key: string]: string }, deleteKeys: String[]) {
  if (typeof data !== 'object') return
  if (!data) return

  for (const key in data) {
    if (deleteKeys.includes(key)) {
      delete data[key]
    } else {
      cleanPlanObject(data[key], deleteKeys)
    }
  }

  return data
}

const getSnippets = (plan?: PlanFormInput, isEdition?: boolean) => {
  if (!plan) return '# Fill the form to generate the code snippet'

  return `# Assign a plan to a customer
curl --location --request POST "${apiUrl}/api/v1/subscriptions" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "subscription": {
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "external_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "plan_code": "${plan.code || '__PLAN_CODE__'}"
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, ${
    !plan.code ? '__PLAN_CODE__, ' : ''
  }__EXTERNAL_SUBSCRIPTION_ID__ and  __EXTERNAL_CUSTOMER_ID__
  
  
# ${isEdition ? 'Update' : 'Create'} a plan
curl --location --request ${isEdition ? 'PUT' : 'POST'} "$${apiUrl}/api/v1/plans${
    isEdition ? `/${plan.code ? plan.code : '__PLAN_CODE__'}` : ''
  }" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "plan": ${JSON.stringify(
      cleanPlanObject(
        // @ts-ignore
        serializePlanInput(plan),
        ['__typename']
      ),
      null,
      2
    )}
  }'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__${
    !plan.code ? ' and __PLAN_CODE__' : ''
  }
  `
}

interface PlanCodeSnippetProps {
  isEdition?: boolean
  loading?: boolean
  plan?: PlanFormInput
}

export const PlanCodeSnippet = ({ isEdition, loading, plan }: PlanCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(plan, isEdition)} />
}
