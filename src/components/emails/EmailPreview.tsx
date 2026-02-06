import { Icon } from 'lago-design-system'

import { Skeleton, Typography } from '~/components/designSystem'
import { PreviewEmailLayout } from '~/components/settings/PreviewEmailLayout'
import { envGlobalVar } from '~/core/apolloClient'
import { LocaleEnum } from '~/core/translations'
import { BillingEntityEmailSettingsEnum, GetBillingEntityQuery } from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useEmailPreviewTranslationsKey } from '~/hooks/useEmailPreviewTranslationsKey'

type EmailPreviewProps = {
  loading: boolean
  invoiceLanguage?: LocaleEnum
  type?: BillingEntityEmailSettingsEnum
  billingEntity?: GetBillingEntityQuery['billingEntity']
}

const { disablePdfGeneration } = envGlobalVar()

const EmailPreview = ({
  loading,
  invoiceLanguage = LocaleEnum.en,
  type,
  billingEntity,
}: EmailPreviewProps) => {
  const { translateWithContextualLocal } = useContextualLocale(invoiceLanguage)
  const { mapTranslationsKey } = useEmailPreviewTranslationsKey()
  const translationsKey = mapTranslationsKey(type)

  const billingEntityName = billingEntity?.name

  return (
    <PreviewEmailLayout
      isLoading={loading}
      language={invoiceLanguage}
      logoUrl={billingEntity?.logoUrl}
      emailObject={translateWithContextualLocal(translationsKey.subject, {
        organization: billingEntityName,
      })}
    >
      <div className="flex flex-col items-center justify-center">
        {loading ? (
          <>
            <Skeleton color="dark" variant="text" className="mb-5 w-30" />
            <Skeleton color="dark" variant="text" className="mb-5 w-40" />
            <Skeleton color="dark" variant="text" className="mb-7 w-30" />
            <Skeleton color="dark" variant="text" className="mb-7" />
            <div className="flex w-full justify-between">
              <Skeleton color="dark" variant="text" className="mb-4 w-30" />
              <Skeleton color="dark" variant="text" className="mb-4 w-40" />
            </div>
            <div className="flex w-full justify-between">
              <Skeleton color="dark" variant="text" className="mb-4 w-30" />
              <Skeleton color="dark" variant="text" className="mb-4 w-40" />
            </div>
          </>
        ) : (
          <>
            <Typography variant="caption">
              {translateWithContextualLocal(translationsKey.invoice_from, {
                organization: billingEntityName,
              })}
            </Typography>
            <Typography variant="headline">
              {translateWithContextualLocal(translationsKey.amount)}
            </Typography>
            <Typography variant="caption">
              {translateWithContextualLocal(translationsKey.total)}
            </Typography>
            <div className="my-6 h-px w-full bg-grey-300" />
            <div className="flex w-full flex-col gap-1">
              {type === BillingEntityEmailSettingsEnum.CreditNoteCreated && (
                <div className="flex w-full items-center justify-between">
                  <Typography variant="caption">
                    {translateWithContextualLocal(translationsKey.credit_note_number as string)}
                  </Typography>
                  <Typography variant="caption" color="grey700">
                    {translateWithContextualLocal(
                      translationsKey.credit_note_number_value as string,
                    )}
                  </Typography>
                </div>
              )}
              {type === BillingEntityEmailSettingsEnum.PaymentReceiptCreated && (
                <>
                  {[
                    [translationsKey.receipt_number, translationsKey.receipt_number_value],
                    [translationsKey.payment_date, translationsKey.payment_date_value],
                    [translationsKey.payment_method, translationsKey.payment_method_value],
                    [translationsKey.amount_paid, translationsKey.amount_paid_value],
                  ].map(([label, value]) => (
                    <div className="flex w-full items-center justify-between" key={label}>
                      <Typography variant="caption">
                        {translateWithContextualLocal(label as string)}
                      </Typography>
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal(value as string)}
                      </Typography>
                    </div>
                  ))}

                  <div className="mt-6 flex w-full items-center justify-between">
                    <Typography variant="caption" color="grey700">
                      {translateWithContextualLocal('text_6419c64eace749372fc72b3c')}
                    </Typography>
                    <Typography variant="caption" color="grey700">
                      {translateWithContextualLocal('text_6419c64eace749372fc72b3e')}
                    </Typography>
                  </div>

                  {['INV-001-001', 'INV-001-002', 'INV-001-003', 'INV-001-004'].map((invoice) => (
                    <div className="flex w-full items-center justify-between" key={invoice}>
                      <Typography variant="caption">{invoice}</Typography>
                      <Typography variant="caption" color="grey700">
                        $730,00
                      </Typography>
                    </div>
                  ))}
                </>
              )}

              {translationsKey.invoice_number && translationsKey.invoice_number_value && (
                <div className="flex w-full items-center justify-between">
                  <Typography variant="caption">
                    {translateWithContextualLocal(translationsKey.invoice_number)}
                  </Typography>
                  <Typography variant="caption" color="grey700">
                    {translateWithContextualLocal(translationsKey.invoice_number_value)}
                  </Typography>
                </div>
              )}

              {translationsKey.issue_date && translationsKey.issue_date_value && (
                <div className="flex w-full items-center justify-between">
                  <Typography variant="caption">
                    {translateWithContextualLocal(translationsKey.issue_date)}
                  </Typography>
                  <Typography variant="caption" color="grey700">
                    {translateWithContextualLocal(translationsKey.issue_date_value)}
                  </Typography>
                </div>
              )}
            </div>

            {!disablePdfGeneration && (
              <>
                <div className="my-6 h-px w-full bg-grey-300" />

                {type === BillingEntityEmailSettingsEnum.PaymentReceiptCreated ? (
                  <div className="flex flex-row items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Icon name="arrow-bottom" color="primary" />
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal('text_17413343926225ug14ak60xv')}
                      </Typography>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon name="arrow-bottom" color="primary" />
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal('text_1741334392622fl3ozwejrul')}
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row items-center gap-2">
                    <Icon name="arrow-bottom" color="primary" />
                    <Typography variant="caption" color="grey700">
                      {translateWithContextualLocal('text_64188b3d9735d5007d712274')}
                    </Typography>
                  </div>
                )}
              </>
            )}

            <div className="my-6 h-px w-full bg-grey-300" />
            <Typography className="text-center" variant="caption">
              <span className="mr-1">
                {translateWithContextualLocal('text_64188b3d9735d5007d712276')}
              </span>
              <span className="text-blue-600">billing@user_email.com</span>
            </Typography>
          </>
        )}
      </div>
    </PreviewEmailLayout>
  )
}

export default EmailPreview
