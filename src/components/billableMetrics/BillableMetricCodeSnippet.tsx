import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

const getSnippets = (billableMetric?: CreateBillableMetricInput) => {
  if (!billableMetric) return '# Fill the form to generate the code snippet'

  const { aggregationType, code, fieldName, filters } = billableMetric
  const firstFilter = filters?.[0]
  const canDisplayFilterProperty = !!firstFilter && !!firstFilter?.key && !!firstFilter?.values?.[0]

  const properties =
    !!fieldName || !!filters?.length
      ? `
      "properties": {${
        !!aggregationType && aggregationType !== AggregationTypeEnum.CountAgg
          ? `
          "${!!fieldName ? fieldName : '__PROPERTY_TO_AGGREGATE__'}": ${
            !!fieldName
              ? `"__${fieldName.toUpperCase()}_VALUE__"`
              : '"__DEFINE_A_PROPERTY_TO_AGGREGATE__"'
          },`
          : ''
      }${
        !!canDisplayFilterProperty
          ? `
          "${firstFilter?.key}": "${firstFilter?.values?.[0] || '__DEFINE_A_VALUE__'}",`
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
      "code": "${code || '__DEFINE_A_CODE__'}",${properties}
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
