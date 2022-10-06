import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'
import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'

const { apiUrl } = envGlobalVar()

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, fieldName, group } = billableMetric

  const isValidJSON = (string: string) => {
    try {
      JSON.parse(string)
    } catch (e) {
      return false
    }

    return true
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOneDimension = (object: any): boolean => {
    if (!object) return false

    return !!object.key && !!object.values && !!object.values.length
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTwoDimension = (object: any): boolean => {
    if (!object) return false

    return (
      !!object.key &&
      !!object.values &&
      !!object.values.length &&
      !!object.values[0] &&
      !!object.values[0].name &&
      !!object.values[0].values &&
      !!object.values[0].values.length
    )
  }

  const hasGroup = !!group && group !== '{}' && isValidJSON(group)
  const parsedGroup = !!hasGroup && JSON.parse(group)
  const groupDimension =
    hasGroup && isTwoDimension(parsedGroup) ? 2 : isOneDimension(parsedGroup) ? 1 : 0
  const groupDimensionMessage = `${
    groupDimension > 0
      ? `# Also please adapt __KEY__ ${groupDimension === 1 ? 'and' : ','} __GROUP_VALUE__ ${
          groupDimension === 2 ? ',__GROUP_KEY__ and__GROUP_VALUE__ ' : ''
        }depending on your group(s) data`
      : ''
  }`

  const propertiesForGroup = `"__KEY__": "__GROUP_VALUE__"${
    groupDimension === 2
      ? `,
        "__GROUP_KEY__": "__GROUP_VALUE__"
  `
      : ''
  }`

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
      "timestamp": $(date +%s)${
        groupDimension > 0
          ? `,
      "properties": {
        ${propertiesForGroup}
      }`
          : ''
      }
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__
${groupDimensionMessage}
`

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
        "${fieldName}": "data"${
        groupDimension > 0
          ? `,
        ${propertiesForGroup}`
          : ''
      }
      }
    }
  }'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__
${groupDimensionMessage}
`
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
        "${fieldName}": 12${
        groupDimension > 0
          ? `,
        ${propertiesForGroup}`
          : ''
      }
      }
    }
  }'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__
${groupDimensionMessage}
`
    case AggregationTypeEnum.RecurringCountAgg:
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
        "${fieldName}": "__VALUE__" ,
        "operation_type": "add"${
          groupDimension > 0
            ? `,
        ${propertiesForGroup}`
            : ''
        }
      }
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__, __EXTERNAL_CUSTOMER_ID__ and __VALUE__
${groupDimensionMessage}
`
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
