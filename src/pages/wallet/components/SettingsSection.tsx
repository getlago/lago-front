import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import {
  ADD_MAX_TOPUP_OPTION_DATA_TEST,
  ADD_MIN_MAX_AMOUNT_DATA_TEST,
  ADD_MIN_TOPUP_OPTION_DATA_TEST,
  SHOW_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { intlFormatDateTime } from '~/core/timezone'
import { FeatureFlagEnum, GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import {
  WALLET_PRIORITY_MAX,
  WALLET_PRIORITY_MIN,
} from '~/pages/wallet/formInitialization/validationSchema'
import { emptyWalletFormDefaultValues } from '~/pages/wallet/mappers/mapFromApiToForm'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

interface SettingsSectionExtraProps {
  customerData?: GetCustomerInfosForWalletFormQuery
  showExpirationDate: boolean
  setShowExpirationDate: (value: boolean) => void
  formType: keyof typeof FORM_TYPE_ENUM
  showMinTopUp: boolean
  setShowMinTopUp: (value: boolean) => void
  showMaxTopUp: boolean
  setShowMaxTopUp: (value: boolean) => void
}

const settingsSectionDefaultProps: SettingsSectionExtraProps = {
  customerData: undefined,
  showExpirationDate: false,
  setShowExpirationDate: () => {},
  formType: FORM_TYPE_ENUM.creation,
  showMinTopUp: false,
  setShowMinTopUp: () => {},
  showMaxTopUp: false,
  setShowMaxTopUp: () => {},
}

export const SettingsSection = withForm({
  defaultValues: emptyWalletFormDefaultValues(),
  props: settingsSectionDefaultProps,
  render: function SettingsSectionRender({
    form,
    formType,
    customerData,
    showExpirationDate,
    setShowExpirationDate,
    showMinTopUp,
    setShowMinTopUp,
    showMaxTopUp,
    setShowMaxTopUp,
  }) {
    const { translate } = useInternationalization()
    const { hasFeatureFlag } = useOrganizationInfos()
    const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)
    const showCurrencyDropdown = hasMultiCurrency || !customerData?.customer?.currency

    const currency = useStore(form.store, (state) => state.values.currency)
    // The credit-rate row is bottom-aligned: when the rateAmount error text
    // shows up, compensate its siblings so the inputs stay level.
    const rateAmountHasError = useStore(
      form.store,
      (state) => (state.fieldMeta.rateAmount?.errors?.length ?? 0) > 0,
    )

    return (
      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1">{translate('text_6560809c38fb9de88d8a5090')}</Typography>
          <Typography variant="caption">{translate('text_1741101676181hja4m79j7qz')}</Typography>
        </div>

        <form.AppField name="billingEntityId">
          {(field) => (
            <BillingEntityFormPicker
              label={translate('text_1743611497157teaa1zu8l24')}
              value={field.state.value}
              onChange={(id) => field.handleChange(id)}
              helperText={translate('text_17800541562349k15h7ik07c')}
            />
          )}
        </form.AppField>

        <form.AppField name="name">
          {(field) => (
            <field.TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              label={translate('text_62d18855b22699e5cf55f875')}
              placeholder={translate('text_62d18855b22699e5cf55f877')}
            />
          )}
        </form.AppField>

        <div
          className={tw('grid grid-cols-[48px_48px_1fr_120px] items-end gap-3', {
            'grid-cols-[48px_48px_minmax(160px,1fr)]': !showCurrencyDropdown,
          })}
        >
          <TextInput
            value="1"
            label={translate('text_62d18855b22699e5cf55f879')}
            disabled={true}
            className={tw('[&_input]:text-center', { 'mb-7': rateAmountHasError })}
          />
          <TextInput
            value="="
            disabled={true}
            className={tw('[&_input]:text-center', { 'mb-7': rateAmountHasError })}
          />
          <form.AppField name="rateAmount">
            {(field) => (
              <field.AmountInputField
                disabled={formType === FORM_TYPE_ENUM.edition}
                currency={currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_62d18855b22699e5cf55f87d')}
                InputProps={{
                  endAdornment: !showCurrencyDropdown && !!customerData?.customer?.currency && (
                    <InputAdornment position="end">
                      {getCurrencySymbol(customerData.customer.currency)}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </form.AppField>
          {showCurrencyDropdown && (
            <form.AppField name="currency">
              {(field) => (
                <field.CurrencyPickerField
                  className={tw({ 'mb-7': rateAmountHasError })}
                  disabled={formType === FORM_TYPE_ENUM.edition}
                />
              )}
            </form.AppField>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1755697949545w7vb1hox4n5')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_175569794954699gxpjhn4fe')}
            </Typography>
          </div>

          <form.AppField name="priority">
            {(field) => (
              <field.TextInputField
                beforeChangeFormatter={['positiveNumber', 'int']}
                placeholder={translate('text_1755697949546zuqgeved2ma')}
                errorOverride={
                  field.state.meta.errors.length > 0
                    ? translate('text_1784022064201xi14v3sglp1', {
                        min: WALLET_PRIORITY_MIN,
                        max: WALLET_PRIORITY_MAX,
                      })
                    : undefined
                }
              />
            )}
          </form.AppField>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1748422458559n8iqcz37i2z')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_17484224585596yw31vih46t')}
            </Typography>
          </div>
          {showExpirationDate ? (
            <div className="flex items-center gap-4">
              <form.AppField name="expirationAt">
                {(field) => (
                  <field.DatePickerField
                    className="grow"
                    disablePast
                    placement="top-end"
                    placeholder={translate('text_62cd78ea9bff25e3391b243d')}
                    errorOverride={
                      (field.state.meta.errors as unknown as { message?: string }[]).some(
                        (error) => error?.message === dateErrorCodes.shouldBeInFuture,
                      )
                        ? translate('text_630ccd87b251590eaa5f9831', {
                            date: intlFormatDateTime(DateTime.now().toISO() || '').date,
                          })
                        : false
                    }
                  />
                )}
              </form.AppField>
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('expirationAt', null)
                    setShowExpirationDate(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <Button
              className="self-start"
              startIcon="plus"
              variant="inline"
              onClick={() => setShowExpirationDate(true)}
              data-test={SHOW_EXPIRATION_AT_DATA_TEST}
            >
              {translate('text_6560809c38fb9de88d8a517e')}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1758285686646sieyihhzwak')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1758285686646xkeaxyajfp7')}
            </Typography>
          </div>

          {(
            [
              {
                enabled: showMinTopUp,
                name: 'paidTopUpMinAmountCents',
                label: translate('text_1758286730208kztcznofxvr'),
                onDelete: () => {
                  form.setFieldValue('paidTopUpMinAmountCents', undefined)

                  setShowMinTopUp(false)
                },
                errorLabel: translate('text_175872290080132j1em37b08'),
              },
              {
                enabled: showMaxTopUp,
                name: 'paidTopUpMaxAmountCents',
                label: translate('text_1758286730208ey87jz8nzuz'),
                onDelete: () => {
                  form.setFieldValue('paidTopUpMaxAmountCents', undefined)

                  setShowMaxTopUp(false)
                },
                errorLabel: translate('text_1758722900801nbox9c5bgnn'),
              },
            ] as const
          )
            .filter((input) => !!input.enabled)
            .map((input) => (
              <form.AppField key={`wallet-settings-min-max-input-${input.name}`} name={input.name}>
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0

                  return (
                    <div className="flex items-center gap-4">
                      <field.AmountInputField
                        className="grow"
                        currency={currency}
                        beforeChangeFormatter={['positiveNumber']}
                        label={input.label}
                        errorOverride={hasError ? input.errorLabel : false}
                        InputProps={{
                          endAdornment: !!customerData?.customer?.currency && (
                            <InputAdornment position="end">
                              {getCurrencySymbol(customerData?.customer?.currency)}
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Tooltip
                        className={tw({ 'mt-6': !hasError })}
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            input.onDelete()
                          }}
                        />
                      </Tooltip>
                    </div>
                  )
                }}
              </form.AppField>
            ))}

          <Popper
            PopperProps={{ placement: 'bottom-start' }}
            opener={
              <Button
                className="self-start"
                startIcon="plus"
                endIcon="chevron-down-filled"
                variant="inline"
                data-test={ADD_MIN_MAX_AMOUNT_DATA_TEST}
                disabled={showMinTopUp && showMaxTopUp}
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
                    onClick={() => {
                      setShowMinTopUp(true)
                      closePopper()
                    }}
                    disabled={showMinTopUp}
                    data-test={ADD_MIN_TOPUP_OPTION_DATA_TEST}
                  >
                    {translate('text_1758285847805xn6hdyurz3e')}
                  </Button>
                  <Button
                    variant="quaternary"
                    onClick={() => {
                      setShowMaxTopUp(true)
                      closePopper()
                    }}
                    disabled={showMaxTopUp}
                    data-test={ADD_MAX_TOPUP_OPTION_DATA_TEST}
                  >
                    {translate('text_1758285847805k1uohu4vrov')}
                  </Button>
                </div>
              </MenuPopper>
            )}
          </Popper>
        </div>
      </section>
    )
  },
})
