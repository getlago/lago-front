import { DetailsPage } from '~/components/layouts/DetailsPage'
import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { GetSubscriptionForDetailsOverviewQuery, PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type PaymentMethodType = PaymentMethodTypeEnum | null | undefined

interface PaymentInvoiceDetailsProps {
  paymentMethod?: NonNullable<
    GetSubscriptionForDetailsOverviewQuery['subscription']
  >['paymentMethod']
  paymentMethodType: PaymentMethodType
}

export const SECTION_TITLE = 'payment-invoice-details-section-title'
export const PAYMENT_METHOD_TYPE = (paymentMethodType: PaymentMethodType) =>
  `payment-method-type-${paymentMethodType}`

export const PaymentInvoiceDetails = ({
  paymentMethod,
  paymentMethodType,
}: PaymentInvoiceDetailsProps): JSX.Element | null => {
  const { translate } = useInternationalization()

  const formattedPaymentMethodDetails =
    paymentMethodType === PaymentMethodTypeEnum.Manual
      ? translate('text_1737110192586abtitcui0xt')
      : formatPaymentMethodDetails(paymentMethod?.details)

  if (!formattedPaymentMethodDetails) return null

  return (
    <div className="flex flex-col">
      <DetailsPage.SectionTitle variant="subhead1" noWrap data-test={SECTION_TITLE}>
        {translate('text_17634566456760qoj7hs7jrh')}
      </DetailsPage.SectionTitle>

      {formattedPaymentMethodDetails && !paymentMethod?.deletedAt && (
        <div data-test={PAYMENT_METHOD_TYPE(paymentMethodType)}>
          <DetailsPage.InfoGridItem
            className="mb-4"
            label={translate('text_17440371192353kif37ol194')}
            value={formattedPaymentMethodDetails}
          />
        </div>
      )}

      {/* {invoicesCustomFooter.length > 0 && (
        <div>
          <DetailsPage.InfoGridItem
            label={translate('text_17628623882713knw0jtohiw')}
            value={
              <div className="flex flex-wrap gap-3">
                {invoicesCustomFooter.map((item, i) => (
                  <Chip key={i} label={item} />
                ))}
              </div>
            }
          />
        </div>
      )} */}
    </div>
  )
}
