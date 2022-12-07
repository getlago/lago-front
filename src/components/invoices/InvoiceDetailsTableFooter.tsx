import { gql } from '@apollo/client'
import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, Invoice, InvoiceTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment InvoiceForDetailsTableFooter on Invoice {
    couponTotalAmountCents
    creditNoteTotalAmountCents
    subTotalVatExcludedAmountCents
    subTotalVatIncludedAmountCents
    totalAmountCents
    totalAmountCurrency
    vatAmountCents
    walletTransactionAmountCents
  }
`

interface InvoiceDetailsTableFooterProps {
  invoice: Invoice
}

export const InvoiceDetailsTableFooter = memo(({ invoice }: InvoiceDetailsTableFooterProps) => {
  const { translate } = useInternationalization()

  return (
    <tfoot>
      {invoice.invoiceType !== InvoiceTypeEnum.Credit && (
        <>
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey600">
                {translate('text_637ccf8133d2c9a7d11ce6f9')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(
                  deserializeAmount(
                    invoice?.subTotalVatExcludedAmountCents || 0,
                    invoice?.totalAmountCurrency || CurrencyEnum.Usd
                  ),
                  {
                    currencyDisplay: 'symbol',
                    currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                  }
                )}
              </Typography>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey600">
                {translate('text_637ccf8133d2c9a7d11ce6fd')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(
                  deserializeAmount(
                    invoice?.vatAmountCents || 0,
                    invoice?.totalAmountCurrency || CurrencyEnum.Usd
                  ),
                  {
                    currencyDisplay: 'symbol',
                    currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                  }
                )}
              </Typography>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey600">
                {translate('text_637ccf8133d2c9a7d11ce701')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(
                  deserializeAmount(
                    invoice?.subTotalVatIncludedAmountCents || 0,
                    invoice?.totalAmountCurrency || CurrencyEnum.Usd
                  ),
                  {
                    currencyDisplay: 'symbol',
                    currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                  }
                )}
              </Typography>
            </td>
          </tr>
        </>
      )}
      {!!Number(invoice?.creditNoteTotalAmountCents) && (
        <tr>
          <td></td>
          <td>
            <Typography variant="bodyHl" color="grey600">
              {translate('text_637ccf8133d2c9a7d11ce708')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="success600">
              {intlFormatNumber(
                deserializeAmount(
                  invoice?.creditNoteTotalAmountCents || 0,
                  invoice?.totalAmountCurrency || CurrencyEnum.Usd
                ),
                {
                  currencyDisplay: 'symbol',
                  currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                }
              )}
            </Typography>
          </td>
        </tr>
      )}
      {!!Number(invoice?.couponTotalAmountCents) && (
        <tr>
          <td></td>
          <td>
            <Typography variant="bodyHl" color="grey600">
              {translate('text_637ccf8133d2c9a7d11ce705')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="success600">
              {intlFormatNumber(
                deserializeAmount(
                  invoice?.couponTotalAmountCents || 0,
                  invoice?.totalAmountCurrency || CurrencyEnum.Usd
                ),
                {
                  currencyDisplay: 'symbol',
                  currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                }
              )}
            </Typography>
          </td>
        </tr>
      )}
      {!!Number(invoice?.walletTransactionAmountCents) && (
        <tr>
          <td></td>
          <td>
            <Typography variant="bodyHl" color="grey600">
              {translate('text_6391f05df4bf96d81f3660a7')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="success600">
              {intlFormatNumber(
                deserializeAmount(
                  invoice?.walletTransactionAmountCents || 0,
                  invoice?.totalAmountCurrency || CurrencyEnum.Usd
                ),
                {
                  currencyDisplay: 'symbol',
                  currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
                }
              )}
            </Typography>
          </td>
        </tr>
      )}
      <tr>
        <td></td>
        <td>
          <Typography variant="bodyHl" color="grey700">
            {invoice.invoiceType === InvoiceTypeEnum.Credit
              ? translate('text_63887b52e514213fed57fc1c')
              : translate('text_637ccf8133d2c9a7d11ce70d')}
          </Typography>
        </td>
        <td>
          <Typography variant="body" color="grey700">
            {intlFormatNumber(
              deserializeAmount(
                invoice?.totalAmountCents || 0,
                invoice?.totalAmountCurrency || CurrencyEnum.Usd
              ),
              {
                currencyDisplay: 'symbol',
                currency: invoice?.totalAmountCurrency || CurrencyEnum.Usd,
              }
            )}
          </Typography>
        </td>
      </tr>
    </tfoot>
  )
})

InvoiceDetailsTableFooter.displayName = 'InvoiceDetailsTableFooter'
