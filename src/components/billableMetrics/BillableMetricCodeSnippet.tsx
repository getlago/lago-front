import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import {
  isGroupValid,
  isOneDimension,
  isTwoDimension,
  isValidJSON,
} from '~/core/utils/BMGroupUtils'
import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, fieldName, group, recurring } = billableMetric

  const hasGroup = isGroupValid(JSON.stringify(group))
  const parsedGroup =
    !!hasGroup &&
    (typeof group === 'string' && isValidJSON(group)
      ? JSON.parse(group)
      : JSON.parse(JSON.stringify(group)))
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
    case AggregationTypeEnum.WeightedSumAgg:
      return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer __YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": {
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "code": "${code}",
      "recurring": ${recurring},
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
    case AggregationTypeEnum.CountAgg:
      return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer __YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": {
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
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

    case AggregationTypeEnum.LatestAgg:
      return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": { 
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
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
