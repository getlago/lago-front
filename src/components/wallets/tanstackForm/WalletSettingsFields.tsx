import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { itemToSettings, type WalletSettingsSlice } from './walletFormSchema'

const DEFAULTS: WalletSettingsSlice = itemToSettings(makeEmptyWalletItem(''))

export const WalletSettingsFields = withForm({
  defaultValues: DEFAULTS,
  props: {
    lockedCurrency: CurrencyEnum.Usd as CurrencyEnum,
    initialValues: DEFAULTS,
  },
  render: function Render({ form, lockedCurrency, initialValues }) {
    const { translate } = useInternationalization()
    const [showExpiration, setShowExpiration] = useState(!!initialValues.expirationAt)
    const [showMinMax, setShowMinMax] = useState(
      !!initialValues.paidTopUpMinAmountCents || !!initialValues.paidTopUpMaxAmountCents,
    )
    const [showPO, setShowPO] = useState(!!initialValues.purchaseOrderNumber)

    return (
      <div className="flex flex-col gap-6">
        <CenteredPage.PageTitle
          title={translate('text_17833526923851igosmn1oar')}
          description={translate('text_1783352692385hz7bj9un6gr')}
        />

        <form.AppField name="name">
          {(field) => (
            <field.TextInputField
              label={translate('text_62d18855b22699e5cf55f875')}
              placeholder={translate('text_62d18855b22699e5cf55f877')}
            />
          )}
        </form.AppField>

        {/* Conversion rate: 1 [=] <rate> <currency (locked)> */}
        <div>
          <Typography variant="captionHl" color="grey700" className="mb-1">
            {translate('text_62d18855b22699e5cf55f879')}
          </Typography>
          <div className="flex items-end gap-3">
            <div className="flex size-14 items-center justify-center rounded-xl bg-grey-100">
              <Typography variant="body">1</Typography>
            </div>
            <div className="flex size-14 items-center justify-center rounded-xl bg-grey-100">
              <Typography variant="body">=</Typography>
            </div>
            <form.AppField name="rateAmount">
              {(field) => (
                <field.AmountInputField
                  className="flex-1"
                  currency={lockedCurrency}
                  beforeChangeFormatter={['positiveNumber']}
                  label={translate('text_62d18855b22699e5cf55f87d')}
                />
              )}
            </form.AppField>
            {/* Currency is locked and not part of WalletSettingsSlice — plain disabled display. */}
            <TextInput value={lockedCurrency} disabled className="w-30 [&_input]:text-center" />
          </div>
        </div>

        <form.AppField name="priority">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['positiveNumber', 'int']}
              label={translate('text_1755697949545w7vb1hox4n5')}
              helperText={translate('text_175569794954699gxpjhn4fe')}
            />
          )}
        </form.AppField>

        {/* Expiration date (toggle) */}
        {showExpiration ? (
          <div className="flex items-end gap-3 [&>*:first-child]:flex-1">
            <form.AppField name="expirationAt">
              {(field) => (
                <field.DatePickerField
                  disablePast
                  label={translate('text_1748422458559n8iqcz37i2z')}
                  placeholder={translate('text_62cd78ea9bff25e3391b243d')}
                />
              )}
            </form.AppField>
            <Tooltip
              className="mb-1 h-fit"
              placement="top-end"
              title={translate('text_63aa085d28b8510cd46443ff')}
            >
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  form.setFieldValue('expirationAt', null)
                  setShowExpiration(false)
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <Button startIcon="plus" variant="inline" onClick={() => setShowExpiration(true)}>
            {translate('text_6560809c38fb9de88d8a517e')}
          </Button>
        )}

        {/* Min/max per transaction (toggle) */}
        {showMinMax ? (
          <div className="flex gap-3">
            <form.AppField name="paidTopUpMinAmountCents">
              {(field) => (
                <field.AmountInputField
                  className="flex-1"
                  currency={lockedCurrency}
                  beforeChangeFormatter={['positiveNumber']}
                  label={translate('text_1758286730208kztcznofxvr')}
                />
              )}
            </form.AppField>
            <form.AppField name="paidTopUpMaxAmountCents">
              {(field) => (
                <field.AmountInputField
                  className="flex-1"
                  currency={lockedCurrency}
                  beforeChangeFormatter={['positiveNumber']}
                  label={translate('text_1758286730208ey87jz8nzuz')}
                />
              )}
            </form.AppField>
            <Tooltip
              className="mb-1 h-fit"
              placement="top-end"
              title={translate('text_63aa085d28b8510cd46443ff')}
            >
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  form.setFieldValue('paidTopUpMinAmountCents', null)
                  form.setFieldValue('paidTopUpMaxAmountCents', null)
                  setShowMinMax(false)
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <Button startIcon="plus" variant="inline" onClick={() => setShowMinMax(true)}>
            {translate('text_17582856866461p9g3nsnrgc')}
          </Button>
        )}

        {/* Purchase order number (toggle) */}
        {showPO ? (
          <div className="flex items-end gap-3 [&>*:first-child]:flex-1">
            <form.AppField name="purchaseOrderNumber">
              {(field) => (
                <field.TextInputField label={translate('text_1783352692386p9bls6f0o76')} />
              )}
            </form.AppField>
            <Tooltip
              className="mb-1 h-fit"
              placement="top-end"
              title={translate('text_63aa085d28b8510cd46443ff')}
            >
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  form.setFieldValue('purchaseOrderNumber', null)
                  setShowPO(false)
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <Button startIcon="plus" variant="inline" onClick={() => setShowPO(true)}>
            {translate('text_1783352692386valktkog1dw')}
          </Button>
        )}
      </div>
    )
  },
})
