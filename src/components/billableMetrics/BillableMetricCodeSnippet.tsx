import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, description, fieldName, filters, name, recurring } = billableMetric

  // if (!name || !code || !aggregationType) {
  //   return '# Fill the form to generate the code snippet'
  // }

  // "filters": ${JSON.stringify(filters, null, 2)},`
  const properties =
    !!fieldName || !!filters?.length
      ? `
      "properties": {${
        aggregationType !== AggregationTypeEnum.CountAgg
          ? `
        "${!!fieldName ? fieldName : '__PROPERTY_TO_AGGREGATE__'}": ${
          !!fieldName
            ? `"__${fieldName.toUpperCase()}_VALUE__"`
            : '"__DEFINE_A_PROPERTY_TO_AGGREGATE__"'
        },`
          : ''
      }${
        (filters || [])?.length > 0
          ? `
        "filters": {
          ${filters?.map(
            (filter) =>
              `"${filter.key || '__DEFINE_A_KEY__'}": ["${
                filter.values.length ? filter.values.join('","') : '__DEFINE_VALUES__'
              }"],`,
          ).join(`
          `)}
        },`
          : ''
      }
      }`
      : ''

  return `curl --location --request POST "${apiUrl}/api/v1/events" \\
  --header "Authorization: Bearer __YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "event": {
      "transaction_id": "__UNIQUE_ID__", 
      "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
      "name": "${name || '__DEFINE_A_NAME__'}",
      "code": "${code || '__DEFINE_A_CODE__'}",${
        !!description
          ? `
      "description": "${description}",`
          : ''
      }
      "aggregation_type": "${aggregationType || '__DEFINE_AN_AGGREGATION_TYPE__'}",
      "recurring": ${recurring},
      "timestamp": $(date +%s),${properties}
    }
}'

# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__ and __EXTERNAL_SUBSCRIPTION_ID__`
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
