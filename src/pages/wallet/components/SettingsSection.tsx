import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { Alert, Chip } from 'lago-design-system'
import { DateTime } from 'luxon'
import { FC, useMemo, useState } from 'react'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import {
  AmountInputField,
  ComboBox,
  ComboBoxField,
  DatePickerField,
  TextInput,
  TextInputField,
} from '~/components/form'
import {
  dateErrorCodes,
  FORM_TYPE_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, FeeTypesEnum, GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TWalletDataForm } from '~/pages/wallet/types'
import { tw } from '~/styles/utils'

interface SettingsSectionProps {
  formikProps: FormikProps<TWalletDataForm>
  customerData?: GetCustomerInfosForWalletFormQuery
  showExpirationDate: boolean
  setShowExpirationDate: (value: boolean) => void
  formType: keyof typeof FORM_TYPE_ENUM
}

type AvailableFeeTypes = FeeTypesEnum.Charge | FeeTypesEnum.Commitment | FeeTypesEnum.Subscription

const availableFeeTypesTranslation: Record<AvailableFeeTypes, string> = {
  [FeeTypesEnum.Charge]: 'text_1748441354191rj96qhw3twa',
  [FeeTypesEnum.Commitment]: 'text_1748441354191cnp0tm4ubf0',
  [FeeTypesEnum.Subscription]: 'text_6630e3210c13c500cd398ea2',
}

