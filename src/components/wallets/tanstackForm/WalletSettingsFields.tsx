import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { MenuPopper } from '~/styles'

import { itemToSettings, type WalletSettingsSlice } from './walletFormSchema'

const DEFAULTS: WalletSettingsSlice = itemToSettings(makeEmptyWalletItem(''))

export const WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID = 'wallet-settings-expiration-add-button'
export const WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID = 'wallet-settings-expiration-section'
export const WALLET_SETTINGS_EXPIRATION_DELETE_BUTTON_TEST_ID =
  'wallet-settings-expiration-delete-button'
export const WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID = 'wallet-settings-min-max-add-button'
export const WALLET_SETTINGS_MIN_OPTION_TEST_ID = 'wallet-settings-min-option'
export const WALLET_SETTINGS_MAX_OPTION_TEST_ID = 'wallet-settings-max-option'
export const WALLET_SETTINGS_MIN_SECTION_TEST_ID = 'wallet-settings-min-section'
export const WALLET_SETTINGS_MAX_SECTION_TEST_ID = 'wallet-settings-max-section'
export const WALLET_SETTINGS_MIN_DELETE_BUTTON_TEST_ID = 'wallet-settings-min-delete-button'
export const WALLET_SETTINGS_MAX_DELETE_BUTTON_TEST_ID = 'wallet-settings-max-delete-button'
export const WALLET_SETTINGS_PO_ADD_BUTTON_TEST_ID = 'wallet-settings-po-add-button'
export const WALLET_SETTINGS_PO_SECTION_TEST_ID = 'wallet-settings-po-section'
export const WALLET_SETTINGS_PO_DELETE_BUTTON_TEST_ID = 'wallet-settings-po-delete-button'

export const WalletSettingsFields = withForm({
  defaultValues: DEFAULTS,
  props: {
    lockedCurrency: CurrencyEnum.Usd as CurrencyEnum,
    initialValues: DEFAULTS,
  },
  render: function Render({ form, lockedCurrency, initialValues }) {
    const { translate } = useInternationalization()
    const [showExpiration, setShowExpiration] = useState(!!initialValues.expirationAt)
    const [showMin, setShowMin] = useState(!!initialValues.paidTopUpMinAmountCents)
    const [showMax, setShowMax] = useState(!!initialValues.paidTopUpMaxAmountCents)
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1748422458559n8iqcz37i2z')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_17484224585596yw31vih46t')}
            </Typography>
          </div>
          {showExpiration ? (
            <div
              className="flex items-end gap-3 [&>*:first-child]:flex-1"
              data-test={WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID}
            >
              <form.AppField name="expirationAt">
                {(field) => (
                  <field.DatePickerField
                    disablePast
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
                  data-test={WALLET_SETTINGS_EXPIRATION_DELETE_BUTTON_TEST_ID}
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
            <Button
              data-test={WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID}
              className="self-start"
              startIcon="plus"
              variant="inline"
              onClick={() => setShowExpiration(true)}
            >
              {translate('text_6560809c38fb9de88d8a517e')}
            </Button>
          )}
        </div>

        {/* Min/max per transaction (independent toggles via dropdown menu) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1758285686646sieyihhzwak')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1758285686646xkeaxyajfp7')}
            </Typography>
          </div>

          {showMin && (
            <div
              className="flex items-end gap-3 [&>*:first-child]:flex-1"
              data-test={WALLET_SETTINGS_MIN_SECTION_TEST_ID}
            >
              <form.AppField name="paidTopUpMinAmountCents">
                {(field) => (
                  <field.AmountInputField
                    currency={lockedCurrency}
                    beforeChangeFormatter={['positiveNumber']}
                    label={translate('text_1758286730208kztcznofxvr')}
                  />
                )}
              </form.AppField>
              <Tooltip
                className="mb-1 h-fit"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  data-test={WALLET_SETTINGS_MIN_DELETE_BUTTON_TEST_ID}
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('paidTopUpMinAmountCents', '')
                    setShowMin(false)
                  }}
                />
              </Tooltip>
            </div>
          )}

          {showMax && (
            <div
              className="flex items-end gap-3 [&>*:first-child]:flex-1"
              data-test={WALLET_SETTINGS_MAX_SECTION_TEST_ID}
            >
              <form.AppField name="paidTopUpMaxAmountCents">
                {(field) => (
                  <field.AmountInputField
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
                  data-test={WALLET_SETTINGS_MAX_DELETE_BUTTON_TEST_ID}
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('paidTopUpMaxAmountCents', '')
                    setShowMax(false)
                  }}
                />
              </Tooltip>
            </div>
          )}

          <Popper
            PopperProps={{ placement: 'bottom-start' }}
            opener={
              <Button
                className="self-start"
                startIcon="plus"
                endIcon="chevron-down-filled"
                variant="inline"
                data-test={WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID}
                disabled={showMin && showMax}
              >
                {translate('text_17582856866461p9g3nsnrgc')}
              </Button>
            }
            minWidth={0}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <div className="flex flex-col">
                  <Button
                    variant="quaternary"
                    data-test={WALLET_SETTINGS_MIN_OPTION_TEST_ID}
                    disabled={showMin}
                    onClick={() => {
                      if (form.getFieldValue('paidTopUpMinAmountCents') === null) {
                        form.setFieldValue('paidTopUpMinAmountCents', '')
                      }
                      setShowMin(true)
                      closePopper()
                    }}
                  >
                    {translate('text_1758285847805xn6hdyurz3e')}
                  </Button>
                  <Button
                    variant="quaternary"
                    data-test={WALLET_SETTINGS_MAX_OPTION_TEST_ID}
                    disabled={showMax}
                    onClick={() => {
                      if (form.getFieldValue('paidTopUpMaxAmountCents') === null) {
                        form.setFieldValue('paidTopUpMaxAmountCents', '')
                      }
                      setShowMax(true)
                      closePopper()
                    }}
                  >
                    {translate('text_1758285847805k1uohu4vrov')}
                  </Button>
                </div>
              </MenuPopper>
            )}
          </Popper>
        </div>

        {/* Purchase order number (toggle) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1783352692386p9bls6f0o76')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1784552920236s8nbmvhxn9i')}
            </Typography>
          </div>
          {showPO ? (
            <div
              className="flex items-end gap-3 [&>*:first-child]:flex-1"
              data-test={WALLET_SETTINGS_PO_SECTION_TEST_ID}
            >
              <form.AppField name="purchaseOrderNumber">
                {(field) => <field.TextInputField />}
              </form.AppField>
              <Tooltip
                className="mb-1 h-fit"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  data-test={WALLET_SETTINGS_PO_DELETE_BUTTON_TEST_ID}
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('purchaseOrderNumber', '')
                    setShowPO(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <Button
              data-test={WALLET_SETTINGS_PO_ADD_BUTTON_TEST_ID}
              className="self-start"
              startIcon="plus"
              variant="inline"
              onClick={() => {
                if (form.getFieldValue('purchaseOrderNumber') === null) {
                  form.setFieldValue('purchaseOrderNumber', '')
                }
                setShowPO(true)
              }}
            >
              {translate('text_1783352692386valktkog1dw')}
            </Button>
          )}
        </div>
      </div>
    )
  },
})
