import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { AlertNameAndCodeSection } from '~/components/alerts/AlertNameAndCodeSection'
import AlertThresholds from '~/components/alerts/Thresholds'
import { createThresholdSetters, getThresholdCodeErrorsFromForm } from '~/components/alerts/utils'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { defineNewBeforeChangeFormatter } from '~/components/form/AmountInput/formatting'
import { formatValue } from '~/components/form/TextInput/formatValue'
import { getDisplayName } from '~/components/invoices/productCatalog/formatInvoiceProductFees'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { buildProductsComboboxData } from '~/components/products/buildProductsComboboxData'
import { EMPTY_SCOPE_ENTRY } from '~/components/scope/scopeEntry'
import { ScopeRow } from '~/components/scope/ScopeRow'
import { isZodErrors } from '~/core/form/isZodErrors'
import { ContractAlertTypeEnum, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  ContractScopeOptions,
  getLockedWithProductFilters,
  isFilterDisabled,
  isProductDisabled,
  isWholeContractTaken,
  PRODUCT_SCOPE_TYPE,
} from './alertScope'
import { CONTRACT_ALERT_FORM_DEFAULTS } from './validationSchema'

export const CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID = 'contract-alert-drawer-alert-type'
export const CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID = 'contract-alert-drawer-add-scope'
export const CONTRACT_ALERT_DRAWER_SCOPE_ERROR_TEST_ID = 'contract-alert-drawer-scope-error'
export const CONTRACT_ALERT_DRAWER_SKELETON_TEST_ID = 'contract-alert-drawer-skeleton'

const MAX_THRESHOLDS = 20
const SETTINGS_DESCRIPTION_KEY = 'text_17957785996159r1uxvrhlad'
const RECURRING_SWITCH_SUB_LABEL_KEY = 'text_1795778599616e66l28kno3y'
const THRESHOLD_CODE_PLACEHOLDER_KEY = 'text_623b42ff8ee4e000ba87d0c4'

type ContractAlertDrawerContentProps = {
  isEdition: boolean
  currency: CurrencyEnum
  isDataReady: boolean
  scopeOptions: ContractScopeOptions
  takenScopeKeys: Set<string>
}

const contractAlertDrawerContentDefaultProps: ContractAlertDrawerContentProps = {
  isEdition: false,
  currency: CurrencyEnum.Usd,
  isDataReady: false,
  scopeOptions: { products: [], filtersByProduct: {} },
  takenScopeKeys: new Set(),
}