export const SettingsSection: FC<SettingsSectionProps> = ({
  formikProps,
  formType,
  customerData,
  showExpirationDate,
  setShowExpirationDate,
}) => {
  const { translate } = useInternationalization()
  const [showLimitInput, setShowLimitInput] = useState(false)

  const comboboxFeeTypesData = useMemo(() => {
    return [
      {
        label: translate(availableFeeTypesTranslation[FeeTypesEnum.Charge]),
        value: FeeTypesEnum.Charge,
        disabled: formikProps.values.appliesTo?.feeTypes?.includes(FeeTypesEnum.Charge) ?? false,
      },
      {
        label: translate(availableFeeTypesTranslation[FeeTypesEnum.Commitment]),
        value: FeeTypesEnum.Commitment,
        disabled:
          formikProps.values.appliesTo?.feeTypes?.includes(FeeTypesEnum.Commitment) ?? false,
      },
      {
        label: translate(availableFeeTypesTranslation[FeeTypesEnum.Subscription]),
        value: FeeTypesEnum.Subscription,
        disabled:
          formikProps.values.appliesTo?.feeTypes?.includes(FeeTypesEnum.Subscription) ?? false,
      },
    ]
  }, [formikProps.values.appliesTo?.feeTypes, translate])

  const hasSelectedAllFeeTypes = useMemo(
    () =>
      formikProps.values.appliesTo?.feeTypes?.length ===
      Object.keys(availableFeeTypesTranslation).length,
    [formikProps.values.appliesTo?.feeTypes?.length],
  )

  return (
    <section className="flex flex-col gap-6 pb-12 shadow-b">
      <div className="flex flex-col gap-1">
        <Typography variant="subhead">{translate('text_6560809c38fb9de88d8a5090')}</Typography>
        <Typography variant="caption">{translate('text_1741101676181hja4m79j7qz')}</Typography>
      </div>

      <TextInputField
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        name="name"
        label={translate('text_62d18855b22699e5cf55f875')}
        placeholder={translate('text_62d18855b22699e5cf55f877')}
        formikProps={formikProps}
      />

      <div
        className={tw('grid grid-cols-[48px_48px_1fr_120px] items-end gap-3', {
          'grid-cols-[48px_48px_minmax(160px,1fr)]': !!customerData?.customer?.currency,
        })}
      >
        <TextInput
          value="1"
          label={translate('text_62d18855b22699e5cf55f879')}
          disabled={true}
          className="[&_input]:text-center"
        />
        <TextInput value="=" disabled={true} className="[&_input]:text-center" />
        <AmountInputField
          name="rateAmount"
          disabled={formType === FORM_TYPE_ENUM.edition}
          currency={formikProps.values.currency}
          beforeChangeFormatter={['positiveNumber']}
          label={translate('text_62d18855b22699e5cf55f87d')}
          formikProps={formikProps}
          InputProps={{
            endAdornment: !!customerData?.customer?.currency && (
              <InputAdornment position="end">
                {getCurrencySymbol(customerData?.customer?.currency)}
              </InputAdornment>
            ),
          }}
        />
        {!customerData?.customer?.currency && (
          <ComboBoxField
            disableClearable
            name="currency"
            data={Object.values(CurrencyEnum).map((currencyType) => ({
              value: currencyType,
            }))}
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
          />
        )}
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
            <DatePickerField
              className="grow"
              disablePast
              name="expirationAt"
              placement="top-end"
              placeholder={translate('text_62cd78ea9bff25e3391b243d')}
              formikProps={formikProps}
              error={
                formikProps.errors.expirationAt === dateErrorCodes.shouldBeInFuture
                  ? translate('text_630ccd87b251590eaa5f9831', {
                      date: DateTime.now().toFormat('LLL. dd, yyyy'),
                    })
                  : undefined
              }
            />
            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  formikProps.setFieldValue('expirationAt', null)
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
            data-test="show-expiration-at"
          >
            {translate('text_6560809c38fb9de88d8a517e')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_17484224585599hnm61rdb6d')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_17484378349895wl4yqkmqj9')}
          </Typography>
        </div>

        {!!formikProps.values.appliesTo?.feeTypes?.length && (
          <div className="flex flex-wrap items-center gap-3">
            {formikProps.values.appliesTo?.feeTypes?.map((feeType) => {
              const feeTypeTranslation = availableFeeTypesTranslation[feeType as AvailableFeeTypes]

              return (
                <Chip
                  key={feeType}
                  label={translate(feeTypeTranslation)}
                  onDelete={() => {
                    formikProps.setFieldValue('appliesTo', {
                      feeTypes: formikProps.values.appliesTo?.feeTypes?.filter(
                        (ft) => ft !== feeType,
                      ),
                    })
                  }}
                />
              )
            })}
          </div>
        )}

        {hasSelectedAllFeeTypes && (
          <Alert type="info">{translate('text_17484418620700x4nxxdfenm')}</Alert>
        )}

        {showLimitInput ? (
          <div className="flex items-center gap-4">
            <ComboBox
              containerClassName="flex-1"
              className={SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME}
              placeholder={translate('text_17484381918689r63e54hrh1')}
              data={comboboxFeeTypesData}
              onChange={(value: string) => {
                const newFeeTypes = [...(formikProps.values.appliesTo?.feeTypes ?? [])]

                if (value === '') {
                  formikProps.setFieldValue('appliesTo', {
                    feeTypes: [],
                  })
                } else if (newFeeTypes.includes(value as FeeTypesEnum)) {
                  formikProps.setFieldValue('appliesTo', {
                    feeTypes: newFeeTypes.filter((feeType) => feeType !== value),
                  })
                } else {
                  formikProps.setFieldValue('appliesTo', {
                    feeTypes: [...newFeeTypes, value as FeeTypesEnum],
                  })
                }
                setShowLimitInput(false)
              }}
            />
            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  setShowLimitInput(false)
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <Button
            className="self-start"
            startIcon="plus"
            variant="inline"
            disabled={hasSelectedAllFeeTypes}
            onClick={() => {
              setShowLimitInput(true)

              setTimeout(() => {
                const element = document.querySelector(
                  `.${SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                ) as HTMLElement

                if (!element) return

                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.click()
              }, 0)
            }}
            data-test="show-limit-input"
          >
            {translate('text_1748442650797pz30j2eeiv4')}
          </Button>
        )}
      </div>
    </section>
  )
}
