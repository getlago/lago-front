import { CodeSnippet } from '~/components/CodeSnippet'
import {
  CouponExpiration,
  CouponFrequency,
  CouponTypeEnum,
  CreateCouponInput,
} from '~/generated/graphql'
import { envGlobalVar } from '~/core/apolloClient'

const { apiUrl } = envGlobalVar()

const getSnippets = (coupon?: CreateCouponInput) => {
  if (!coupon || !coupon.code) return '# Fill the form to generate the code snippet'
  const {
    amountCents,
    amountCurrency,
    code,
    couponType,
    expiration,
    expirationAt,
    frequency,
    frequencyDuration,
    percentageRate,
  } = coupon

  return `# Assign a coupon to a customer
curl --location --request POST "${apiUrl}/api/v1/applied_coupons" \\
  --header "Authorization: Bearer $YOUR_API_KEY" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "applied_coupon": {
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "coupon_code": "${code}",
      ${
        couponType === CouponTypeEnum.FixedAmount
          ? `"coupon_type": "${couponType}",
      "amount_cents": ${(amountCents || 0) * 100},
      "amount_currency": "${amountCurrency}",`
          : `"coupon_type": "${couponType}",
      "percentage_rate": ${percentageRate ? percentageRate : '__MUST_BE_DEFINED__'},`
      }
      ${
        frequency === CouponFrequency.Recurring
          ? `"frequency": "${frequency}",
      "frequency_duration": ${frequencyDuration ? frequencyDuration : '__MUST_BE_DEFINED__'},`
          : `"frequency": "${frequency}",`
      }
      ${
        expiration === CouponExpiration.TimeLimit
          ? `"expiration": "${expiration}",
      "expiration_date": ${expirationAt ? expirationAt : '__MUST_BE_DEFINED__'},`
          : `"expiration": "${expiration}",`
      }
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
