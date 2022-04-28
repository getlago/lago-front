import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'
import { CodeSnippet } from '~/components/CodeSnippet'

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, fieldName } = billableMetric

  switch (aggregationType) {
    case AggregationTypeEnum.CountAgg:
      return `curl --location --request POST "${API_URL}/api/v1/events" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw ${JSON.stringify(
    `{"event": {"customer_id": "__CUSTOMER_ID__", "code": "${code}", "timestamp": $(date +%s)}}`
  )}`
    case AggregationTypeEnum.UniqueCountAgg:
      return `curl --location --request POST "$LAGO_URL/api/v1/events" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw ${JSON.stringify(
    `{"event": {"customer_id": "__CUSTOMER_ID__", "code": "${code}", "timestamp": $(date +%s), "properties":  { "${fieldName}": "data" }}}`
  )}`
    case AggregationTypeEnum.MaxAgg:
      return `curl --location --request POST "${API_URL}/api/v1/events" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw ${JSON.stringify(
    `{"event": {"customer_id": "__CUSTOMER_ID__", "code": "${code}", "timestamp": $(date +%s), "properties":  { "${fieldName}": 12 }}}`
  )}`
    case AggregationTypeEnum.SumAgg:
      return `curl --location --request POST "${API_URL}/api/v1/events" \\
  --header "Authorization: Bearer $API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw ${JSON.stringify(
    `{"event": {"customer_id": "__CUSTOMER_ID__", "code": "${code}", "timestamp": $(date +%s), "properties":  { "${fieldName}": 12 }}}`
  )}`
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
