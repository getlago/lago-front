import { useStore } from '@tanstack/react-form'
import { ReactNode, useEffect } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData, ComboboxDataGrouped } from '~/components/form/ComboBox'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import { EMPTY_SCOPE_ENTRY } from './scopeEntry'

export const SCOPE_ROW_TYPE_TEST_ID = 'scope-row-type'
export const SCOPE_ROW_PRODUCT_TEST_ID = 'scope-row-product'
export const SCOPE_ROW_FILTER_TEST_ID = 'scope-row-filter'
export const SCOPE_ROW_ALL_FILTERS_TEST_ID = 'scope-row-all-filters'
export const SCOPE_ROW_ADD_FILTERS_TEST_ID = 'scope-row-add-filters'
export const SCOPE_ROW_REMOVE_FILTER_TEST_ID = 'scope-row-remove-filter'
export const SCOPE_ROW_REMOVE_TEST_ID = 'scope-row-remove'
export const SCOPE_ROW_ERROR_TEST_ID = 'scope-row-error'

export type ScopeTypeOption = { value: string; label: string; disabled?: boolean }

type ScopeRowProps = {
  label: string
  typeOptions: ScopeTypeOption[]
  products: { data: ComboboxDataGrouped[]; renderGroupHeader: Record<string, ReactNode> }
  getFilters: (productCode: string) => BasicComboBoxData[]
  disabled: boolean
  errorMessage?: string
  lockedWithProductFilters?: boolean
  onRemove?: () => void
}

const scopeRowDefaultProps: ScopeRowProps = {
  label: '',
  typeOptions: [],
  products: { data: [], renderGroupHeader: {} },
  getFilters: () => [],
  disabled: false,
}

const getSingleAvailableValue = (
  options: Array<{ value: string; disabled?: boolean }>,
): string | undefined => {
  const available = options.filter((option) => !option.disabled)

  return available.length === 1 ? available[0].value : undefined
}

export const ScopeRow = withFieldGroup({
  defaultValues: EMPTY_SCOPE_ENTRY,
  props: scopeRowDefaultProps,
  render: function ScopeRowRender({
    group,
    label,
    typeOptions,
    products,
    getFilters,
    disabled,
    errorMessage,
    lockedWithProductFilters,
    onRemove,
  }) {
    const { translate } = useInternationalization()
    const type = useStore(group.store, (state) => state.values.type)
    const productCode = useStore(group.store, (state) => state.values.productCode)
    const productFilterCode = useStore(group.store, (state) => state.values.productFilterCode)
    const withProductFilters = useStore(group.store, (state) => state.values.withProductFilters)
    const isFilterAdded = useStore(group.store, (state) => !!state.values.isFilterAdded)

    const singleType = getSingleAvailableValue(typeOptions)
    const singleProduct = getSingleAvailableValue(products.data)
    const isFilterShown = isFilterAdded || !!productFilterCode
    const isRemovable = !!onRemove && !disabled

    useEffect(() => {
      if (disabled || !singleType || type) return

      group.setFieldValue('type', singleType)
    }, [disabled, singleType, type, group])

    useEffect(() => {
      if (disabled || !singleProduct || productCode) return

      group.setFieldValue('productCode', singleProduct)
    }, [disabled, singleProduct, productCode, group])

    useEffect(() => {
      if (disabled || isFilterShown || lockedWithProductFilters === undefined) return
      if (withProductFilters === lockedWithProductFilters) return

      group.setFieldValue('withProductFilters', lockedWithProductFilters)
    }, [disabled, isFilterShown, lockedWithProductFilters, withProductFilters, group])

    const resetFilter = (): void => {
      if (group.getFieldValue('isFilterAdded')) group.setFieldValue('isFilterAdded', false)
      if (group.getFieldValue('productFilterCode')) group.setFieldValue('productFilterCode', '')
    }

    const handleTypeChange = (): void => {
      group.setFieldValue('productCode', '')
      group.setFieldValue('withProductFilters', false)
      resetFilter()
    }

    const handleAddFilters = (): void => {
      group.setFieldValue('isFilterAdded', true)
      if (withProductFilters) group.setFieldValue('withProductFilters', false)
    }

    const renderFilterLine = (): JSX.Element => (
      <div className="flex items-center gap-2 pl-17">
        <group.AppField name="productFilterCode">
          {(field) => (
            <field.ComboBoxField
              dataTest={SCOPE_ROW_FILTER_TEST_ID}
              containerClassName="min-w-0 flex-1"
              disabled={disabled}
              placeholder={translate('text_179577859961594t3myw1i8v')}
              emptyText={productCode ? undefined : translate('text_179577859961560fs3k5zbv8')}
              data={productCode ? getFilters(productCode) : []}
            />
          )}
        </group.AppField>
        {!disabled && (
          <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
            <Button
              icon="trash"
              variant="quaternary"
              data-test={SCOPE_ROW_REMOVE_FILTER_TEST_ID}
              onClick={resetFilter}
            />
          </Tooltip>
        )}
      </div>
    )

    const renderAllFiltersLine = (): JSX.Element => (
      <div className={tw('flex items-center gap-2 pl-17', isRemovable && 'pr-13')}>
        <group.AppField name="withProductFilters">
          {(field) => (
            <field.CheckboxField
              dataTest={SCOPE_ROW_ALL_FILTERS_TEST_ID}
              className="min-w-0 flex-1"
              disabled={disabled || lockedWithProductFilters !== undefined}
              label={translate('text_1795778599615e6jzyqwv0ty')}
            />
          )}
        </group.AppField>
        {!disabled && (
          <Button
            fitContent
            startIcon="plus"
            variant="inline"
            disabled={withProductFilters && lockedWithProductFilters === undefined}
            data-test={SCOPE_ROW_ADD_FILTERS_TEST_ID}
            onClick={handleAddFilters}
          >
            {translate('text_65f8472df7593301061e27e2')}
          </Button>
        )}
      </div>
    )

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-grey-300 p-3">
        <div className="flex items-center gap-3">
          <Typography variant="body" color="grey700" className="w-14 shrink-0">
            {label}
          </Typography>
          <group.AppField name="type" listeners={{ onChange: handleTypeChange }}>
            {(field) => (
              <field.ComboBoxField
                dataTest={SCOPE_ROW_TYPE_TEST_ID}
                containerClassName="w-[178px] shrink-0"
                disabled={disabled || !!singleType}
                placeholder={translate('text_17957785996157gt6huxy5ka')}
                data={typeOptions}
              />
            )}
          </group.AppField>
          <Typography variant="body" color="grey700">
            {translate('text_66ab42d4ece7e6b7078993d0')}
          </Typography>
          <group.AppField name="productCode" listeners={{ onChange: resetFilter }}>
            {(field) => (
              <field.ComboBoxField
                dataTest={SCOPE_ROW_PRODUCT_TEST_ID}
                containerClassName="min-w-0 flex-1"
                disabled={disabled || !!singleProduct}
                placeholder={translate('text_179577859961567clw9dm4g9')}
                data={products.data}
                renderGroupHeader={products.renderGroupHeader}
              />
            )}
          </group.AppField>
          {isRemovable && (
            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                data-test={SCOPE_ROW_REMOVE_TEST_ID}
                onClick={onRemove}
              />
            </Tooltip>
          )}
        </div>

        {isFilterShown ? renderFilterLine() : renderAllFiltersLine()}

        {!!errorMessage && (
          <div data-test={SCOPE_ROW_ERROR_TEST_ID}>
            <Alert type="danger">{errorMessage}</Alert>
          </div>
        )}
      </div>
    )
  },
})
