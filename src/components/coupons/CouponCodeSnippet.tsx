import { CodeSnippet } from '~/components/CodeSnippet'
import { CreateCouponInput } from '~/generated/graphql'
import { envGlobalVar } from '~/core/apolloClient'

const { apiUrl } = envGlobalVar()

const getSnippets = (coupon?: CreateCouponInput) => {
  if (!coupon || !coupon.code) return '# Fill the form to generate the code snippet'

  return `# Assign a coupon to a customer
curl --location --request POST "${apiUrl}/api/v1/applied_coupons" \\
  --header "Authorization: Bearer $YOUR_API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "applied_coupon": {
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "coupon_code": "${coupon.code}",
      "amount_cents": ${coupon.amountCents * 100},
      "amount_currency": "${coupon.amountCurrency}"
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ and  __EXTERNAL_CUSTOMER_ID__`
}

interface CouponCodeSnippetProps {
  loading?: boolean
  coupon?: CreateCouponInput
}

export const CouponCodeSnippet = ({ coupon, loading }: CouponCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets(coupon)} />
}