export const ContractAlertDrawerContent = withForm({
  defaultValues: CONTRACT_ALERT_FORM_DEFAULTS,
  props: contractAlertDrawerContentDefaultProps,
  render: function ContractAlertDrawerContentRender({
    form,
    isEdition,
    currency,
    isDataReady,
    scopeOptions,
    takenScopeKeys,
  }) {
    const { translate } = useInternationalization()

    const alertType = useStore(form.store, (state) => state.values.alertType)
    const scopeProductCode = useStore(form.store, (state) => state.values.scope?.productCode)
    const thresholds = useStore(form.store, (state) => state.values.thresholds)
    const dynamicErrors = useStore(form.store, (state) => state.errorMap.onDynamic)
    const codeErrors = getThresholdCodeErrorsFromForm(dynamicErrors)
    const valueErrors = getThresholdCodeErrorsFromForm(dynamicErrors, 'value')

    const { setThresholds, setThresholdValue } = useMemo(() => createThresholdSetters(form), [form])

    const isWholeContractRequired = isWholeContractTaken(takenScopeKeys)
    const isScopeRemovable =
      alertType === ContractAlertTypeEnum.UsageAmount &&
      !isWholeContractRequired &&
      !isEdition &&
      !isEdition

    const alertTypeOptions = [
      {
        value: ContractAlertTypeEnum.UsageUnits,
        label: translate('text_17957785996152hmo3se75dd'),
      },
      {
        value: ContractAlertTypeEnum.UsageAmount,
        label: translate('text_1795778599615a5pz68n29ac'),
      },
    ]
    const scopeTypeOptions = [
      { value: PRODUCT_SCOPE_TYPE, label: translate('text_1783020794400si0ioidu0m5') },
    ]

    const getFilterCodes = (productCode: string): string[] =>
      (scopeOptions.filtersByProduct[productCode] ?? []).map(({ code }) => code)

    const products = buildProductsComboboxData(scopeOptions.products, translate, {
      valueKey: 'code',
      isProductDisabled: (productCode) =>
        !!alertType &&
        isProductDisabled(takenScopeKeys, alertType, productCode, getFilterCodes(productCode)),
      standaloneHeader: {
        titleKey: 'text_1795778599615lxospmknndt',
        captionKey: 'text_1790284386156njn3ittr9qj',
      },
    })

    const getFilters = (
      productCode: string,
    ): Array<{ value: string; label: string; disabled: boolean }> =>
      (scopeOptions.filtersByProduct[productCode] ?? []).map((filter) => ({
        value: filter.code,
        label: getDisplayName(filter),
        disabled:
          !!alertType && isFilterDisabled(takenScopeKeys, alertType, productCode, filter.code),
      }))

    const lockedWithProductFilters =
      alertType && scopeProductCode && !isEdition
        ? getLockedWithProductFilters(
            takenScopeKeys,
            alertType,
            scopeProductCode,
            getFilterCodes(scopeProductCode),
          )
        : undefined

    const truncateThresholdsToCurrency = (): void => {
      const formatters = defineNewBeforeChangeFormatter({ currency })

      form.setFieldValue('thresholds', (current) =>
        current.map((threshold) => ({
          ...threshold,
          value: formatValue(threshold.value, formatters) ?? threshold.value,
        })),
      )
    }

    const handleAlertTypeChange = ({ value }: { value: string | undefined }): void => {
      if (value === ContractAlertTypeEnum.UsageAmount) truncateThresholdsToCurrency()

      if (value === ContractAlertTypeEnum.UsageUnits || isWholeContractRequired) {
        form.setFieldValue('scope', { ...EMPTY_SCOPE_ENTRY })
        return
      }

      form.setFieldValue('scope', null)
    }

    const renderScope = (): JSX.Element | null => {
      if (!alertType) return null

      if (!isDataReady) {
        return (
          <div className="flex flex-col gap-3" data-test={CONTRACT_ALERT_DRAWER_SKELETON_TEST_ID}>
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-60" />
          </div>
        )
      }

      return (
        <form.Field name="scope">
          {(field) => {
            const errors: unknown = field.state.meta.errors
            const errorKey = isZodErrors(errors) ? errors[0]?.message : undefined
            const errorMessage = errorKey ? translate(errorKey) : undefined

            if (field.state.value) {
              return (
                <ScopeRow
                  key={alertType}
                  form={form}
                  fields="scope"
                  label={translate('text_17957785996155n8vwyzbs2k')}
                  typeOptions={scopeTypeOptions}
                  products={products}
                  getFilters={getFilters}
                  disabled={isEdition}
                  errorMessage={errorMessage}
                  lockedWithProductFilters={lockedWithProductFilters}
                  onRemove={isScopeRemovable ? () => field.handleChange(null) : undefined}
                />
              )
            }

            return (
              <>
                {isScopeRemovable && (
                  <Button
                    fitContent
                    startIcon="plus"
                    variant="inline"
                    data-test={CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID}
                    onClick={() => field.handleChange({ ...EMPTY_SCOPE_ENTRY })}
                  >
                    {translate('text_1795778599615shnkj1tzofb')}
                  </Button>
                )}
                {!!errorMessage && (
                  <div data-test={CONTRACT_ALERT_DRAWER_SCOPE_ERROR_TEST_ID}>
                    <Alert type="danger">{errorMessage}</Alert>
                  </div>
                )}
              </>
            )
          }}
        </form.Field>
      )
    }

    const renderThresholds = (): JSX.Element => {
      if (!isDataReady) return <Skeleton variant="text" className="w-full" />

      return (
        <AlertThresholds
          codeErrors={codeErrors}
          valueErrors={valueErrors}
          thresholds={thresholds}
          setThresholds={setThresholds}
          setThresholdValue={setThresholdValue}
          currency={currency}
          shouldHandleUnits={alertType === ContractAlertTypeEnum.UsageUnits}
          allowDecimalUnits
          maxRows={MAX_THRESHOLDS}
          recurringSwitchSubLabel={RECURRING_SWITCH_SUB_LABEL_KEY}
          codePlaceholder={THRESHOLD_CODE_PLACEHOLDER_KEY}
        />
      )
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(
              isEdition ? 'text_1795778599614c6czsklhiid' : 'text_1795778599614dqcrqlck2ut',
            )}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1795778599615tq3wk6xwo30')}
          </Typography>
        </div>

        <CenteredPage.SubsectionWrapper>
          <AlertNameAndCodeSection
            form={form}
            fields={{ name: 'name', code: 'code' }}
            nameLabel={translate('text_6419c64eace749372fc72b0f')}
            hasExistingCode={isEdition}
            isCodeDisabled={isEdition}
            descriptionKey={SETTINGS_DESCRIPTION_KEY}
          />

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_1795778599615rapn25l32r3')}
              description={translate('text_1795778599615lt61zfpb475')}
            />

            <form.AppField name="alertType" listeners={{ onChange: handleAlertTypeChange }}>
              {(field) => (
                <field.ComboBoxField
                  dataTest={CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID}
                  label={translate('text_1746631350478jqk347d5dy4')}
                  placeholder={translate('text_1746631350478bwa1swfpwky')}
                  disabled={isEdition}
                  data={alertTypeOptions}
                  helperText={
                    alertType === ContractAlertTypeEnum.UsageAmount &&
                    !isWholeContractRequired &&
                    !isEdition
                      ? translate('text_1795778599615zdlvj7tbk1i')
                      : undefined
                  }
                />
              )}
            </form.AppField>

            {renderScope()}
          </CenteredPage.PageSection>

          {!!alertType && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_1795778599615fga421zvhhs')}
                description={translate('text_1795778599616ayrbqz1dotj')}
              />
              {renderThresholds()}
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})
