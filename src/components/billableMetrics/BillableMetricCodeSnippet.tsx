import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'
import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'

const { apiUrl } = envGlobalVar()

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, fieldName } = billableMetric

  switch (aggregationType) {
    case AggregationTypeEnum.CountAgg:
      return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": {
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__", 
      "code": "${code}", 
      "timestamp": $(date +%s)
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__`
    case AggregationTypeEnum.UniqueCountAgg:
      return `curl --location --request POST "$LAGO_URL/api/v1/events" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": {
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__", 
      "code": "${code}", 
      "timestamp": $(date +%s), 
      "properties":  { 
        "${fieldName}": "data" 
      }
    }
  }'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__`
    case AggregationTypeEnum.SumAgg:
    case AggregationTypeEnum.MaxAgg:
      return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": { 
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__", 
      "code": "${code}", 
      "timestamp": $(date +%s), 
      "properties":  { 
        "${fieldName}": 12 
      }
    }
  }'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__`
    default:
      return '# Fill the form to generate the code snippet'
  }
}

interface BillableMetricCodeSnippetProps {
  loading?: boolean
  billableMetric?: CreateBillableMetricInput
}

export const BillableMetricCodeSnippet = ({
  billableMetric,
  loading,
}: BillableMetricCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(billableMetric)} />
}
