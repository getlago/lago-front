import { useStore } from '@tanstack/react-form'

import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import type { WalletFreeAndPaidSlice } from './walletFormSchema'

const DEFAULTS: WalletFreeAndPaidSlice = {
  freeCredits: '',
  paidCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
}

export const WALLET_FREE_PAID_METADATA_ROW_TEST_ID = 'wallet-free-paid-metadata-row'
export const WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID = 'wallet-free-paid-metadata-add-button'
export const WALLET_FREE_PAID_METADATA_DELETE_BUTTON_TEST_ID =
  'wallet-free-paid-metadata-delete-button'
export const WALLET_FREE_PAID_INVOICE_SWITCH_TEST_ID = 'wallet-free-paid-invoice-switch'

const MetadataRows = withForm({
  defaultValues: DEFAULTS,
  render: function Render({ form }) {
    const { translate } = useInternationalization()
    const metadata = useStore(form.store, (state) => state.values.metadata || [])

    const addMetadata = () => {
      form.pushFieldValue('metadata', { key: '', value: '' })
    }

    const removeMetadata = (index: number) => {
      form.removeFieldValue('metadata', index)
    }

    return (
      <div className="flex flex-col gap-4">
        {metadata.map((_row, index) => (
          <div
            key={index}
            className="flex items-start gap-3"
            data-test={WALLET_FREE_PAID_METADATA_ROW_TEST_ID}
          >
            <form.AppField name={`metadata[${index}].key`}>
              {(field) => (
                <field.TextInputField
                  className="flex-1"
                  label={translate('text_63fcc3218d35b9377840f5a3')}
                  placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                />
              )}
            </form.AppField>
            <form.AppField name={`metadata[${index}].value`}>
              {(field) => (
                <field.TextInputField
                  className="flex-1"
                  label={translate('text_63fcc3218d35b9377840f5ab')}
                  placeholder={translate('text_63fcc3218d35b9377840f5af')}
                />
              )}
            </form.AppField>
            <Tooltip
              className="mt-7"
              placement="top-end"
              title={translate('text_63fcc3218d35b9377840f5e1')}
            >
              <Button
                data-test={WALLET_FREE_PAID_METADATA_DELETE_BUTTON_TEST_ID}
                icon="trash"
                variant="quaternary"
                onClick={() => removeMetadata(index)}
              />
            </Tooltip>
          </div>
        ))}

        <Button
          data-test={WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID}
          className="self-start"
          startIcon="plus"
          variant="inline"
          onClick={addMetadata}
        >
          {translate('text_63fcc3218d35b9377840f5bb')}
        </Button>
      </div>
    )
  },
})

export const WalletFreeAndPaidCreditsFields = withForm({
  defaultValues: DEFAULTS,
  props: {
    currency: CurrencyEnum.Usd as CurrencyEnum,
    rateAmount: '1',
    walletName: '',
  },
  render: function Render({ form, currency, rateAmount, walletName }) {
    const { translate } = useInternationalization()
    const rateLabel = intlFormatNumber(Number(rateAmount || 0), { currency })
    const toCurrency = (credits: string) =>
      intlFormatNumber(Number(credits || 0) * Number(rateAmount || 0), { currency })

    return (
      <div className="flex flex-col gap-8">
        <CenteredPage.PageTitle
          title={translate('text_1783352692385e6ttj3xne6k')}
          description={translate('text_17833526923856caxxme9l8x')}
        />

        {/* Read-only wallet summary */}
        <div className="flex flex-col gap-3 border-b border-grey-200 pb-8">
          <Typography variant="subhead1">{translate('text_17833526923863j848qxkffb')}</Typography>
          <div className="flex gap-8">
            <div>
              <Typography variant="caption" color="grey600">
                {translate('text_62d18855b22699e5cf55f875')}
              </Typography>
              <Typography variant="body" color="grey700">
                {walletName || '-'}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="grey600">
                {translate('text_62d18855b22699e5cf55f879')}
              </Typography>
              <Typography variant="body" color="grey700">{`1 = ${rateLabel}`}</Typography>
            </div>
          </div>
        </div>

        <form.AppField name="paidCredits">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['positiveNumber', 'decimal']}
              label={translate('text_62e79671d23ae6ff149de944')}
              helperText={translate('text_62d18855b22699e5cf55f88b', {
                paidCredits: toCurrency(String(field.state.value)),
              })}
              InputProps={{
                endAdornment: (
                  <Typography className="mr-4" variant="body" color="textSecondary">
                    {translate('text_62d18855b22699e5cf55f889')}
                  </Typography>
                ),
              }}
            />
          )}
        </form.AppField>

        <form.AppField name="freeCredits">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['positiveNumber', 'decimal']}
              label={translate('text_62e79671d23ae6ff149de954')}
              helperText={translate('text_62d18855b22699e5cf55f893', {
                grantedCredits: toCurrency(String(field.state.value)),
              })}
              InputProps={{
                endAdornment: (
                  <Typography className="mr-4" variant="body" color="textSecondary">
                    {translate('text_62d18855b22699e5cf55f889')}
                  </Typography>
                ),
              }}
            />
          )}
        </form.AppField>

        <form.AppField name="invoiceRequiresSuccessfulPayment">
          {(field) => (
            <field.SwitchField
              dataTest={WALLET_FREE_PAID_INVOICE_SWITCH_TEST_ID}
              label={translate('text_66a8aed1c3e07b277ec3990d')}
              subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
            />
          )}
        </form.AppField>

        {/* Metadata accordion — minimal key/value rows editor over the metadata slice. */}
        <Accordion
          summary={
            <Typography variant="bodyHl" color="grey700">
              {translate('text_63fcc3218d35b9377840f59b')}
            </Typography>
          }
        >
          <MetadataRows form={form} />
        </Accordion>
      </div>
    )
  },
})
